import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { GeminiAgent } from './gemini-agent.js';
import { MCPClient } from './mcp-client.js';
import { Logger } from './logger.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;
const logger = new Logger();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Initialize agent
let agent: GeminiAgent;
let isInitialized = false;

async function initializeAgent() {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }

    const mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
      serverName: process.env.MCP_SERVER_NAME || 'real-mcp-server',
    });

    agent = new GeminiAgent({
      googleApiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      agentInstructions: process.env.AGENT_INSTRUCTIONS || 'You are a helpful AI assistant that can access web data and perform various tasks.',
      mcpClient,
    });

    await agent.initialize();
    isInitialized = true;
    logger.info('✅ AI Agent initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize agent:', error);
    isInitialized = false;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agentInitialized: isInitialized,
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/chat - Send a message to the AI agent',
      'GET /api/tools - Get available MCP tools',
      'POST /api/scrape - Scrape a website directly',
      'GET /api/status - Get agent status and capabilities'
    ]
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({
        error: 'Agent not initialized',
        message: 'Please wait for the agent to initialize or check the server logs'
      });
    }

    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Please provide a message in the request body'
      });
    }

    logger.info(`📝 Processing chat message: ${message}`);
    
    const response = await agent.processPrompt(message);
    
    res.json({
      success: true,
      response,
      conversationId: conversationId || Date.now().toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available tools
app.get('/api/tools', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({
        error: 'Agent not initialized'
      });
    }

    const tools = await agent['config'].mcpClient.getAvailableTools();
    res.json({
      success: true,
      tools,
      count: tools.length
    });

  } catch (error) {
    logger.error('❌ Error getting tools:', error);
    res.status(500).json({
      error: 'Failed to get tools'
    });
  }
});

// Direct website scraping endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a URL in the request body'
      });
    }

    logger.info(`🌐 Direct scraping request for: ${url}`);
    
    // Use the MCP client directly for scraping
    const mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
      serverName: process.env.MCP_SERVER_NAME || 'real-mcp-server',
    });

    await mcpClient.connect();
    const result = await mcpClient.executeTool({
      name: 'web_scraper',
      arguments: { url }
    });

    res.json({
      success: true,
      scrapedData: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error in scrape endpoint:', error);
    res.status(500).json({
      error: 'Failed to scrape website',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get agent status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: {
      initialized: isInitialized,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
      capabilities: [
        'Web scraping',
        'Data extraction',
        'Natural language processing',
        'Conversation memory'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 Web API Server running on port ${PORT}`);
  logger.info(`📡 API endpoints available at http://localhost:${PORT}/api`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize the agent
  await initializeAgent();
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\n🛑 Shutting down Web API Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Shutting down Web API Server...');
  process.exit(0);
});
