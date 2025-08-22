#!/usr/bin/env node

import { config } from 'dotenv';
import { GeminiAgent } from './gemini-agent.js';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';

// Load environment variables
config();

const logger = new Logger();

async function main() {
  try {
    logger.info('🚀 Starting AI Agent with MCP Integration...');
    
    // Initialize MCP Client
    const mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
      serverName: process.env.MCP_SERVER_NAME || 'apify-mcp-server',
    });
    
    // Initialize AI Agent
    const agent = new GeminiAgent({
      googleApiKey: process.env.GOOGLE_API_KEY!,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      agentInstructions: process.env.AGENT_INSTRUCTIONS || 'You are a helpful AI assistant.',
      mcpClient,
    });
    
    // Start the agent
    await agent.initialize();
    
    // Example usage
    const prompt = process.argv[2] || "Hello! What can you help me with today?";
    logger.info(`🤖 Processing prompt: ${prompt}`);
    
    const response = await agent.processPrompt(prompt);
    logger.info(`💬 Agent Response: ${response}`);
    
  } catch (error) {
    logger.error('❌ Error starting agent:', error);
    process.exit(1);
  }
}

// Start the agent if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  main();
}
