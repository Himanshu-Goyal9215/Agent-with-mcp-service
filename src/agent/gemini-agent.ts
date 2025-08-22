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

export class GeminiAgent {
  private config: GeminiAgentConfig;
  private logger: Logger;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private tools: any[] = [];
  private conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> = [];

  constructor(config: GeminiAgentConfig) {
    this.config = config;
    this.logger = new Logger();
    this.genAI = new GoogleGenerativeAI(config.googleApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
  }

  async initialize(): Promise<void> {
    this.logger.info('🔧 Initializing Gemini AI Agent...');
    
    try {
      // Initialize MCP client and get available tools
      await this.config.mcpClient.connect();
      this.tools = await this.config.mcpClient.getAvailableTools();
      
      this.logger.info(`✅ Agent initialized with ${this.tools.length} tools available`);
      
      // Add system message to conversation history
      this.conversationHistory.push({
        role: 'system',
        content: this.config.agentInstructions,
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize agent:', error);
      throw error;
    }
  }

  async processPrompt(userPrompt: string): Promise<string> {
    this.logger.info(`📝 Processing user prompt: ${userPrompt}`);
    
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userPrompt,
      });

      // Create the conversation for Gemini
      const chat = this.model.startChat({
        history: this.conversationHistory.slice(1).map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      // Create a comprehensive prompt that includes tool information
      const enhancedPrompt = this.createEnhancedPrompt(userPrompt);
      
      // Send the prompt to Gemini
      const result = await chat.sendMessage(enhancedPrompt);
      const response = await result.response;
      const assistantMessage = response.text();
      
      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Check if the response indicates tool usage
      if (this.shouldUseTools(assistantMessage, userPrompt)) {
        return await this.executeToolsAndRespond(userPrompt, assistantMessage);
      }

      return assistantMessage;

    } catch (error) {
      this.logger.error('❌ Error processing prompt:', error);
      throw error;
    }
  }

  private createEnhancedPrompt(userPrompt: string): string {
    const toolDescriptions = this.tools.map(tool => {
      const functionDef = tool.function;
      return `- ${functionDef.name}: ${functionDef.description}`;
    }).join('\n');

    return `${this.config.agentInstructions}

Available tools:
${toolDescriptions}

User request: ${userPrompt}

Please respond naturally and if you need to use any tools, mention them clearly in your response.`;
  }

  private shouldUseTools(assistantMessage: string, userPrompt: string): boolean {
    const toolKeywords = ['scrape', 'extract', 'web', 'url', 'website', 'data'];
    const hasToolKeywords = toolKeywords.some(keyword => 
      userPrompt.toLowerCase().includes(keyword) || 
      assistantMessage.toLowerCase().includes(keyword)
    );
    
    return hasToolKeywords && this.tools.length > 0;
  }

  private async executeToolsAndRespond(userPrompt: string, assistantMessage: string): Promise<string> {
    try {
      this.logger.info('🔧 Executing tools based on user request...');
      
      let toolResults = [];
      
      // Check if web scraping is needed
      if (userPrompt.toLowerCase().includes('scrape') || userPrompt.toLowerCase().includes('url')) {
        const urlMatch = userPrompt.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          this.logger.info(`🔧 Executing web_scraper for URL: ${url}`);
          
          const result = await this.config.mcpClient.executeTool({
            name: 'web_scraper',
            arguments: { url },
          });
          
          toolResults.push({
            tool: 'web_scraper',
            result: result,
          });
        }
      }
      
      // Check if data extraction is needed
      if (userPrompt.toLowerCase().includes('extract') || userPrompt.toLowerCase().includes('email')) {
        const extractionType = this.determineExtractionType(userPrompt);
        if (extractionType) {
          this.logger.info(`🔧 Executing data_extractor for type: ${extractionType}`);
          
          // For now, use sample content - in a real scenario, this would come from the web scraping
          const sampleContent = "Contact us at example@test.com or visit https://example.com for more info.";
          
          const result = await this.config.mcpClient.executeTool({
            name: 'data_extractor',
            arguments: { 
              content: sampleContent, 
              extraction_type: extractionType 
            },
          });
          
          toolResults.push({
            tool: 'data_extractor',
            result: result,
          });
        }
      }
      
      // Generate final response incorporating tool results
      if (toolResults.length > 0) {
        const toolSummary = toolResults.map(result => 
          `${result.tool}: ${JSON.stringify(result.result)}`
        ).join('\n');
        
        const finalPrompt = `Based on the tool execution results below, provide a comprehensive response to: "${userPrompt}"

Tool Results:
${toolSummary}

Please provide a helpful and informative response.`;
        
        const chat = this.model.startChat();
        const finalResult = await chat.sendMessage(finalPrompt);
        const finalResponse = await finalResult.response;
        
        // Add final response to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: finalResponse.text(),
        });
        
        return finalResponse.text();
      }
      
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

  getConversationHistory(): Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> {
    return [...this.conversationHistory];
  }

  clearConversationHistory(): void {
    this.conversationHistory = [{
      role: 'system',
      content: this.config.agentInstructions,
    }];
    this.logger.info('🗑️ Conversation history cleared');
  }
}
