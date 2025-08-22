import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';

const PORT = process.env.FIRECRAWL_PORT ? parseInt(process.env.FIRECRAWL_PORT) : 3002;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Firecrawl MCP Server Tools
const tools = [
  {
    name: 'firecrawl_scraper',
    description: 'Advanced web scraping using Firecrawl API with JavaScript rendering, screenshots, and dynamic content handling. Perfect for modern web applications, SPAs, and sites with heavy JavaScript.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to scrape (must include http:// or https://)'
        },
        waitFor: {
          type: 'string',
          description: 'CSS selector to wait for before scraping (e.g., ".content-loaded")',
          default: null
        },
        screenshot: {
          type: 'boolean',
          description: 'Whether to capture a screenshot (default: false)',
          default: false
        },
        format: {
          type: 'string',
          enum: ['html', 'markdown', 'text'],
          description: 'Output format for the scraped content (default: html)',
          default: 'html'
        },
        includeTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTML tags to include in extraction (e.g., ["h1", "h2", "p", "a"])',
          default: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'table']
        }
      },
      required: ['url']
    }
  },
  {
    name: 'firecrawl_search',
    description: 'Search and scrape multiple pages using Firecrawl search functionality. Useful for finding and analyzing multiple related web pages.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant web pages'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        },
        includeContent: {
          type: 'boolean',
          description: 'Whether to scrape content from found pages (default: true)',
          default: true
        }
      },
      required: ['query']
    }
  },
  {
    name: 'firecrawl_batch_scrape',
    description: 'Scrape multiple URLs in batch using Firecrawl for efficient processing of multiple websites.',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of URLs to scrape'
        },
        parallel: {
          type: 'boolean',
          description: 'Whether to scrape URLs in parallel (default: true)',
          default: true
        },
        format: {
          type: 'string',
          enum: ['html', 'markdown', 'text'],
          description: 'Output format for all scraped content (default: html)',
          default: 'html'
        }
      },
      required: ['urls']
    }
  },
  {
    name: 'firecrawl_metadata',
    description: 'Extract comprehensive metadata from web pages including Open Graph tags, Twitter cards, structured data, and technical information.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to extract metadata from'
        },
        includeStructuredData: {
          type: 'boolean',
          description: 'Whether to include JSON-LD structured data (default: true)',
          default: true
        }
      },
      required: ['url']
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
        name: 'Firecrawl MCP Server',
        version: '1.0.0',
        description: 'Advanced web scraping using Firecrawl API with JavaScript rendering and dynamic content handling',
        capabilities: ['JavaScript Rendering', 'Screenshots', 'Search', 'Batch Processing', 'Metadata Extraction'],
        requires: FIRECRAWL_API_KEY ? 'API Key Configured' : 'FIRECRAWL_API_KEY environment variable needed'
      }));
    }
    else if (path === '/tools' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tools));
    }
    else if (path === '/tools/firecrawl_scraper/execute' && method === 'POST') {
      if (!FIRECRAWL_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Firecrawl API key not configured',
          message: 'Please set FIRECRAWL_API_KEY environment variable'
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { url: targetUrl, waitFor, screenshot = false, format = 'html', includeTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'table'] } = args;
          
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          console.log(`🔥 Firecrawl scraping: ${targetUrl}`);
          
          // Firecrawl API call
          const firecrawlResponse = await axios.post('https://api.firecrawl.dev/scrape', {
            url: targetUrl,
            waitFor,
            screenshot,
            format,
            includeTags
          }, {
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds for Firecrawl
          });

          if (firecrawlResponse.data.success) {
            const scrapedData = {
              url: targetUrl,
              success: true,
              content: firecrawlResponse.data.data.content,
              markdown: firecrawlResponse.data.data.markdown,
              html: firecrawlResponse.data.data.html,
              screenshot: firecrawlResponse.data.data.screenshot,
              metadata: {
                scrapedAt: new Date().toISOString(),
                format,
                includeTags,
                waitFor: waitFor || 'none'
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(scrapedData));
          } else {
            throw new Error(firecrawlResponse.data.error || 'Firecrawl scraping failed');
          }
          
        } catch (error) {
          console.error('Error with Firecrawl scraping:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to scrape with Firecrawl',
            details: error instanceof Error ? error.message : 'Unknown error',
            suggestions: [
              'Check if the URL is accessible',
              'Verify your Firecrawl API key is valid',
              'Try a different URL or format'
            ]
          }));
        }
      });
    }
    else if (path === '/tools/firecrawl_search/execute' && method === 'POST') {
      if (!FIRECRAWL_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Firecrawl API key not configured',
          message: 'Please set FIRECRAWL_API_KEY environment variable'
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { query, maxResults = 5, includeContent = true } = args;
          
          if (!query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Search query is required' }));
            return;
          }

          console.log(`🔍 Firecrawl search: ${query}`);
          
          // Firecrawl search API call
          const searchResponse = await axios.post('https://api.firecrawl.dev/search', {
            query,
            maxResults,
            includeContent
          }, {
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          });

          if (searchResponse.data.success) {
            const searchData = {
              query,
              success: true,
              results: searchResponse.data.data.results,
              totalResults: searchResponse.data.data.totalResults,
              metadata: {
                searchedAt: new Date().toISOString(),
                maxResults,
                includeContent
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(searchData));
          } else {
            throw new Error(searchResponse.data.error || 'Firecrawl search failed');
          }
          
        } catch (error) {
          console.error('Error with Firecrawl search:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to search with Firecrawl',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    }
    else if (path === '/tools/firecrawl_batch_scrape/execute' && method === 'POST') {
      if (!FIRECRAWL_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Firecrawl API key not configured',
          message: 'Please set FIRECRAWL_API_KEY environment variable'
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { urls, parallel = true, format = 'html' } = args;
          
          if (!urls || !Array.isArray(urls) || urls.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URLs array is required and must not be empty' }));
            return;
          }

          console.log(`📦 Firecrawl batch scrape: ${urls.length} URLs`);
          
          if (parallel) {
            // Parallel processing
            const scrapePromises = urls.map(async (url) => {
              try {
                const response = await axios.post('https://api.firecrawl.dev/scrape', {
                  url,
                  format
                }, {
                  headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 30000
                });
                return { url, success: true, data: response.data.data };
              } catch (error) {
                return { url, success: false, error: error.message };
              }
            });

            const results = await Promise.all(scrapePromises);
            
            const batchData = {
              success: true,
              totalUrls: urls.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              results,
              metadata: {
                processedAt: new Date().toISOString(),
                format,
                parallel: true
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(batchData));
          } else {
            // Sequential processing
            const results = [];
            for (const url of urls) {
              try {
                const response = await axios.post('https://api.firecrawl.dev/scrape', {
                  url,
                  format
                }, {
                  headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 30000
                });
                results.push({ url, success: true, data: response.data.data });
              } catch (error) {
                results.push({ url, success: false, error: error.message });
              }
            }

            const batchData = {
              success: true,
              totalUrls: urls.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              results,
              metadata: {
                processedAt: new Date().toISOString(),
                format,
                parallel: false
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(batchData));
          }
          
        } catch (error) {
          console.error('Error with Firecrawl batch scrape:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to batch scrape with Firecrawl',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    }
    else if (path === '/tools/firecrawl_metadata/execute' && method === 'POST') {
      if (!FIRECRAWL_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Firecrawl API key not configured',
          message: 'Please set FIRECRAWL_API_KEY environment variable'
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { url: targetUrl, includeStructuredData = true } = args;
          
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          console.log(`📊 Firecrawl metadata extraction: ${targetUrl}`);
          
          // Firecrawl metadata API call
          const metadataResponse = await axios.post('https://api.firecrawl.dev/scrape', {
            url: targetUrl,
            includeTags: ['meta', 'script[type="application/ld+json"]'],
            format: 'html'
          }, {
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });

          if (metadataResponse.data.success) {
            // Parse the HTML to extract metadata
            const html = metadataResponse.data.data.html;
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            
            const metadata = {
              url: targetUrl,
              success: true,
              title: $('title').text().trim(),
              meta: {
                description: $('meta[name="description"]').attr('content') || '',
                keywords: $('meta[name="keywords"]').attr('content') || '',
                author: $('meta[name="author"]').attr('content') || '',
                viewport: $('meta[name="viewport"]').attr('content') || '',
                robots: $('meta[name="robots"]').attr('content') || ''
              },
              openGraph: {
                title: $('meta[property="og:title"]').attr('content') || '',
                description: $('meta[property="og:description"]').attr('content') || '',
                image: $('meta[property="og:image"]').attr('content') || '',
                url: $('meta[property="og:url"]').attr('content') || '',
                type: $('meta[property="og:type"]').attr('content') || '',
                siteName: $('meta[property="og:site_name"]').attr('content') || ''
              },
              twitter: {
                card: $('meta[name="twitter:card"]').attr('content') || '',
                title: $('meta[name="twitter:title"]').attr('content') || '',
                description: $('meta[name="twitter:description"]').attr('content') || '',
                image: $('meta[name="twitter:image"]').attr('content') || '',
                creator: $('meta[name="twitter:creator"]').attr('content') || '',
                site: $('meta[name="twitter:site"]').attr('content') || ''
              },
              structuredData: includeStructuredData ? $('script[type="application/ld+json"]').map((i, el) => {
                try {
                  return JSON.parse($(el).html());
                } catch (e) {
                  return null;
                }
              }).get().filter(Boolean) : [],
              metadata: {
                extractedAt: new Date().toISOString(),
                includeStructuredData
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metadata));
          } else {
            throw new Error(metadataResponse.data.error || 'Firecrawl metadata extraction failed');
          }
          
        } catch (error) {
          console.error('Error with Firecrawl metadata extraction:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to extract metadata with Firecrawl',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
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
  console.log(`🔥 Firecrawl MCP Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /info`);
  console.log(`   GET  /tools`);
  console.log(`   POST /tools/firecrawl_scraper/execute`);
  console.log(`   POST /tools/firecrawl_search/execute`);
  console.log(`   POST /tools/firecrawl_batch_scrape/execute`);
  console.log(`   POST /tools/firecrawl_metadata/execute`);
  console.log(`🎯 Firecrawl tools: Advanced Scraping, Search, Batch Processing, Metadata`);
  if (!FIRECRAWL_API_KEY) {
    console.log(`⚠️  Warning: FIRECRAWL_API_KEY not set. Get your free API key at https://firecrawl.dev`);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Firecrawl MCP Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Firecrawl MCP Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
