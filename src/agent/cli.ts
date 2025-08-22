#!/usr/bin/env node

import * as readline from 'readline';
import { config } from 'dotenv';
import { GeminiAgent } from './gemini-agent.js';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';
// ExampleMCPServer not needed for CLI

// Load environment variables
config();

const logger = new Logger();

class AgentCLI {
  private agent: GeminiAgent;
  private mcpClient: MCPClient;
  private rl: readline.Interface;
  private isRunning: boolean = false;

  constructor() {
    this.mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
      serverName: process.env.MCP_SERVER_NAME || 'example-mcp-server',
    });

    this.agent = new GeminiAgent({
      googleApiKey: process.env.GOOGLE_API_KEY!,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      agentInstructions: process.env.AGENT_INSTRUCTIONS || 'You are a helpful AI assistant that can access web data and perform various tasks.',
      mcpClient: this.mcpClient,
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 AI Agent > ',
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting AI Agent CLI...');
      
      // Check if Google API key is set
      if (!process.env.GOOGLE_API_KEY) {
        logger.error('❌ GOOGLE_API_KEY environment variable is not set!');
        logger.info('💡 Please set your Google Gemini API key in the .env file');
        process.exit(1);
      }

      // Initialize the agent
      await this.agent.initialize();
      
      this.isRunning = true;
      this.showWelcomeMessage();
      this.showHelp();
      
      // Start the interactive loop
      this.rl.prompt();
      this.rl.on('line', (input) => this.handleInput(input.trim()));
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      logger.error('❌ Failed to start CLI:', error);
      process.exit(1);
    }
  }

  private showWelcomeMessage(): void {
    console.log('\n🤖 Welcome to the AI Agent CLI!');
    console.log('💡 Type "help" to see available commands');
    console.log('💬 Start chatting with your AI agent below\n');
  }

  private showHelp(): void {
    console.log('\n📚 Available Commands:');
    console.log('  help                    - Show this help message');
    console.log('  clear                   - Clear conversation history');
    console.log('  history                 - Show conversation history');
    console.log('  tools                   - List available MCP tools');
    console.log('  resources               - List available MCP resources');
    console.log('  prompts                 - List available MCP prompts');
    console.log('  quit, exit, bye        - Exit the CLI');
    console.log('  <any other text>       - Send a message to the AI agent');
    console.log('');
  }

  private async handleInput(input: string): Promise<void> {
    if (!input) {
      this.rl.prompt();
      return;
    }

    const command = input.toLowerCase();

    try {
      switch (command) {
        case 'help':
          this.showHelp();
          break;
          
        case 'clear':
          this.agent.clearConversationHistory();
          console.log('🗑️  Conversation history cleared!\n');
          break;
          
        case 'history':
          this.showConversationHistory();
          break;
          
        case 'tools':
          await this.showAvailableTools();
          break;
          
        case 'resources':
          await this.showAvailableResources();
          break;
          
        case 'prompts':
          await this.showAvailablePrompts();
          break;
          
        case 'quit':
        case 'exit':
        case 'bye':
          await this.shutdown();
          return;
          
        default:
          // Treat as a user message to the AI agent
          await this.processUserMessage(input);
          break;
      }
    } catch (error) {
      logger.error('❌ Error handling input:', error);
      console.log('❌ An error occurred. Please try again.\n');
    }

    if (this.isRunning) {
      this.rl.prompt();
    }
  }

  private async processUserMessage(message: string): Promise<void> {
    try {
      console.log(`\n👤 You: ${message}`);
      console.log('🤖 AI Agent is thinking...\n');
      
      const response = await this.agent.processPrompt(message);
      
      console.log(`🤖 AI Agent: ${response}\n`);
      
    } catch (error) {
      logger.error('❌ Error processing message:', error);
      console.log('❌ Failed to get response from AI agent. Please try again.\n');
    }
  }

  private showConversationHistory(): void {
    const history = this.agent.getConversationHistory();
    
    if (history.length <= 1) { // Only system message
      console.log('📝 No conversation history yet.\n');
      return;
    }
    
    console.log('\n📝 Conversation History:');
    console.log('─'.repeat(50));
    
    history.slice(1).forEach((message, index) => {
      const role = message.role === 'user' ? '👤 You' : '🤖 AI Agent';
      const content = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');
      console.log(`${index}. ${role}: ${content}`);
    });
    
    console.log('─'.repeat(50));
    console.log('');
  }

  private async showAvailableTools(): Promise<void> {
    try {
      const tools = await this.mcpClient.getAvailableTools();
      
      if (tools.length === 0) {
        console.log('🔧 No tools available from MCP server.\n');
        return;
      }
      
      console.log('\n🔧 Available Tools:');
      console.log('─'.repeat(50));
      
      tools.forEach((tool, index) => {
        const functionDef = tool.function;
        console.log(`${index + 1}. ${functionDef.name}`);
        console.log(`   Description: ${functionDef.description}`);
        console.log(`   Parameters: ${JSON.stringify(functionDef.parameters, null, 2)}`);
        console.log('');
      });
      
      console.log('─'.repeat(50));
      console.log('');
      
    } catch (error) {
      console.log('❌ Failed to fetch tools from MCP server.\n');
    }
  }

  private async showAvailableResources(): Promise<void> {
    try {
      const resources = await this.mcpClient.listResources();
      
      if (resources.length === 0) {
        console.log('📚 No resources available from MCP server.\n');
        return;
      }
      
      console.log('\n📚 Available Resources:');
      console.log('─'.repeat(50));
      
      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.name}`);
        console.log(`   URI: ${resource.uri}`);
        console.log(`   Description: ${resource.description}`);
        console.log(`   Type: ${resource.mime_type}`);
        console.log('');
      });
      
      console.log('─'.repeat(50));
      console.log('');
      
    } catch (error) {
      console.log('❌ Failed to fetch resources from MCP server.\n');
    }
  }

  private async showAvailablePrompts(): Promise<void> {
    try {
      const prompts = await this.mcpClient.listPrompts();
      
      if (prompts.length === 0) {
        console.log('💬 No prompts available from MCP server.\n');
        return;
      }
      
      console.log('\n💬 Available Prompts:');
      console.log('─'.repeat(50));
      
      prompts.forEach((prompt, index) => {
        console.log(`${index + 1}. ${prompt.name}`);
        console.log(`   Description: ${prompt.description}`);
        console.log(`   Version: ${prompt.version}`);
        console.log('');
      });
      
      console.log('─'.repeat(50));
      console.log('');
      
    } catch (error) {
      console.log('❌ Failed to fetch prompts from MCP server.\n');
    }
  }

  private async shutdown(): Promise<void> {
    this.isRunning = false;
    console.log('\n👋 Goodbye! Shutting down AI Agent CLI...');
    
    try {
      this.mcpClient.disconnect();
      this.rl.close();
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
    
    process.exit(0);
  }
}

// Start the CLI if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('cli.ts')) {
  const cli = new AgentCLI();
  cli.start();
}
