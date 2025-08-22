import { openai } from '@ai-sdk/openai';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';
import { Tool, ToolCall } from '@ai-sdk/core';

export interface AIAgentConfig {
  openaiApiKey: string;
  model: string;
  agentName: string;
  agentInstructions: string;
  mcpClient: MCPClient;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
  };
}

export class AIAgent {
  private config: AIAgentConfig;
  private logger: Logger;
  private tools: Tool[] = [];
  private conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: ToolCall[];
  }> = [];

  constructor(config: AIAgentConfig) {
    this.config = config;
    this.logger = new Logger();
  }

  async initialize(): Promise<void> {
    this.logger.info('🔧 Initializing AI Agent...');
    
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

      // Create the conversation messages for OpenAI
      const messages = this.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.toolCalls && { toolCalls: msg.toolCalls }),
      }));

      // Call OpenAI with tools
      const response = await openai.chat({
        model: this.config.model,
        messages,
        tools: this.tools.length > 0 ? this.tools : undefined,
        toolChoice: this.tools.length > 0 ? 'auto' : 'none',
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from OpenAI');
      }

      // Handle tool calls if any
      if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
        this.logger.info(`🔧 Executing ${assistantMessage.toolCalls.length} tool calls...`);
        
        const toolResults = await this.executeToolCalls(assistantMessage.toolCalls);
        
        // Add tool results to conversation
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          toolCalls: assistantMessage.toolCalls,
        });

        // Add tool results as user message
        this.conversationHistory.push({
          role: 'user',
          content: `Tool results: ${JSON.stringify(toolResults)}`,
        });

        // Get final response after tool execution
        const finalResponse = await this.getFinalResponse();
        return finalResponse;
      }

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content || '',
      });

      return assistantMessage.content || 'No response generated';

    } catch (error) {
      this.logger.error('❌ Error processing prompt:', error);
      throw error;
    }
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        this.logger.info(`🔧 Executing tool: ${toolCall.toolName}`);
        
        const result = await this.config.mcpClient.executeTool({
          name: toolCall.toolName,
          arguments: toolCall.args,
        });
        
        results.push({
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          result,
        });
        
      } catch (error) {
        this.logger.error(`❌ Error executing tool ${toolCall.toolName}:`, error);
        results.push({
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }

  private async getFinalResponse(): Promise<string> {
    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.toolCalls && { toolCalls: msg.toolCalls }),
    }));

    const response = await openai.chat({
      model: this.config.model,
      messages,
    });

    const finalMessage = response.choices[0]?.message;
    if (!finalMessage) {
      throw new Error('No final response from OpenAI');
    }

    // Add final response to conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: finalMessage.content || '',
    });

    return finalMessage.content || 'No final response generated';
  }

  getConversationHistory(): Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: ToolCall[];
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
