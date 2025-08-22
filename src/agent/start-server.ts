#!/usr/bin/env node

import { ExampleMCPServer } from './example-mcp-server.js';
import { Logger } from './logger.js';

const logger = new Logger();

async function main() {
  try {
    const port = parseInt(process.env.MCP_SERVER_PORT || '3000', 10);
    
    logger.info('🚀 Starting Example MCP Server...');
    logger.info(`📡 Server will run on port ${port}`);
    logger.info('💡 This server provides web scraping and data extraction tools');
    logger.info('🔗 The AI Agent will connect to this server to access tools');
    logger.info('');
    
    const server = new ExampleMCPServer(port);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      server.stop();
    });
    
    process.on('SIGTERM', () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      server.stop();
    });
    
    // Start the server
    server.start();
    
    logger.info('✅ Example MCP Server is now running!');
    logger.info('🤖 You can now start the AI Agent in another terminal');
    logger.info('💡 Use Ctrl+C to stop the server');
    
  } catch (error) {
    logger.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('start-server.ts')) {
  main();
}
