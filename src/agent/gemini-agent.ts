import { GoogleGenerativeAI } from '@google/generative-ai';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';

export interface GeminiAgentConfig {
  googleApiKey: string;
  model: string;
  agentName: string;
  agentInstructions: string;
  mcpClient: MCPClient;
}

export interface AgentResponse {
  content: string;
  toolCalls?: any[];
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
  };
}

type Role = 'user' | 'assistant' | 'system';
type Message = { role: Role; content: string; };

export class GeminiAgent {
  private config: GeminiAgentConfig;
  private logger: Logger;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private tools: any[] = [];

  // per-conversation histories (in-memory)
  private histories: Map<string, Message[]> = new Map();

  constructor(config: GeminiAgentConfig) {
    this.config = config;
    this.logger = new Logger();
    this.genAI = new GoogleGenerativeAI(config.googleApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });

    // create default conversation
    this.histories.set('default', [{
      role: 'system',
      content: this.config.agentInstructions,
    }]);
  }

  async initialize(): Promise<void> {
    this.logger.info('🔧 Initializing Gemini AI Agent...');
    
    try {
      // Initialize MCP client and get available tools
      await this.config.mcpClient.connect();
      this.tools = await this.config.mcpClient.getAvailableTools();
      
      this.logger.info(`✅ Agent initialized with ${this.tools.length} tools available`);
      
      // ensure default conversation includes system message (if not already)
      if (!this.histories.has('default')) {
        this.histories.set('default', [{
          role: 'system',
          content: this.config.agentInstructions,
        }]);
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize agent:', error);
      throw error;
    }
  }

  /**
   * Process a user prompt within an optional conversationId.
   * If conversationId is omitted, 'default' conversation is used.
   */
  async processPrompt(userPrompt: string, conversationId?: string): Promise<string> {
    const convId = this.ensureHistory(conversationId);
    this.logger.info(`📝 Processing user prompt (conv=${convId}): ${userPrompt}`);
    
    try {
      const history = this.histories.get(convId)!;

      // Add user message to conversation history
      history.push({
        role: 'user',
        content: userPrompt,
      });

// Build model chat history — map 'system' role to 'user' because the Generative API
// does not accept messages with a 'system' role in the content array.
const modelHistory = history.map(msg => ({
  role: msg.role === 'system' ? 'user' : msg.role, // map system -> user
  parts: [{ text: msg.content }],
}));


      // Create chat with history
      const chat = this.model.startChat({
        history: modelHistory,
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      // Create a comprehensive prompt that includes tool information (keeps original instructions)
      const enhancedPrompt = this.createEnhancedPrompt(userPrompt);

      // Send the prompt to Gemini
      const result = await chat.sendMessage(enhancedPrompt);
      const response = await result.response;
      const assistantMessage = response.text();

      // Add assistant response to conversation history
      history.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Check if the response indicates tool usage
      if (this.shouldUseTools(assistantMessage, userPrompt) && this.tools.length > 0) {
        return await this.executeToolsAndRespond(userPrompt, assistantMessage, convId);
      }

      return assistantMessage;

    } catch (error) {
      this.logger.error('❌ Error processing prompt:', error);
      throw error;
    }
  }

  private createEnhancedPrompt(userPrompt: string): string {
    const toolDescriptions = (this.tools || []).map(tool => {
      // tools from MCP servers may use different shapes; be defensive
      const fn = tool.function || tool.inputSchema || {};
      const name = fn.name || tool.name || (fn as any).id || 'unknown_tool';
      const desc = fn.description || tool.description || '';
      return `- ${name}: ${desc}`;
    }).join('\n');

    return `${this.config.agentInstructions}

Available tools:
${toolDescriptions}

User request: ${userPrompt}

Please respond naturally and if you need to use any tools, mention them clearly in your response.`;
  }

  private shouldUseTools(assistantMessage: string, userPrompt: string): boolean {
    const toolKeywords = [
      'scrape', 'extract', 'web', 'url', 'website', 'data',
      'email', 'send', 'mail', 'whatsapp', 'slack', 'message',
      'calendar', 'event', 'schedule', 'crm', 'contact',
      'file', 'upload', 'database', 'query', 'webhook'
    ];
    const hasToolKeywords = toolKeywords.some(keyword => 
      userPrompt.toLowerCase().includes(keyword) || 
      assistantMessage.toLowerCase().includes(keyword)
    );
    
    return hasToolKeywords && this.tools.length > 0;
  }

  /**
   * Executes relevant tools and returns a consolidated response. Adds tool-results to conversation history.
   */
  private async executeToolsAndRespond(userPrompt: string, assistantMessage: string, conversationId?: string): Promise<string> {
    const convId = this.ensureHistory(conversationId);
    const history = this.histories.get(convId)!;

    try {
      this.logger.info(`🔧 Executing tools for conv=${convId} based on user request...`);
      
      const toolResults: Array<{ tool: string; result: any }> = [];

      // --- Web scraping tool ---
      if (userPrompt.toLowerCase().includes('scrape') || userPrompt.toLowerCase().includes('url')) {
        const urlMatch = userPrompt.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          this.logger.info(`🔧 Attempting web_scraper for URL: ${url}`);

          // ensure arguments property exists (MCP type may require it)
          const execReq = { name: 'web_scraper', arguments: { url } };
          try {
            const result = await this.config.mcpClient.executeTool(execReq as any);
            toolResults.push({ tool: 'web_scraper', result });
            // append tool results to history as system message
            history.push({ role: 'system', content: `Tool web_scraper result: ${JSON.stringify(result)}` });
          } catch (err) {
            this.logger.error('⚠️ web_scraper execution failed:', err);
          }
        }
      }

      // --- Data extraction tool ---
      if (userPrompt.toLowerCase().includes('extract') || userPrompt.toLowerCase().includes('email')) {
        const extractionType = this.determineExtractionType(userPrompt);
        if (extractionType) {
          this.logger.info(`🔧 Executing data_extractor for type: ${extractionType}`);

          // sample content fallback; in real flow, use scraped content
          const sampleContent = "Contact us at example@test.com or visit https://example.com for more info.";
          const execReq = { 
            name: 'data_extractor', 
            arguments: { content: sampleContent, extraction_type: extractionType } 
          };
          try {
            const result = await this.config.mcpClient.executeTool(execReq as any);
            toolResults.push({ tool: 'data_extractor', result });
            history.push({ role: 'system', content: `Tool data_extractor result: ${JSON.stringify(result)}` });
          } catch (err) {
            this.logger.error('⚠️ data_extractor execution failed:', err);
          }
        }
      }

      // --- Composio Email tool ---
      if (userPrompt.toLowerCase().includes('send email') || userPrompt.toLowerCase().includes('email')) {
        const emailMatch = userPrompt.match(/send email to ([^\s]+@[^\s]+)/i);
        if (emailMatch) {
          const email = emailMatch[1];
          const subject = this.extractEmailSubject(userPrompt);
          const body = this.extractEmailBody(userPrompt);
          
          if (subject && body) {
            this.logger.info(`📧 Attempting to send email to: ${email}`);
            
            // Clean up the subject and body - remove extra quotes and formatting
            const cleanSubject = subject.replace(/['"]/g, '').trim();
            const cleanBody = body.replace(/['"]/g, '').trim();
            
            const execReq = { 
              name: 'composio_send_email', 
              arguments: { 
                to: email, 
                subject: cleanSubject, 
                body: cleanBody 
              } 
            };
            try {
              const result = await this.config.mcpClient.executeTool(execReq as any);
              toolResults.push({ tool: 'composio_send_email', result });
              history.push({ role: 'system', content: `Tool composio_send_email result: ${JSON.stringify(result)}` });
            } catch (err) {
              this.logger.error('⚠️ composio_send_email execution failed:', err);
            }
          }
        }
      }

      // --- Composio WhatsApp tool ---
      if (userPrompt.toLowerCase().includes('whatsapp') || userPrompt.toLowerCase().includes('send message')) {
        const phoneMatch = userPrompt.match(/\+?[\d\s\-\(\)]+/);
        if (phoneMatch) {
          const phoneNumber = phoneMatch[0].replace(/[\s\-\(\)]/g, '');
          const message = this.extractMessageContent(userPrompt);
          
          if (message) {
            this.logger.info(`📱 Attempting to send WhatsApp message to: ${phoneNumber}`);
            
            const execReq = { 
              name: 'composio_whatsapp_message', 
              arguments: { 
                phoneNumber: `+${phoneNumber}`, 
                message 
              } 
            };
            try {
              const result = await this.config.mcpClient.executeTool(execReq as any);
              toolResults.push({ tool: 'composio_whatsapp_message', result });
              history.push({ role: 'system', content: `Tool composio_whatsapp_message result: ${JSON.stringify(result)}` });
            } catch (err) {
              this.logger.error('⚠️ composio_whatsapp_message execution failed:', err);
            }
          }
        }
      }

      // --- Composio Calendar tool ---
      if (userPrompt.toLowerCase().includes('calendar') || userPrompt.toLowerCase().includes('schedule') || userPrompt.toLowerCase().includes('event')) {
        const eventTitle = this.extractEventTitle(userPrompt);
        const eventTime = this.extractEventTime(userPrompt);
        
        if (eventTitle && eventTime) {
          this.logger.info(`📅 Attempting to create calendar event: ${eventTitle}`);
          
          const execReq = { 
            name: 'composio_calendar_event', 
            arguments: { 
              title: eventTitle, 
              startTime: eventTime, 
              endTime: new Date(new Date(eventTime).getTime() + 60 * 60 * 1000).toISOString() // 1 hour later
            } 
          };
          try {
            const result = await this.config.mcpClient.executeTool(execReq as any);
            toolResults.push({ tool: 'composio_calendar_event', result });
            history.push({ role: 'system', content: `Tool composio_calendar_event result: ${JSON.stringify(result)}` });
          } catch (err) {
            this.logger.error('⚠️ composio_calendar_event execution failed:', err);
          }
        }
      }

      // If tools produced results, ask the model to synthesize them
      if (toolResults.length > 0) {
        const toolSummary = toolResults.map(r => `${r.tool}: ${JSON.stringify(r.result)}`).join('\n');

        const finalPrompt = `Based on the tool execution results below, provide a comprehensive response to: "${userPrompt}"

Tool Results:
${toolSummary}

Please provide a helpful and informative response.`;

        // build history for model (include system/tool messages)
// build history for model — map 'system' -> 'user' to avoid API 400 errors
const chatHistory = history.map(h => ({
  role: h.role === 'system' ? 'user' : h.role,
  parts: [{ text: h.content }],
}));

        const chat = this.model.startChat({
          history: chatHistory,
          generationConfig: { maxOutputTokens: 2048 },
        });

        const finalResult = await chat.sendMessage(finalPrompt);
        const finalResponse = await finalResult.response;
        const finalText = finalResponse.text();

        // Add final assistant response to conversation history
        history.push({ role: 'assistant', content: finalText });

        return finalText;
      }

      // If no tool results, fall back to original assistant message
      return assistantMessage;

    } catch (error) {
      this.logger.error('❌ Error executing tools:', error);
      return assistantMessage;
    }
  }

  private determineExtractionType(userPrompt: string): string | null {
    const prompt = userPrompt.toLowerCase();
    if (prompt.includes('email')) return 'emails';
    if (prompt.includes('url')) return 'urls';
    if (prompt.includes('date')) return 'dates';
    if (prompt.includes('name')) return 'names';
    return null;
  }

  private extractEmailSubject(userPrompt: string): string {
    // Look for "subject" keyword
    const subjectMatch = userPrompt.match(/subject[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (subjectMatch) return subjectMatch[1].trim();
    
    // Look for "with subject" pattern
    const withSubjectMatch = userPrompt.match(/with subject[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (withSubjectMatch) return withSubjectMatch[1].trim();
    
    // Try to extract subject from context
    if (userPrompt.includes('about') || userPrompt.includes('regarding')) {
      const aboutMatch = userPrompt.match(/(?:about|regarding)[:\s]+['"]?([^,\n]+?)['"]?/i);
      if (aboutMatch) return aboutMatch[1].trim();
    }
    
    return 'Message from AI Assistant';
  }

  private extractEmailBody(userPrompt: string): string {
    // Look for "body" keyword
    const bodyMatch = userPrompt.match(/body[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (bodyMatch) return bodyMatch[1].trim();
    
    // Look for "and body" pattern
    const andBodyMatch = userPrompt.match(/and body[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (andBodyMatch) return andBodyMatch[1].trim();
    
    // Try to extract message content
    const messageMatch = userPrompt.match(/message[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (messageMatch) return messageMatch[1].trim();
    
    // Look for content after "saying" or "with message"
    const sayingMatch = userPrompt.match(/(?:saying|with message)[:\s]+['"]?([^,\n]+?)['"]?/i);
    if (sayingMatch) return sayingMatch[1].trim();
    
    // Fallback to a generic message
    return 'This is an automated message sent by your AI assistant.';
  }

  private extractMessageContent(userPrompt: string): string {
    const messageMatch = userPrompt.match(/message[:\s]+([^,\n]+)/i);
    if (messageMatch) return messageMatch[1].trim();
    
    // Try to extract content after "saying" or "with"
    const sayingMatch = userPrompt.match(/(?:saying|with)[:\s]+([^,\n]+)/i);
    if (sayingMatch) return sayingMatch[1].trim();
    
    return 'Hello from your AI assistant!';
  }

  private extractEventTitle(userPrompt: string): string {
    const titleMatch = userPrompt.match(/event[:\s]+([^,\n]+)/i);
    if (titleMatch) return titleMatch[1].trim();
    
    // Try to extract title from context
    if (userPrompt.includes('meeting') || userPrompt.includes('appointment')) {
      const meetingMatch = userPrompt.match(/(?:meeting|appointment)[:\s]+([^,\n]+)/i);
      if (meetingMatch) return meetingMatch[1].trim();
    }
    
    return 'AI Assistant Event';
  }

  private extractEventTime(userPrompt: string): string {
    const timeMatch = userPrompt.match(/(?:at|on|for)[:\s]+([^,\n]+)/i);
    if (timeMatch) {
      const timeStr = timeMatch[1].trim();
      // Try to parse common time formats
      const parsedTime = new Date(timeStr);
      if (!isNaN(parsedTime.getTime())) {
        return parsedTime.toISOString();
      }
    }
    
    // Default to 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  // Ensure a history exists for the conversationId and return the id used
  private ensureHistory(conversationId?: string): string {
    const id = conversationId || 'default';
    if (!this.histories.has(id)) {
      this.histories.set(id, [{
        role: 'system',
        content: this.config.agentInstructions,
      }]);
    }
    return id;
  }

  /**
   * Return the conversation history for a given conversationId (or default if omitted).
   */
  getConversationHistory(conversationId?: string): Message[] {
    const id = this.ensureHistory(conversationId);
    // return a shallow copy to avoid outside mutation
    return [...this.histories.get(id)!];
  }

  /**
   * Clear the conversation history for a given conversationId (or default).
   */
  clearConversationHistory(conversationId?: string): void {
    const id = conversationId || 'default';
    this.histories.set(id, [{
      role: 'system',
      content: this.config.agentInstructions,
    }]);
    this.logger.info(`🗑️ Conversation history cleared for ${id}`);
  }
}
