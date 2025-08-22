#!/usr/bin/env node

import { createServer } from 'http';
import { URL } from 'url';

const PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000;

// Simple in-memory storage for tools
const tools = [
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
];

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    if (path === '/info' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'Simple MCP Server',
        version: '1.0.0',
        description: 'Simple MCP server providing basic tools',
        capabilities: ['tools'],
      }));
    } else if (path === '/tools' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tools));
    } else if (path === '/tools/web_scraper/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { url } = args || {};
          
          if (!url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          // Simple mock response for now
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            url,
            content: `Mock content from ${url}`,
            timestamp: new Date().toISOString(),
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (path === '/tools/data_extractor/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { content, extraction_type } = args || {};
          
          if (!content || !extraction_type) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Content and extraction_type are required' }));
            return;
          }

          // Simple mock extraction
          let extractedData: string[] = [];
          if (extraction_type === 'emails') {
            extractedData = ['example@test.com', 'user@domain.org'];
          } else if (extraction_type === 'urls') {
            extractedData = ['https://example.com', 'https://test.org'];
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            extraction_type,
            extracted_data: extractedData,
            count: extractedData.length,
            timestamp: new Date().toISOString(),
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Simple MCP Server running on port ${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   - GET  /info - Server information`);
  console.log(`   - GET  /tools - List available tools`);
  console.log(`   - POST /tools/web_scraper/execute - Execute web scraper`);
  console.log(`   - POST /tools/data_extractor/execute - Execute data extractor`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
