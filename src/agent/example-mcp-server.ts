import express, { type Application, type Request, type Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import type { Server } from 'http';
import { Logger } from './logger.js';

export class ExampleMCPServer {
  private app: Application;
  private logger: Logger;
  private port: number;
  private server: Server | undefined;

  constructor(port: number = 3000) {
    this.port = port;
    this.logger = new Logger();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.originalUrl}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Server info endpoint
    this.app.get('/info', (req: Request, res: Response) => {
      res.json({
        name: 'Example MCP Server',
        version: '1.0.0',
        description: 'Example MCP server providing web scraping and data extraction tools',
        capabilities: ['tools', 'resources', 'prompts'],
      });
    });

    // Tools endpoints
    this.app.get('/tools', (req: Request, res: Response) => {
      res.json([
        {
          name: 'web_scraper',
          description: 'Scrape content from a web URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to scrape',
              },
              selector: {
                type: 'string',
                description: 'CSS selector to extract specific content (optional)',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'data_extractor',
          description: 'Extract structured data from text content',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The text content to analyze',
              },
              extraction_type: {
                type: 'string',
                enum: ['emails', 'urls', 'dates', 'names'],
                description: 'Type of data to extract',
              },
            },
            required: ['content', 'extraction_type'],
          },
        },
        {
          name: 'summarizer',
          description: 'Summarize long text content',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The text content to summarize',
              },
              max_length: {
                type: 'number',
                description: 'Maximum length of summary (default: 200)',
              },
            },
            required: ['content'],
          },
        },
      ]);
    });

    // Define Zod schemas for input validation
    const webScraperSchema = z.object({
      url: z.string().url(),
      selector: z.string().optional(),
    });

    // Tool execution endpoints
    this.app.post('/tools/web_scraper/execute', async (req: Request, res: Response) => {
      try {
        const validation = webScraperSchema.safeParse(req.body.arguments);
        if (!validation.success) {
          return res.status(400).json({ error: 'Invalid arguments', details: validation.error.issues });
        }
        const { url, selector } = validation.data;

        this.logger.info(`Scraping URL: ${url}`);
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AI Agent MCP Server)',
          },
        });

        const $ = cheerio.load(response.data);
        let content: string;
        
        // If selector is provided, try to extract specific content
        if (selector) {
          content = $(selector).text();
        } else {
          content = $('body').text();
        }
        const cleanText = content.replace(/\s+/g, ' ').trim();
        
        res.json({
          success: true,
          url,
          content: cleanText.substring(0, 1000) + (cleanText.length > 1000 ? '...' : ''),
          full_length: cleanText.length,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        this.logger.error('Error in web_scraper:', error);
        res.status(500).json({
          error: 'Failed to scrape URL',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    const dataExtractorSchema = z.object({
      content: z.string(),
      extraction_type: z.enum(['emails', 'urls', 'dates', 'names']),
    });

    this.app.post('/tools/data_extractor/execute', async (req: Request, res: Response) => {
      try {
        const validation = dataExtractorSchema.safeParse(req.body.arguments);
        if (!validation.success) {
          return res.status(400).json({ error: 'Invalid arguments', details: validation.error.issues });
        }
        const { content, extraction_type } = validation.data;
        
        this.logger.info(`Extracting ${extraction_type} from content`);
        
        let extractedData: string[] = [];
        
        switch (extraction_type) {
          case 'emails':
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            extractedData = content.match(emailRegex) || [];
            break;
            
          case 'urls':
            const urlRegex = /https?:\/\/[^\s]+/g;
            extractedData = content.match(urlRegex) || [];
            break;
            
          case 'dates':
            const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
            extractedData = content.match(dateRegex) || [];
            break;
            
          case 'names':
            // Simple name extraction (in production, use NLP libraries)
            const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
            extractedData = content.match(nameRegex) || [];
            break;
            
          default:
            return res.status(400).json({ error: 'Invalid extraction_type' });
        }
        
        res.json({
          success: true,
          extraction_type,
          extracted_data: extractedData,
          count: extractedData.length,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        this.logger.error('Error in data_extractor:', error);
        res.status(500).json({
          error: 'Failed to extract data',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    const summarizerSchema = z.object({
      content: z.string(),
      max_length: z.number().int().positive().default(200),
    });

    this.app.post('/tools/summarizer/execute', async (req: Request, res: Response) => {
      try {
        const validation = summarizerSchema.safeParse(req.body.arguments);
        if (!validation.success) {
          return res.status(400).json({ error: 'Invalid arguments', details: validation.error.issues });
        }
        const { content, max_length } = validation.data;
        this.logger.info(`Summarizing content (max length: ${max_length})`);
        
        // Simple summarization (in production, use AI models)
        const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
        const words = content.split(/\s+/).filter((w: string) => w.trim().length > 0);
        
        let summary = '';
        let currentLength = 0;
        
        for (const sentence of sentences) {
          const sentenceLength = sentence.trim().length;
          if (currentLength + sentenceLength <= max_length) {
            summary += sentence.trim() + '. ';
            currentLength += sentenceLength;
          } else {
            break;
          }
        }
        
        if (!summary) {
          summary = words.slice(0, Math.floor(max_length / 5)).join(' ') + '...';
        }
        
        res.json({
          success: true,
          original_length: content.length,
          summary_length: summary.length,
          summary: summary.trim(),
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        this.logger.error('Error in summarizer:', error);
        res.status(500).json({
          error: 'Failed to summarize content',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Resources endpoints
    this.app.get('/resources', (req: Request, res: Response) => {
      res.json([
        {
          uri: 'example://web-data',
          name: 'Web Data Examples',
          description: 'Example web data resources',
          mime_type: 'application/json',
        },
      ]);
    });

    // Prompts endpoints
    this.app.get('/prompts', (req: Request, res: Response) => {
      res.json([
        {
          name: 'web_analysis',
          description: 'Analyze web content and provide insights',
          version: '1.0.0',
        },
      ]);
    });

    this.app.post('/prompts/web_analysis/messages', (req: Request, res: Response) => {
      const { url } = req.body.arguments || {};
      
      res.json([
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze the web content from ${url || 'the provided URL'} and provide key insights, main topics, and any notable information.`,
          },
        },
      ]);
    });
  }

  start(): void {
    try {
      this.server = this.app.listen(this.port, () => {
        this.logger.info(`🚀 Example MCP Server running on port ${this.port}`);
        this.logger.info(`📚 Available endpoints:`);
        this.logger.info(`   - GET  /info - Server information`);
        this.logger.info(`   - GET  /tools - List available tools`);
        this.logger.info(`   - POST /tools/{tool_name}/execute - Execute a tool`);
        this.logger.info(`   - GET  /resources - List available resources`);
        this.logger.info(`   - GET  /prompts - List available prompts`);
      }).on('error', (error) => {
        this.logger.error('❌ Server failed to start:', error);
        throw error;
      });
    } catch (error) {
      this.logger.error('❌ Error in start method:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.server) {
      this.logger.info('🛑 Stopping Example MCP Server...');
      this.server.close((err) => {
        if (err) {
          this.logger.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        this.logger.info('✅ Server stopped gracefully.');
        process.exit(0);
      });
    }
  }
}
