#!/usr/bin/env node

import { config } from 'dotenv';
import { GeminiAgent } from './gemini-agent.js';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';

// Load environment variables
config();

const logger = new Logger();

async function testGeminiAgent() {
  try {
    logger.info('🧪 Testing Gemini AI Agent...');
    
    // Check if Google API key is set
    if (!process.env.GOOGLE_API_KEY) {
      logger.error('❌ GOOGLE_API_KEY environment variable is not set!');
      logger.info('💡 Please set your Google Gemini API key in the .env file');
      process.exit(1);
    }
    
    // Initialize MCP Client (mock for testing)
    const mcpClient = new MCPClient({
      serverUrl: 'http://localhost:3000',
      serverName: 'simple-mcp-server',
    });
    
    // Initialize Gemini Agent
    const agent = new GeminiAgent({
      googleApiKey: process.env.GOOGLE_API_KEY!,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: 'Test Gemini Agent',
      agentInstructions: 'You are a helpful AI assistant for testing purposes.',
      mcpClient,
    });
    
    // Initialize the agent
    await agent.initialize();
    
    // Test a simple prompt
    const testPrompt = "Hello! Can you tell me what you can do?";
    logger.info(`🤖 Testing prompt: ${testPrompt}`);
    
    const response = await agent.processPrompt(testPrompt);
    logger.info(`💬 Gemini Response: ${response}`);
    
    logger.info('✅ Gemini Agent test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error testing Gemini agent:', error);
    process.exit(1);
  }
}

// Run the test
testGeminiAgent();
