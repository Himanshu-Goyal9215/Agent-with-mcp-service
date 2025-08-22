import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000;

// Real web scraping tools
const tools = [
  {
    name: 'web_scraper',
    description: 'Scrapes content from a given URL and returns the extracted text and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to scrape'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'data_extractor',
    description: 'Extracts specific types of data from content (emails, URLs, dates, names)',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to extract data from'
        },
        extraction_type: {
          type: 'string',
          enum: ['emails', 'urls', 'dates', 'names', 'phone_numbers'],
          description: 'Type of data to extract'
        }
      },
      required: ['content', 'extraction_type']
    }
  }
];

const server = createServer(async (req, res) => {
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
        name: 'Real Web Scraper MCP Server',
        version: '1.0.0',
        description: 'MCP server with real web scraping capabilities'
      }));
    }
    else if (path === '/tools' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tools));
    }
    else if (path === '/tools/web_scraper/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { url: targetUrl } = args;
          
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          console.log(`🌐 Scraping URL: ${targetUrl}`);
          
          // Real web scraping with axios and cheerio
          const response = await axios.get(targetUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          
          // Extract useful content
          const title = $('title').text().trim();
          const headings = $('h1, h2, h3').map((i, el) => $(el).text().trim()).get();
          const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().slice(0, 10); // First 10 paragraphs
          const links = $('a[href]').map((i, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href')
          })).get().slice(0, 20); // First 20 links
          
          // Remove script and style content
          $('script, style').remove();
          const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000); // First 2000 chars

          const scrapedData = {
            url: targetUrl,
            title,
            headings,
            paragraphs,
            links,
            cleanText,
            metadata: {
              status: response.status,
              contentType: response.headers['content-type'],
              contentLength: response.data.length,
              scrapedAt: new Date().toISOString()
            }
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(scrapedData));
          
        } catch (error) {
          console.error('Error scraping URL:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to scrape URL',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    }
    else if (path === '/tools/data_extractor/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { content, extraction_type } = args;
          
          if (!content || !extraction_type) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Content and extraction_type are required' }));
            return;
          }

          let extractedData = [];
          
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
              // Simple name extraction (capitalized words that might be names)
              const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
              extractedData = content.match(nameRegex) || [];
              break;
              
            case 'phone_numbers':
              const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
              extractedData = content.match(phoneRegex) || [];
              break;
              
            default:
              extractedData = [];
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            extraction_type,
            extracted_data: extractedData,
            count: extractedData.length
          }));
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to extract data' }));
        }
      });
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Real Web Scraper MCP Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /info`);
  console.log(`   GET  /tools`);
  console.log(`   POST /tools/web_scraper/execute`);
  console.log(`   POST /tools/data_extractor/execute`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
