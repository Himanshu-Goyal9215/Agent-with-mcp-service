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

// --- Aggregated MCP client wrapper ---
// Minimal wrapper implementing the methods used by GeminiAgent: connect(), getAvailableTools(), executeTool()
class AggregatedMCPClient {
  private enhancedClient?: MCPClient;
  private firecrawlClient?: MCPClient;
  private composioClient?: MCPClient;
  private logger: Logger;

  constructor(opts: { enhancedClient?: MCPClient; firecrawlClient?: MCPClient; composioClient?: MCPClient }) {
    this.enhancedClient = opts.enhancedClient;
    this.firecrawlClient = opts.firecrawlClient;
    this.composioClient = opts.composioClient;
    this.logger = new Logger();
  }

  // connect all clients where possible
  async connect(): Promise<void> {
    const connectPromises: Promise<void>[] = [];

    if (this.enhancedClient) {
      connectPromises.push(this.enhancedClient.connect().catch(err => {
        this.logger.error('⚠️ Enhanced MCP client connect failed:', err);
      }));
    }
    if (this.firecrawlClient) {
      connectPromises.push(this.firecrawlClient.connect().catch(err => {
        this.logger.error('⚠️ Firecrawl MCP client connect failed:', err);
      }));
    }
    if (this.composioClient) {
      connectPromises.push(this.composioClient.connect().catch(err => {
        this.logger.error('⚠️ Composio MCP client connect failed:', err);
      }));
    }

    // Wait for all attempts but don't throw if one fails — let agent initialize with available tools.
    await Promise.all(connectPromises);
  }

  // Merge tools from all servers
  async getAvailableTools(): Promise<any[]> {
    const tools: any[] = [];

    try {
      if (this.enhancedClient) {
        const enhancedTools = await this.enhancedClient.getAvailableTools().catch(err => {
          this.logger.error('⚠️ Failed to get tools from enhanced client:', err);
          return [];
        });
        if (Array.isArray(enhancedTools)) tools.push(...enhancedTools);
      }
    } catch (e) {
      this.logger.error('Error fetching enhanced tools', e);
    }

    try {
      if (this.firecrawlClient) {
        const firecrawlTools = await this.firecrawlClient.getAvailableTools().catch(err => {
          this.logger.error('⚠️ Failed to get tools from firecrawl client:', err);
          return [];
        });
        if (Array.isArray(firecrawlTools)) tools.push(...firecrawlTools);
      }
    } catch (e) {
      this.logger.error('Error fetching firecrawl tools', e);
    }

    try {
      if (this.composioClient) {
        const composioTools = await this.composioClient.getAvailableTools().catch(err => {
          this.logger.error('⚠️ Failed to get tools from composio client:', err);
          return [];
        });
        if (Array.isArray(composioTools)) tools.push(...composioTools);
      }
    } catch (e) {
      this.logger.error('Error fetching composio tools', e);
    }

    return tools;
  }

  // Execute a tool by routing to the appropriate client
  async executeTool(call: { name: string; arguments?: any }): Promise<any> {
    const name = call.name || '';
    
    // Route to appropriate client based on tool name
    if (name.startsWith('composio_') && this.composioClient) {
      return this.composioClient.executeTool(call as any);
    }
    
    if (name.startsWith('firecrawl_') || name.includes('firecrawl')) {
      if (this.firecrawlClient) {
      return this.firecrawlClient.executeTool(call as any);
      }
    }

    if (this.enhancedClient) {
      return this.enhancedClient.executeTool(call as any);
    }

    // fallback: try available clients
    if (this.composioClient) {
      return this.composioClient.executeTool(call as any);
    }
    
    if (this.firecrawlClient) {
      return this.firecrawlClient.executeTool(call as any);
    }

    throw new Error('No MCP client available to execute the tool: ' + name);
  }
}

// Initialize agent
let agent: GeminiAgent;
let aggregatedMcpClient: AggregatedMCPClient;
let isInitialized = false;

async function initializeAgent() {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }

    // Create individual MCP clients
    const enhancedMcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';
    const enhancedMcpName = process.env.MCP_SERVER_NAME || 'enhanced-mcp-server';

    const firecrawlMcpUrl = process.env.FIRECRAWL_MCP_SERVER_URL || 'http://localhost:3002';
    const firecrawlMcpName = process.env.FIRECRAWL_MCP_SERVER_NAME || 'firecrawl-mcp-server';

    const composioMcpUrl = process.env.COMPOSIO_MCP_SERVER_URL || 'http://localhost:3003';
    const composioMcpName = process.env.COMPOSIO_MCP_SERVER_NAME || 'composio-mcp-server';

    const enhancedClient = new MCPClient({
      serverUrl: enhancedMcpUrl,
      serverName: enhancedMcpName,
    });

    const firecrawlClient = new MCPClient({
      serverUrl: firecrawlMcpUrl,
      serverName: firecrawlMcpName,
    });

    const composioClient = new MCPClient({
      serverUrl: composioMcpUrl,
      serverName: composioMcpName,
    });

    // Wrap them in the aggregate client
    aggregatedMcpClient = new AggregatedMCPClient({
      enhancedClient,
      firecrawlClient,
      composioClient,
    });

    // Pass the aggregated client to the GeminiAgent config so agent can call getAvailableTools and executeTool
    agent = new GeminiAgent({
      googleApiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      agentInstructions: process.env.AGENT_INSTRUCTIONS || 'You are a helpful AI assistant that can access web data and perform various tasks.',
      mcpClient: aggregatedMcpClient as any, // cast to satisfy type if necessary
    });

    // Initialize agent (agent.initialize will call aggregatedMcpClient.connect() and getAvailableTools())
    await agent.initialize();
    isInitialized = true;
    logger.info('✅ AI Agent initialized successfully with aggregated MCP clients');
  } catch (error) {
    logger.error('❌ Failed to initialize agent:', error);
    isInitialized = false;
  }
}

// ---------- The rest of your file (endpoints) stays the same ----------
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

    // Use aggregatedMcpClient to get tools
    const tools = await (aggregatedMcpClient.getAvailableTools());
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

    // Choose the tool based on preference / availability.
    // If you want to always use firecrawl for JS-heavy sites, call firecrawl tool name.
    // Here we try firecrawl_scraper first, then fallback to web_scraper.
    let result;
    try {
      result = await aggregatedMcpClient.executeTool({
        name: 'firecrawl_scraper',
        arguments: { url }
      });
    } catch (e) {
      logger.info('⚠️ firecrawl_scraper failed or unavailable - falling back to web_scraper', e);
      result = await aggregatedMcpClient.executeTool({
        name: 'web_scraper',
        arguments: { url }
      });
    }

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
        'Conversation memory',
        'Email services',
        'WhatsApp messaging',
        'Slack integration',
        'Calendar management',
        'CRM operations',
        'File storage',
        'Database operations',
        'Webhook triggers'
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
