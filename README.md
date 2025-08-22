# 🤖 AI Agent with MCP Integration

A powerful AI agent built with [Mastra](https://mastra.ai) that integrates with external MCP (Model Context Protocol) servers to provide web scraping, data extraction, and intelligent task automation capabilities.

## 🚀 Features

- **AI-Powered Intelligence**: Uses OpenAI models (GPT-4o, GPT-4o-mini) for natural language understanding
- **MCP Integration**: Connects to external MCP servers for tool access
- **Web Scraping**: Built-in tools for extracting data from websites
- **Data Extraction**: Extract emails, URLs, dates, and names from text content
- **Interactive CLI**: Command-line interface for easy interaction
- **Conversation Memory**: Maintains context across multiple interactions
- **Tool Execution**: Automatically executes tools based on user requests

## 🏗️ Architecture

The system consists of several key components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent     │    │   MCP Client     │    │  MCP Server    │
│   (OpenAI)     │◄──►│   (HTTP Client)  │◄──►│  (Express.js)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Conversation   │    │   Tool Registry  │    │  Web Scraping  │
│    History      │    │   & Execution    │    │  & Extraction  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Breakdown

1. **AI Agent** (`src/agent/agent.ts`)
   - Manages conversation flow with OpenAI
   - Handles tool calls and responses
   - Maintains conversation history

2. **MCP Client** (`src/agent/mcp-client.ts`)
   - HTTP client for MCP server communication
   - Discovers available tools and resources
   - Executes tools remotely

3. **Example MCP Server** (`src/agent/example-mcp-server.ts`)
   - Provides web scraping tools
   - Data extraction capabilities
   - Resource and prompt management

4. **Interactive CLI** (`src/agent/cli.ts`)
   - User-friendly command-line interface
   - Real-time interaction with the AI agent
   - Built-in help and command system

## 🛠️ Installation

1. **Clone and navigate to the project**:
   ```bash
   cd mastra-notes/notes-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   MCP_SERVER_URL=http://localhost:3000
   MCP_SERVER_NAME=example-mcp-server
   AGENT_NAME=AI Assistant
   AGENT_INSTRUCTIONS=You are a helpful AI assistant that can access web data and perform various tasks.
   ```

## 🚀 Usage

### Starting the MCP Server

First, start the example MCP server in one terminal. You can use one of the pre-configured scripts like `npm run enhanced-server`, or run the main example server:

```bash
tsx src/agent/example-mcp-server.ts
```

This will start a server on port 3000 with the following tools:
- `web_scraper`: Scrape content from web URLs
- `data_extractor`: Extract structured data from text
- `summarizer`: Summarize long text content

### Using the Interactive CLI

In another terminal, start the interactive CLI:

```bash
npm run cli
```

This will start an interactive session where you can:
- Chat with the AI agent
- Use built-in commands (help, clear, history, tools, etc.)
- Execute web scraping and data extraction tasks

### Example Interactions

1. **Web Scraping**:
   ```
   🤖 AI Agent > Scrape the content from https://example.com and summarize it
   ```

2. **Data Extraction**:
   ```
   🤖 AI Agent > Extract all email addresses from this text: [paste text here]
   ```

3. **General Questions**:
   ```
   🤖 AI Agent > What can you help me with today?
   ```

### Available Commands

- `help` - Show available commands
- `clear` - Clear conversation history
- `history` - Show conversation history
- `tools` - List available MCP tools
- `resources` - List available MCP resources
- `prompts` - List available MCP prompts
- `quit/exit/bye` - Exit the CLI

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
   - Agent queries MCP server for available tools
   - Tools are registered with OpenAI for function calling
   - Each tool includes name, description, and parameter schema

3. **Tool Execution**:
   - OpenAI decides when to call tools based on user input
   - Agent executes tools through MCP client
   - Results are incorporated into conversation

4. **Response Generation**:
   - Agent processes tool results
   - Generates final response incorporating tool data

### MCP Server Endpoints

Our example MCP server provides these endpoints:

- `GET /info` - Server information and capabilities
- `GET /tools` - List available tools
- `POST /tools/{tool}/execute` - Execute a specific tool
- `GET /resources` - List available resources
- `GET /prompts` - List available prompts

## 🎯 Use Cases

### 1. Web Research
- Scrape multiple websites for information
- Extract key data points
- Generate research summaries

### 2. Content Analysis
- Analyze web content for trends
- Extract structured information
- Generate insights and reports

### 3. Data Processing
- Clean and structure raw data
- Extract specific data types
- Transform data formats

### 4. Automated Workflows
- Multi-step data collection
- Content summarization
- Report generation

## 🔍 Example Workflow

Here's how a typical interaction works:

1. **User Request**: "Scrape the latest news from techcrunch.com and summarize the main topics"

2. **AI Analysis**: The agent understands this requires web scraping and summarization

3. **Tool Execution**:
   - Calls `web_scraper` with techcrunch.com URL
   - Receives scraped content
   - Calls `summarizer` with the content

4. **Response Generation**: Agent creates a comprehensive summary of the main tech topics

## 🚧 Development

### Project Structure

```
src/agent/
├── index.ts              # Main entry point
├── agent.ts              # Core AI agent logic
├── mcp-client.ts         # MCP server communication
├── cli.ts                # Interactive CLI interface
├── logger.ts             # Logging utilities
├── example-mcp-server.ts # Example MCP server
└── start-server.ts       # Server startup script
```

### Adding New Tools

To add new tools to the MCP server:

1. **Define the tool schema** in `example-mcp-server.ts`
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
- **Rate Limiting**: Implement rate limiting for web scraping
- **User Input Validation**: Validate all user inputs
- **HTTPS**: Use HTTPS in production for MCP server communication

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Key Error**:
   - Ensure `.env` file exists with valid API key
   - Check API key permissions and quota

2. **MCP Server Connection Failed**:
   - Verify server is running on correct port
   - Check firewall settings
   - Ensure server endpoints are accessible

3. **Tool Execution Errors**:
   - Check tool parameter schemas
   - Verify MCP server is responding correctly
   - Review server logs for errors

### Debug Mode

Set log level to debug for more detailed information:

```typescript
logger.setLogLevel(LogLevel.DEBUG);
```

## 📚 Resources

- [Mastra Framework Documentation](https://mastra.ai)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Apify MCP Server](https://github.com/apify/actor-mastra-mcp-agent)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built with [Mastra](https://mastra.ai) framework
- Inspired by [Apify's MCP Agent](https://github.com/apify/actor-mastra-mcp-agent)
- Uses OpenAI's powerful language models
- Implements the Model Context Protocol standard

---

**Happy AI Agent Building! 🤖✨**
