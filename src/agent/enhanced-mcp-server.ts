import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000;

// Enhanced tools with better descriptions and more functionality
const tools = [
  {
    name: 'web_scraper',
    description: 'Comprehensive web scraping tool that extracts structured content from any website including titles, headings, paragraphs, links, images, and metadata. Perfect for news articles, blog posts, product pages, and general web content analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The complete URL to scrape (must include http:// or https://)'
        },
        extractImages: {
          type: 'boolean',
          description: 'Whether to extract image URLs and alt text (default: true)',
          default: true
        },
        extractTables: {
          type: 'boolean',
          description: 'Whether to extract table data (default: true)',
          default: true
        }
      },
      required: ['url']
    }
  },
  {
    name: 'data_extractor',
    description: 'Advanced data extraction tool that can identify and extract specific types of information from text content including emails, phone numbers, URLs, dates, names, addresses, social media handles, and financial data.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to analyze and extract data from'
        },
        extraction_type: {
          type: 'string',
          enum: ['emails', 'urls', 'dates', 'names', 'phone_numbers', 'addresses', 'social_media', 'financial', 'all'],
          description: 'Type of data to extract. Use "all" to extract everything available.'
        }
      },
      required: ['content', 'extraction_type']
    }
  },
  {
    name: 'content_analyzer',
    description: 'Analyzes web content for sentiment, key topics, language detection, reading time estimation, and content quality metrics. Useful for content marketing, SEO analysis, and content research.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to analyze'
        },
        analysis_type: {
          type: 'string',
          enum: ['sentiment', 'topics', 'language', 'readability', 'comprehensive'],
          description: 'Type of analysis to perform'
        }
      },
      required: ['content', 'analysis_type']
    }
  },
  {
    name: 'link_extractor',
    description: 'Extracts and categorizes all links from a webpage, including internal links, external links, social media links, and downloadable files. Useful for SEO analysis and link building.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The webpage URL to extract links from'
        },
        categorize: {
          type: 'boolean',
          description: 'Whether to categorize links by type (default: true)',
          default: true
        }
      },
      required: ['url']
    }
  },
  {
    name: 'social_media_scraper',
    description: 'Specialized tool for extracting social media information, handles, and engagement metrics from web pages. Works with Twitter, LinkedIn, Facebook, Instagram, and other platforms.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The webpage URL to extract social media data from'
        },
        platforms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific social media platforms to focus on (e.g., ["twitter", "linkedin"])',
          default: ['all']
        }
      },
      required: ['url']
    }
  },
  {
    name: 'news_aggregator',
    description: 'Extracts news articles, headlines, and publication information from news websites. Identifies article dates, authors, categories, and provides structured news data.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The news website URL to aggregate articles from'
        },
        maxArticles: {
          type: 'number',
          description: 'Maximum number of articles to extract (default: 10)',
          default: 10
        }
      },
      required: ['url']
    }
  },
  {
    name: 'ecommerce_scraper',
    description: 'Specialized tool for extracting product information from e-commerce websites including prices, product names, descriptions, ratings, reviews, and availability.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The e-commerce product page or category page URL'
        },
        extractType: {
          type: 'string',
          enum: ['product', 'category', 'search_results'],
          description: 'Type of e-commerce content to extract'
        }
      },
      required: ['url', 'extractType']
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
        name: 'Enhanced Web Scraper MCP Server',
        version: '2.0.0',
        description: 'Advanced MCP server with comprehensive web scraping, data extraction, and content analysis capabilities',
        capabilities: ['Web Scraping', 'Data Extraction', 'Content Analysis', 'Link Extraction', 'Social Media Scraping', 'News Aggregation', 'E-commerce Scraping']
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
          const { url: targetUrl, extractImages = true, extractTables = true } = args;
          
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          console.log(`🌐 Enhanced scraping for: ${targetUrl}`);
          
          // Enhanced web scraping with better error handling
          const response = await axios.get(targetUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          });

          const $ = cheerio.load(response.data);
          
          // Enhanced content extraction
          const title = $('title').text().trim();
          const metaDescription = $('meta[name="description"]').attr('content') || '';
          const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
          
          const headings = $('h1, h2, h3, h4, h5, h6').map((i, el) => ({
            level: el.tagName.toLowerCase(),
            text: $(el).text().trim()
          })).get();
          
          const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().slice(0, 15);
          
          const links = $('a[href]').map((i, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href'),
            title: $(el).attr('title') || ''
          })).get().slice(0, 30);
          
          let images = [];
          if (extractImages) {
            images = $('img').map((i, el) => ({
              src: $(el).attr('src'),
              alt: $(el).attr('alt') || '',
              title: $(el).attr('title') || '',
              width: $(el).attr('width'),
              height: $(el).attr('height')
            })).get().slice(0, 20);
          }
          
          let tables = [];
          if (extractTables) {
            tables = $('table').map((i, el) => {
              const tableData = [];
              $(el).find('tr').each((j, row) => {
                const rowData = [];
                $(row).find('td, th').each((k, cell) => {
                  rowData.push($(cell).text().trim());
                });
                if (rowData.length > 0) tableData.push(rowData);
              });
              return {
                caption: $(el).find('caption').text().trim() || '',
                data: tableData
              };
            }).get();
          }
          
          // Remove script and style content
          $('script, style, noscript').remove();
          const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
          
          // Calculate reading time (average 200 words per minute)
          const wordCount = cleanText.split(' ').length;
          const readingTime = Math.ceil(wordCount / 200);

          const scrapedData = {
            url: targetUrl,
            title,
            metaDescription,
            metaKeywords,
            headings,
            paragraphs,
            links,
            images,
            tables,
            cleanText,
            wordCount,
            estimatedReadingTime: `${readingTime} minutes`,
            metadata: {
              status: response.status,
              contentType: response.headers['content-type'],
              contentLength: response.data.length,
              scrapedAt: new Date().toISOString(),
              server: response.headers['server'] || 'Unknown'
            }
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(scrapedData));
          
        } catch (error) {
          console.error('Error scraping URL:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to scrape URL',
            details: error instanceof Error ? error.message : 'Unknown error',
            suggestions: [
              'Check if the URL is accessible',
              'Verify the website allows scraping',
              'Try a different URL'
            ]
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

          let extractedData = {};
          
          if (extraction_type === 'all' || extraction_type === 'emails') {
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            extractedData.emails = content.match(emailRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'urls') {
            const urlRegex = /https?:\/\/[^\s]+/g;
            extractedData.urls = content.match(urlRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'dates') {
            const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
            extractedData.dates = content.match(dateRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'names') {
            const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
            extractedData.names = content.match(nameRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'phone_numbers') {
            const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\+\d{1,3}[-.]?\d{1,4}[-.]?\d{1,4}[-.]?\d{1,4}\b/g;
            extractedData.phoneNumbers = content.match(phoneRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'addresses') {
            const addressRegex = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Place|Pl|Court|Ct)\b/gi;
            extractedData.addresses = content.match(addressRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'social_media') {
            const socialRegex = /@[A-Za-z0-9_]+|(?:https?:\/\/(?:www\.)?(?:twitter\.com|linkedin\.com|facebook\.com|instagram\.com)\/[A-Za-z0-9_]+)/gi;
            extractedData.socialMedia = content.match(socialRegex) || [];
          }
          
          if (extraction_type === 'all' || extraction_type === 'financial') {
            const currencyRegex = /\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP|INR)/gi;
            extractedData.financial = content.match(currencyRegex) || [];
          }

          // Add summary statistics
          const summary = {};
          Object.keys(extractedData).forEach(key => {
            summary[key] = {
              count: extractedData[key].length,
              examples: extractedData[key].slice(0, 5) // First 5 examples
            };
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            extraction_type,
            extracted_data: extractedData,
            summary,
            total_extractions: Object.values(extractedData).reduce((sum, arr) => sum + arr.length, 0)
          }));
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to extract data' }));
        }
      });
    }
    else if (path === '/tools/content_analyzer/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { content, analysis_type } = args;
          
          if (!content || !analysis_type) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Content and analysis_type are required' }));
            return;
          }

          let analysis = {};
          
          if (analysis_type === 'sentiment' || analysis_type === 'comprehensive') {
            // Simple sentiment analysis based on positive/negative words
            const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy'];
            const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
            
            const words = content.toLowerCase().split(/\s+/);
            const positiveCount = words.filter(word => positiveWords.includes(word)).length;
            const negativeCount = words.filter(word => negativeWords.includes(word)).length;
            
            let sentiment = 'neutral';
            if (positiveCount > negativeCount) sentiment = 'positive';
            else if (negativeCount > positiveCount) sentiment = 'negative';
            
            analysis.sentiment = {
              overall: sentiment,
              positiveWords: positiveCount,
              negativeWords: negativeCount,
              confidence: Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)
            };
          }
          
          if (analysis_type === 'topics' || analysis_type === 'comprehensive') {
            // Extract key topics based on frequency
            const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
            const wordFreq = {};
            words.forEach(word => {
              if (word.length > 3) { // Only words longer than 3 characters
                wordFreq[word] = (wordFreq[word] || 0) + 1;
              }
            });
            
            const sortedWords = Object.entries(wordFreq)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([word, count]) => ({ word, count }));
            
            analysis.topics = sortedWords;
          }
          
          if (analysis_type === 'language' || analysis_type === 'comprehensive') {
            // Simple language detection based on common words
            const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
            const englishCount = englishWords.filter(word => content.toLowerCase().includes(word)).length;
            
            analysis.language = {
              detected: englishCount > 5 ? 'English' : 'Unknown',
              confidence: Math.min(englishCount / 10, 1)
            };
          }
          
          if (analysis_type === 'readability' || analysis_type === 'comprehensive') {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const words = content.split(/\s+/).filter(w => w.length > 0);
            const syllables = content.toLowerCase().match(/[aeiouy]+/g)?.length || 0;
            
            const avgWordsPerSentence = words.length / sentences.length;
            const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (syllables / words.length));
            
            let readability = 'Very Difficult';
            if (fleschScore >= 90) readability = 'Very Easy';
            else if (fleschScore >= 80) readability = 'Easy';
            else if (fleschScore >= 70) readability = 'Fairly Easy';
            else if (fleschScore >= 60) readability = 'Standard';
            else if (fleschScore >= 50) readability = 'Fairly Difficult';
            else if (fleschScore >= 30) readability = 'Difficult';
            
            analysis.readability = {
              level: readability,
              fleschScore: Math.round(fleschScore),
              avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
              totalWords: words.length,
              totalSentences: sentences.length
            };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            analysis_type,
            analysis,
            content_length: content.length,
            timestamp: new Date().toISOString()
          }));
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to analyze content' }));
        }
      });
    }
    else if (path === '/tools/link_extractor/execute' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { arguments: args } = JSON.parse(body);
          const { url: targetUrl, categorize = true } = args;
          
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          console.log(`🔗 Extracting links from: ${targetUrl}`);
          
          const response = await axios.get(targetUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          const baseUrl = new URL(targetUrl);
          
          const allLinks = $('a[href]').map((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            const title = $(el).attr('title') || '';
            
            // Resolve relative URLs
            let absoluteUrl = href;
            if (href && !href.startsWith('http')) {
              try {
                absoluteUrl = new URL(href, baseUrl).href;
              } catch (e) {
                absoluteUrl = href;
              }
            }
            
            return {
              text,
              href: absoluteUrl,
              title,
              isExternal: absoluteUrl.startsWith('http') && !absoluteUrl.includes(baseUrl.hostname)
            };
          }).get();

          let categorizedLinks = allLinks;
          if (categorize) {
            const categories = {
              internal: allLinks.filter(link => !link.isExternal),
              external: allLinks.filter(link => link.isExternal),
              social: allLinks.filter(link => 
                link.href.includes('twitter.com') || 
                link.href.includes('facebook.com') || 
                link.href.includes('linkedin.com') || 
                link.href.includes('instagram.com')
              ),
              downloads: allLinks.filter(link => 
                link.href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp3|mp4|avi|mov)$/i)
              ),
              emails: allLinks.filter(link => link.href.startsWith('mailto:')),
              phones: allLinks.filter(link => link.href.startsWith('tel:'))
            };
            
            categorizedLinks = categories;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            url: targetUrl,
            total_links: allLinks.length,
            categorized: categorize,
            links: categorizedLinks,
            timestamp: new Date().toISOString()
          }));
          
        } catch (error) {
          console.error('Error extracting links:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to extract links',
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
  console.log(`🚀 Enhanced Web Scraper MCP Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /info`);
  console.log(`   GET  /tools`);
  console.log(`   POST /tools/web_scraper/execute`);
  console.log(`   POST /tools/data_extractor/execute`);
  console.log(`   POST /tools/content_analyzer/execute`);
  console.log(`   POST /tools/link_extractor/execute`);
  console.log(`🎯 Enhanced tools: Web Scraping, Data Extraction, Content Analysis, Link Extraction`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Enhanced MCP Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Enhanced MCP Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
