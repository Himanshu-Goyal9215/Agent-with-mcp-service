# 🚀 Quick Start Guide - AI Agent with Composio Integration

Get your AI agent up and running with all the powerful Composio integrations in minutes!

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd "mastra-notes/Generic Agent"
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
```

Edit `.env` with your API keys:
```env
# Required: Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional but recommended: Composio API Key
COMPOSIO_API_KEY=your_composio_api_key_here
COMPOSIO_WORKSPACE_ID=your_workspace_id_here

# Optional: Firecrawl API Key
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

### 3. Start the System
```bash
# Start all-in-one server (recommended for beginners)
npm run web-api

# Or start individual servers:
npm run enhanced-server    # Port 3000 - Web scraping
npm run firecrawl-server   # Port 3002 - Advanced scraping  
npm run composio-server    # Port 3003 - Communication tools
```

### 4. Test the CLI
```bash
npm run cli
```

## 🎯 What You Can Do Now

### 📧 Send Emails
```
🤖 AI Agent > Send email to john@example.com about project update with message "The project is progressing well and we're on track for the deadline"
```

### 📱 Send WhatsApp Messages
```
🤖 AI Agent > Send WhatsApp message to +1234567890 saying "Hello! Your appointment is confirmed for tomorrow at 2 PM"
```

### 💬 Send Slack Messages
```
🤖 AI Agent > Send Slack message to #general channel about the new feature release
```

### 📅 Schedule Calendar Events
```
🤖 AI Agent > Schedule a meeting for tomorrow at 3 PM about quarterly review
```

### 🌐 Web Scraping
```
🤖 AI Agent > Scrape the content from https://example.com and extract all email addresses
```

### 📊 Data Extraction
```
🤖 AI Agent > Extract all phone numbers and email addresses from this text: [paste your text here]
```

## 🔧 Advanced Usage

### Starting Individual Servers

#### Enhanced MCP Server (Port 3000)
```bash
npm run enhanced-server
```
**Tools Available:**
- `web_scraper` - Comprehensive web scraping
- `data_extractor` - Extract structured data
- `content_analyzer` - Analyze content sentiment and topics
- `link_extractor` - Extract and categorize links
- `social_media_scraper` - Social media data extraction
- `news_aggregator` - News article extraction
- `ecommerce_scraper` - Product information extraction

#### Firecrawl MCP Server (Port 3002)
```bash
npm run firecrawl-server
```
**Tools Available:**
- `firecrawl_scraper` - JavaScript-rendered web scraping
- `firecrawl_search` - Search and scrape multiple pages
- `firecrawl_batch_scrape` - Batch URL processing
- `firecrawl_metadata` - Comprehensive metadata extraction

#### Composio MCP Server (Port 3003)
```bash
npm run composio-server
```
**Tools Available:**
- `composio_send_email` - Send emails with attachments
- `composio_whatsapp_message` - WhatsApp Business API
- `composio_slack_message` - Slack integration
- `composio_calendar_event` - Calendar management
- `composio_crm_contact` - CRM operations
- `composio_file_upload` - Cloud storage integration
- `composio_database_query` - Database operations
- `composio_webhook_trigger` - Webhook automation

### Web API Usage

Start the web API server:
```bash
npm run web-api
```

**Available Endpoints:**
- `GET /api/health` - System health check
- `POST /api/chat` - Send messages to AI agent
- `GET /api/tools` - List all available tools
- `POST /api/scrape` - Direct website scraping
- `GET /api/status` - System status and capabilities

**Example API Call:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Send email to test@example.com about meeting reminder"}'
```

## 🎨 Real-World Examples

### 1. Customer Service Automation
```
🤖 AI Agent > Send WhatsApp message to +1234567890 saying "Hi! Your order #12345 has been shipped and will arrive tomorrow. Track your package at [tracking-link]"
```

### 2. Team Communication
```
🤖 AI Agent > Send Slack message to #project-updates channel about the milestone completion
```

### 3. Meeting Management
```
🤖 AI Agent > Schedule a team meeting for Friday at 10 AM about sprint planning
```

### 4. Data Collection
```
🤖 AI Agent > Scrape the pricing page from competitor.com and extract all product names and prices
```

### 5. Lead Generation
```
🤖 AI Agent > Extract all email addresses from this LinkedIn company page and create CRM contacts for each
```

## 🔍 Troubleshooting

### Common Issues

1. **"Agent not initialized"**
   - Check if all required environment variables are set
   - Ensure at least one MCP server is running
   - Check server logs for connection errors

2. **"Tool execution failed"**
   - Verify the specific MCP server is running
   - Check API key validity for external services
   - Review server logs for detailed error messages

3. **"No MCP client available"**
   - Start the required MCP server
   - Check server ports and URLs in configuration
   - Ensure firewall allows local connections

### Debug Mode

Set log level to debug in your `.env`:
```env
LOG_LEVEL=debug
```

### Check Server Status

Visit these URLs to verify servers are running:
- Enhanced MCP: http://localhost:3000/info
- Firecrawl MCP: http://localhost:3002/info  
- Composio MCP: http://localhost:3003/info
- Web API: http://localhost:3001/api/health

## 🚀 Next Steps

1. **Explore Tools**: Use `tools` command in CLI to see all available capabilities
2. **Customize Instructions**: Modify `AGENT_INSTRUCTIONS` in `.env` to tailor agent behavior
3. **Add New Tools**: Extend MCP servers with custom tools for your specific needs
4. **Integrate APIs**: Connect the web API to your applications and workflows
5. **Scale Up**: Deploy to production with proper security and monitoring

## 💡 Pro Tips

- **Conversation Memory**: The agent remembers context across multiple interactions
- **Natural Language**: Use natural language - the agent understands intent
- **Tool Chaining**: The agent can use multiple tools in sequence for complex tasks
- **Error Handling**: Failed tool executions don't break the conversation
- **Extensibility**: Easy to add new MCP servers and tools

---

**Ready to build amazing AI-powered workflows? Start with the examples above and let your creativity flow! 🚀✨**
