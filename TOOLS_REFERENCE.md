# 🛠️ Complete Tools Reference

This document provides a comprehensive overview of all tools available across all MCP servers in your AI agent system.

## 📊 Tool Categories Overview

| Category | Server | Port | Tools Count | Description |
|----------|--------|------|-------------|-------------|
| 🌐 **Web Scraping** | Enhanced MCP | 3000 | 7 | Basic to advanced web scraping |
| 🔥 **Advanced Scraping** | Firecrawl MCP | 3002 | 4 | JavaScript rendering & screenshots |
| 📧 **Communication** | Composio MCP | 3003 | 8 | Email, WhatsApp, Slack, Calendar |
| 💼 **Business Tools** | Composio MCP | 3003 | 8 | CRM, File Storage, Database, Webhooks |

---

## 🌐 Enhanced MCP Server (Port 3000)

### 1. `web_scraper`
**Description**: Comprehensive web scraping tool that extracts structured content from any website.

**Parameters**:
- `url` (required): The complete URL to scrape
- `extractImages` (optional): Whether to extract image URLs and alt text (default: true)
- `extractTables` (optional): Whether to extract table data (default: true)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/web_scraper/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://example.com", "extractImages": true}}'
```

### 2. `data_extractor`
**Description**: Advanced data extraction tool for identifying specific information types.

**Parameters**:
- `content` (required): The text content to analyze
- `extraction_type` (required): Type of data to extract (emails, urls, dates, names, phone_numbers, addresses, social_media, financial, all)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/data_extractor/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"content": "Contact us at info@example.com", "extraction_type": "emails"}}'
```

### 3. `content_analyzer`
**Description**: Analyzes web content for sentiment, topics, language, and readability.

**Parameters**:
- `content` (required): The content to analyze
- `analysis_type` (required): Type of analysis (sentiment, topics, language, readability, comprehensive)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/content_analyzer/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"content": "Your content here", "analysis_type": "comprehensive"}}'
```

### 4. `link_extractor`
**Description**: Extracts and categorizes all links from a webpage.

**Parameters**:
- `url` (required): The webpage URL to extract links from
- `categorize` (optional): Whether to categorize links by type (default: true)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/link_extractor/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://example.com", "categorize": true}}'
```

### 5. `social_media_scraper`
**Description**: Specialized tool for extracting social media information and engagement metrics.

**Parameters**:
- `url` (required): The webpage URL to extract social media data from
- `platforms` (optional): Specific social media platforms to focus on (default: ["all"])

**Example**:
```bash
curl -X POST http://localhost:3000/tools/social_media_scraper/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://example.com", "platforms": ["twitter", "linkedin"]}}'
```

### 6. `news_aggregator`
**Description**: Extracts news articles, headlines, and publication information.

**Parameters**:
- `url` (required): The news website URL to aggregate articles from
- `maxArticles` (optional): Maximum number of articles to extract (default: 10)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/news_aggregator/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://news.example.com", "maxArticles": 5}}'
```

### 7. `ecommerce_scraper`
**Description**: Specialized tool for extracting product information from e-commerce websites.

**Parameters**:
- `url` (required): The e-commerce product page or category page URL
- `extractType` (required): Type of e-commerce content to extract (product, category, search_results)

**Example**:
```bash
curl -X POST http://localhost:3000/tools/ecommerce_scraper/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://shop.example.com", "extractType": "product"}}'
```

---

## 🔥 Firecrawl MCP Server (Port 3002)

### 1. `firecrawl_scraper`
**Description**: Advanced web scraping using Firecrawl API with JavaScript rendering and screenshots.

**Parameters**:
- `url` (required): The URL to scrape
- `waitFor` (optional): CSS selector to wait for before scraping
- `screenshot` (optional): Whether to capture a screenshot (default: false)
- `format` (optional): Output format (html, markdown, text) (default: html)
- `includeTags` (optional): HTML tags to include in extraction (default: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'table'])

**Example**:
```bash
curl -X POST http://localhost:3002/tools/firecrawl_scraper/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://example.com", "format": "markdown", "screenshot": true}}'
```

### 2. `firecrawl_search`
**Description**: Search and scrape multiple pages using Firecrawl search functionality.

**Parameters**:
- `query` (required): Search query to find relevant web pages
- `maxResults` (optional): Maximum number of results to return (default: 5)
- `includeContent` (optional): Whether to scrape content from found pages (default: true)

**Example**:
```bash
curl -X POST http://localhost:3002/tools/firecrawl_search/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "artificial intelligence trends 2024", "maxResults": 3}}'
```

### 3. `firecrawl_batch_scrape`
**Description**: Scrape multiple URLs in batch using Firecrawl for efficient processing.

**Parameters**:
- `urls` (required): Array of URLs to scrape
- `parallel` (optional): Whether to scrape URLs in parallel (default: true)
- `format` (optional): Output format for all scraped content (default: html)

**Example**:
```bash
curl -X POST http://localhost:3002/tools/firecrawl_batch_scrape/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"urls": ["https://example1.com", "https://example2.com"], "parallel": true}}'
```

### 4. `firecrawl_metadata`
**Description**: Extract comprehensive metadata from web pages including Open Graph tags and structured data.

**Parameters**:
- `url` (required): The URL to extract metadata from
- `includeStructuredData` (optional): Whether to include JSON-LD structured data (default: true)

**Example**:
```bash
curl -X POST http://localhost:3002/tools/firecrawl_metadata/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://example.com", "includeStructuredData": true}}'
```

---

## 📧 Composio MCP Server (Port 3003)

### 1. `composio_send_email`
**Description**: Send emails using various email providers with support for attachments and scheduling.

**Parameters**:
- `to` (required): Recipient email address or comma-separated list
- `subject` (required): Email subject line
- `body` (required): Email body content (supports HTML)
- `from` (optional): Sender email address
- `cc` (optional): CC recipients (comma-separated)
- `bcc` (optional): BCC recipients (comma-separated)
- `attachments` (optional): Array of file URLs or base64 encoded files
- `scheduleFor` (optional): ISO timestamp to schedule email for future delivery

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_send_email/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"to": "user@example.com", "subject": "Meeting Reminder", "body": "Don\'t forget our meeting tomorrow!"}}'
```

### 2. `composio_whatsapp_message`
**Description**: Send WhatsApp messages using WhatsApp Business API with support for media and templates.

**Parameters**:
- `phoneNumber` (required): Recipient phone number in international format
- `message` (required): Message content
- `messageType` (optional): Type of message (text, image, document, audio, video, template) (default: text)
- `mediaUrl` (optional): URL of media file (required for media types)
- `templateName` (optional): Template name to use (required for template type)
- `templateVariables` (optional): Variables to substitute in the template

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_whatsapp_message/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"phoneNumber": "+1234567890", "message": "Hello! Your order has been shipped."}}'
```

### 3. `composio_slack_message`
**Description**: Send messages to Slack channels, direct messages, or threads with rich formatting.

**Parameters**:
- `channel` (required): Slack channel name or ID
- `message` (required): Message content (supports Slack markdown)
- `threadTs` (optional): Thread timestamp to reply to existing thread
- `attachments` (optional): Slack attachment objects for rich formatting
- `blocks` (optional): Slack block kit blocks for advanced layouts

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_slack_message/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"channel": "#general", "message": "New feature released! 🎉"}}'
```

### 4. `composio_calendar_event`
**Description**: Create, update, and manage calendar events across various providers.

**Parameters**:
- `title` (required): Event title or summary
- `startTime` (required): Event start time (ISO timestamp)
- `endTime` (required): Event end time (ISO timestamp)
- `description` (optional): Event description
- `location` (optional): Event location
- `attendees` (optional): Array of attendee email addresses
- `reminders` (optional): Array of reminder objects with timing and method

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_calendar_event/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"title": "Team Meeting", "startTime": "2024-01-15T14:00:00Z", "endTime": "2024-01-15T15:00:00Z"}}'
```

### 5. `composio_crm_contact`
**Description**: Create, update, and manage contacts in various CRM systems.

**Parameters**:
- `firstName` (required): Contact first name
- `lastName` (required): Contact last name
- `email` (required): Contact email address
- `phone` (optional): Contact phone number
- `company` (optional): Company name
- `jobTitle` (optional): Job title or position
- `customFields` (optional): Additional custom fields specific to the CRM

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_crm_contact/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"firstName": "John", "lastName": "Doe", "email": "john@example.com", "company": "TechCorp"}}'
```

### 6. `composio_file_upload`
**Description**: Upload files to various cloud storage providers with sharing options.

**Parameters**:
- `fileUrl` (required): URL of the file to upload or base64 encoded file data
- `fileName` (required): Name for the uploaded file
- `destination` (optional): Destination folder or path in the cloud storage
- `sharing` (optional): Sharing settings (public, private, specific users)
- `tags` (optional): Tags to apply to the uploaded file

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_file_upload/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"fileUrl": "https://example.com/file.pdf", "fileName": "document.pdf"}}'
```

### 7. `composio_database_query`
**Description**: Execute database queries on various database systems with support for read and write operations.

**Parameters**:
- `query` (required): SQL query or database operation to execute
- `databaseType` (required): Type of database (postgresql, mysql, mongodb, sqlite, mariadb)
- `connectionString` (optional): Database connection string or credentials
- `parameters` (optional): Query parameters for prepared statements

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_database_query/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "SELECT * FROM users WHERE active = true", "databaseType": "postgresql"}}'
```

### 8. `composio_webhook_trigger`
**Description**: Trigger webhooks to integrate with external systems and automation platforms.

**Parameters**:
- `webhookUrl` (required): URL of the webhook endpoint to trigger
- `payload` (optional): Data payload to send with the webhook
- `method` (optional): HTTP method to use (GET, POST, PUT, PATCH, DELETE) (default: POST)
- `headers` (optional): Custom HTTP headers to include
- `timeout` (optional): Request timeout in milliseconds (default: 30000)

**Example**:
```bash
curl -X POST http://localhost:3003/tools/composio_webhook_trigger/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"webhookUrl": "https://api.example.com/webhook", "payload": {"event": "user_created"}}}'
```

---

## 🎯 Natural Language Examples

### Email Operations
```
"Send email to john@example.com about project update with message 'The project is progressing well'"
"Email sarah@company.com regarding meeting tomorrow at 2 PM"
"Send a reminder email to team@example.com about the deadline"
```

### WhatsApp Operations
```
"Send WhatsApp message to +1234567890 saying 'Hello! How are you today?'"
"WhatsApp +9876543210 with message 'Your appointment is confirmed'"
"Send WhatsApp to +1112223333 about order status"
```

### Calendar Operations
```
"Schedule a meeting for tomorrow at 3 PM about quarterly review"
"Create calendar event for Friday at 10 AM called 'Team Standup'"
"Book appointment for next Monday at 2 PM"
```

### Web Scraping Operations
```
"Scrape the content from https://example.com and extract all email addresses"
"Extract product prices from the competitor's website"
"Get all contact information from the company page"
```

### Data Extraction Operations
```
"Extract all phone numbers from this text"
"Find all email addresses in the document"
"Get all dates mentioned in the content"
```

---

## 🔧 Tool Discovery

### Check Available Tools
```bash
# Enhanced MCP Server
curl http://localhost:3000/tools

# Firecrawl MCP Server  
curl http://localhost:3002/tools

# Composio MCP Server
curl http://localhost:3003/tools

# All tools via Web API
curl http://localhost:3001/api/tools
```

### Server Information
```bash
# Enhanced MCP Server
curl http://localhost:3000/info

# Firecrawl MCP Server
curl http://localhost:3002/info

# Composio MCP Server
curl http://localhost:3003/info

# Web API Status
curl http://localhost:3001/api/status
```

---

## 💡 Pro Tips

1. **Tool Chaining**: The agent can use multiple tools in sequence for complex tasks
2. **Natural Language**: Use natural language - the agent understands intent and extracts parameters
3. **Error Handling**: Failed tool executions don't break the conversation
4. **Conversation Memory**: The agent remembers context and can refer to previous tool results
5. **Extensibility**: Easy to add new tools by extending the MCP servers

---

**Total Tools Available: 27** 🎉

Your AI agent now has access to a comprehensive suite of tools covering web scraping, data extraction, communication, productivity, and business automation. Start exploring the possibilities! 🚀
