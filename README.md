# 🤖 AI Agent with Gemini AI and MCP Integration

A powerful AI agent built with **Google Gemini AI** that integrates with multiple MCP (Model Context Protocol) servers to provide comprehensive capabilities including web scraping, data extraction, email services, WhatsApp messaging, Slack integration, calendar management, and much more.

## 🚀 Features

- **AI-Powered Intelligence**: Uses Google Gemini models (gemini-1.5-flash, gemini-1.5-pro) for natural language understanding
- **Multi-MCP Integration**: Connects to multiple MCP servers for diverse tool access
- **Web Scraping**: Advanced tools for extracting data from websites with JavaScript rendering support
- **Data Extraction**: Extract emails, URLs, dates, names, and other structured data from text content
- **Communication Tools**: Send emails, WhatsApp messages, and Slack notifications
- **Productivity Tools**: Calendar management, CRM operations, file storage, and database queries
- **Interactive CLI**: Command-line interface for easy interaction
- **Web API**: RESTful API endpoints for integration with other applications
- **Conversation Memory**: Maintains context across multiple interactions
- **Tool Execution**: Automatically executes tools based on user requests

## 🏗️ Architecture

The system consists of several key components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Gemini AI     │    │   MCP Client     │    │  MCP Servers   │
│     Agent       │◄──►│   (HTTP Client)  │◄──►│  (Multiple)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         ▼                       ▼              │  Enhanced MCP   │
┌─────────────────┐    ┌──────────────────┐    │   (Port 3000)   │
│  Conversation   │    │   Tool Registry  │    │ Web Scraping    │
│    History      │    │   & Execution    │    │ Data Extraction │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │              ┌─────────────────┐
                                │              │  Firecrawl MCP  │
                                │              │   (Port 3002)   │
                                │              │Advanced Scraping│
                                │              └─────────────────┘
                                │              ┌─────────────────┐
                                │              │  Composio MCP   │
                                │              │   (Port 3003)   │
                                │              │Email, WhatsApp,│
                                │              │Slack, Calendar  │
                                └──────────────┴─────────────────┘
```

### Component Breakdown

1. **Gemini AI Agent** (`src/agent/gemini-agent.ts`)
   - Manages conversation flow with Google Gemini AI
   - Handles tool calls and responses
   - Maintains conversation history
   - Automatically detects and executes relevant tools

2. **MCP Client** (`src/agent/mcp-client.ts`)
   - HTTP client for MCP server communication
   - Discovers available tools and resources
   - Executes tools remotely

3. **Enhanced MCP Server** (`src/agent/enhanced-mcp-server.ts`)
   - Provides comprehensive web scraping tools
   - Data extraction capabilities
   - Content analysis and link extraction
   - Social media and e-commerce scraping

4. **Firecrawl MCP Server** (`src/agent/firecrawl-mcp-server.ts`)
   - Advanced web scraping with JavaScript rendering
   - Screenshot capture capabilities
   - Search and batch processing
   - Metadata extraction

5. **Composio MCP Server** (`src/agent/composio-mcp-server.ts`)
   - Email services (Gmail, Outlook, SendGrid)
   - WhatsApp Business API integration
   - Slack messaging and notifications
   - Calendar event management
   - CRM operations (Salesforce, HubSpot, Pipedrive)
   - File storage (Google Drive, Dropbox, OneDrive, AWS S3)
   - Database operations (PostgreSQL, MySQL, MongoDB)
   - Webhook triggers for automation

6. **Web API Server** (`src/agent/web-api-server.ts`)
   - RESTful API endpoints
   - Aggregates all MCP servers
   - Provides unified interface for external applications

7. **Interactive CLI** (`src/agent/cli.ts`)
   - User-friendly command-line interface
   - Real-time interaction with the AI agent
   - Built-in help and command system

## 🛠️ Installation

1. **Clone and navigate to the project**:
   ```bash
   cd mastra-notes/Generic Agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Google Gemini Configuration
   GOOGLE_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   
   # Enhanced MCP Server (Port 3000)
   ENHANCED_MCP_SERVER_PORT=3000
   
   # Firecrawl MCP Server (Port 3002)
   FIRECRAWL_PORT=3002
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   
   # Composio MCP Server (Port 3003)
   COMPOSIO_PORT=3003
   COMPOSIO_API_KEY=your_composio_api_key_here
   COMPOSIO_WORKSPACE_ID=your_composio_workspace_id_here
   
   # Web API Server (Port 3001)
   API_PORT=3001
   
   # Agent Configuration
   AGENT_NAME=AI Assistant
   AGENT_INSTRUCTIONS=You are a helpful AI assistant that can access web data and perform various tasks.
   ```

## 🚀 Usage

### Starting the MCP Servers

You can start the servers individually or use the provided scripts:

#### Option 1: Start Enhanced MCP Server (Web Scraping)
```bash
npm run enhanced-server
```
This starts a server on port 3000 with web scraping and data extraction tools.

#### Option 2: Start Firecrawl MCP Server (Advanced Scraping)
```bash
npm run firecrawl-server
```
This starts a server on port 3002 with JavaScript rendering and advanced scraping capabilities.

#### Option 3: Start Composio MCP Server (Communication & Productivity)
```bash
npm run composio-server
```
This starts a server on port 3003 with email, WhatsApp, Slack, calendar, and CRM tools.

#### Option 4: Start Web API Server (All-in-One)
```bash
npm run web-api
```
This starts the main API server on port 3001 that aggregates all MCP servers.

### Using the Interactive CLI

Start the interactive CLI to chat with your AI agent:

```bash
npm run cli
```

This will start an interactive session where you can:
- Chat with the AI agent
- Use built-in commands (help, clear, history, tools, etc.)
- Execute various tasks using natural language

### Example Interactions

#### 1. Web Scraping and Data Extraction
```
🤖 AI Agent > Scrape the content from https://example.com and extract all email addresses
```

#### 2. Email Services
```
🤖 AI Agent > Send email to user@example.com about project update with message "The project is progressing well"
```

#### 3. WhatsApp Messaging
```
🤖 AI Agent > Send WhatsApp message to +1234567890 saying "Hello! How are you today?"
```

#### 4. Calendar Management
```
🤖 AI Agent > Schedule a meeting for tomorrow at 2 PM about project review
```

#### 5. Slack Notifications
```
🤖 AI Agent > Send Slack message to #general channel about the new feature release
```

#### 6. CRM Operations
```
🤖 AI Agent > Create a new contact for John Doe with email john@example.com and company TechCorp
```

### Available Commands

- `help` - Show available commands
- `clear` - Clear conversation history
- `history` - Show conversation history
- `tools` - List available MCP tools
- `resources` - List available MCP resources
- `prompts` - List available MCP prompts
- `quit/exit/bye` - Exit the CLI

## 🎯 Composio Integration Features

### Email Services
- **Providers**: Gmail, Outlook, SendGrid, and more
- **Features**: HTML content, attachments, scheduling, CC/BCC
- **Use Cases**: Automated notifications, marketing campaigns, customer support

### WhatsApp Business API
- **Message Types**: Text, image, document, audio, video, templates
- **Features**: Media support, template variables, delivery status
- **Use Cases**: Customer service, appointment reminders, order updates

### Slack Integration
- **Channels**: Public channels, private channels, direct messages
- **Features**: Rich formatting, attachments, thread replies, block kit
- **Use Cases**: Team notifications, project updates, alert systems

### Calendar Management
- **Providers**: Google Calendar, Outlook, and more
- **Features**: Event creation, scheduling, reminders, attendee management
- **Use Cases**: Meeting scheduling, appointment booking, event management

### CRM Operations
- **Systems**: Salesforce, HubSpot, Pipedrive, and more
- **Features**: Contact management, custom fields, lead tracking
- **Use Cases**: Lead generation, customer management, sales automation

### File Storage
- **Providers**: Google Drive, Dropbox, OneDrive, AWS S3
- **Features**: File upload, sharing settings, tagging, organization
- **Use Cases**: Document management, backup systems, collaboration

### Database Operations
- **Databases**: PostgreSQL, MySQL, MongoDB, SQLite, MariaDB
- **Features**: Query execution, parameterized queries, read/write operations
- **Use Cases**: Data analysis, reporting, automation workflows

### Webhook Triggers
- **Features**: Custom payloads, headers, multiple HTTP methods
- **Use Cases**: System integration, automation triggers, API webhooks

## 🔧 MCP Integration Explained

### What is MCP?

The **Model Context Protocol (MCP)** is a standard for AI models to interact with external tools and data sources. It allows AI agents to:

- Discover available tools dynamically
- Execute tools with proper parameters
- Access resources and prompts
- Maintain consistent interfaces across different providers

### How Our Agent Connects to MCP

1. **Connection Phase**:
   ```typescript
   await this.mcpClient.connect();
   this.tools = await this.mcpClient.getAvailableTools();
   ```

2. **Tool Discovery**:
   - Agent queries all MCP servers for available tools
   - Tools are registered with Gemini AI for function calling
   - Each tool includes name, description, and parameter schema

3. **Tool Execution**:
   - Gemini AI decides when to call tools based on user input
   - Agent executes tools through appropriate MCP client
   - Results are incorporated into conversation

4. **Response Generation**:
   - Agent processes tool results
   - Generates final response incorporating tool data

## 🎯 Use Cases

### 1. Business Automation
- Automated email campaigns
- Customer appointment scheduling
- Lead generation and CRM updates
- Team notifications and updates

### 2. Web Research & Data Collection
- Scrape multiple websites for information
- Extract key data points
- Generate research summaries
- Monitor competitor activities

### 3. Content Management
- Analyze web content for trends
- Extract structured information
- Generate insights and reports
- Content quality assessment

### 4. Customer Service
- Automated WhatsApp responses
- Email support ticket management
- Customer data extraction
- Service scheduling

### 5. Project Management
- Team communication via Slack
- Meeting scheduling and reminders
- File sharing and collaboration
- Progress tracking and reporting

## 🚧 Development

### Project Structure

```
src/agent/
├── index.ts                    # Main entry point
├── gemini-agent.ts            # Core Gemini AI agent logic
├── mcp-client.ts              # MCP server communication
├── cli.ts                     # Interactive CLI interface
├── logger.ts                  # Logging utilities
├── enhanced-mcp-server.ts     # Enhanced web scraping MCP server
├── firecrawl-mcp-server.ts    # Firecrawl advanced scraping MCP server
├── composio-mcp-server.ts     # Composio integrations MCP server
├── web-api-server.ts          # Web API server with aggregation
└── start-server.ts            # Server startup script
```

### Adding New Tools

To add new tools to any MCP server:

1. **Define the tool schema** in the respective MCP server file
2. **Implement the execution logic**
3. **Add the endpoint** to the server
4. **Test with the agent**

### Extending the Agent

The agent can be extended by:
- Adding new MCP servers
- Implementing custom tools
- Enhancing conversation memory
- Adding new AI models

## 🔐 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Rate Limiting**: Implement rate limiting for external API calls
- **User Input Validation**: Validate all user inputs
- **HTTPS**: Use HTTPS in production for MCP server communication
- **Access Control**: Implement proper authentication for sensitive operations

## 🐛 Troubleshooting

### Common Issues

1. **Google Gemini API Key Error**:
   - Ensure `.env` file exists with valid API key
   - Check API key permissions and quota

2. **MCP Server Connection Failed**:
   - Verify server is running on correct port
   - Check firewall settings
   - Ensure server endpoints are accessible

3. **Composio API Errors**:
   - Verify COMPOSIO_API_KEY is set correctly
   - Check COMPOSIO_WORKSPACE_ID configuration
   - Ensure API key has necessary permissions

4. **Tool Execution Errors**:
   - Check tool parameter schemas
   - Verify MCP server is responding correctly
   - Review server logs for errors

### Debug Mode

Set log level to debug for more detailed information:

```typescript
logger.setLogLevel(LogLevel.DEBUG);
```

## 📚 Resources

- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io)
- [Composio Platform Documentation](https://docs.composio.dev)
- [Firecrawl API Documentation](https://firecrawl.dev/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built with Google Gemini AI for powerful language understanding
- Integrates with Composio platform for comprehensive business tools
- Uses Firecrawl for advanced web scraping capabilities
- Implements the Model Context Protocol standard for extensibility

---

**Happy AI Agent Building! 🤖✨**

Your AI agent is now equipped with:
- 🧠 **Gemini AI** for intelligent conversations
- 🌐 **Web scraping** for data collection
- 📧 **Email services** for communication
- 📱 **WhatsApp integration** for messaging
- 💬 **Slack integration** for team collaboration
- 📅 **Calendar management** for scheduling
- 👥 **CRM operations** for customer management
- 💾 **File storage** for document management
- 🗄️ **Database operations** for data processing
- 🔗 **Webhook triggers** for automation

Start exploring the possibilities! 🚀
