import axios from 'axios';
// Define Tool interface locally since we're not using AI SDK
interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}
import { Logger } from './logger.js';

export interface MCPClientConfig {
  serverUrl: string;
  serverName: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface ToolExecutionRequest {
  name: string;
  arguments: Record<string, any>;
}

export class MCPClient {
  private config: MCPClientConfig;
  private logger: Logger;
  private isConnected: boolean = false;
  private availableTools: Tool[] = [];

  constructor(config: MCPClientConfig) {
    this.config = config;
    this.logger = new Logger();
  }

  async connect(): Promise<void> {
    try {
      this.logger.info(`🔌 Connecting to MCP server: ${this.config.serverUrl}`);
      
      // Test connection by calling the server info endpoint
      const response = await axios.get(`${this.config.serverUrl}/info`, {
        timeout: 10000,
      });
      
      if (response.status === 200) {
        this.isConnected = true;
        this.logger.info(`✅ Connected to MCP server: ${response.data.name || this.config.serverName}`);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to connect to MCP server:', error);
      throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableTools(): Promise<Tool[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info('🔧 Fetching available tools from MCP server...');
      
      const response = await axios.get(`${this.config.serverUrl}/tools`, {
        timeout: 10000,
      });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        this.availableTools = response.data.map((tool: MCPTool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        }));
        
        this.logger.info(`✅ Found ${this.availableTools.length} tools`);
        return this.availableTools;
      } else {
        throw new Error('Invalid tools response from MCP server');
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch tools:', error);
      throw error;
    }
  }

  async executeTool(request: ToolExecutionRequest): Promise<any> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info(`🔧 Executing tool: ${request.name}`);
      
      const response = await axios.post(`${this.config.serverUrl}/tools/${request.name}/execute`, {
        arguments: request.arguments,
      }, {
        timeout: 30000, // Longer timeout for tool execution
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 200) {
        this.logger.info(`✅ Tool ${request.name} executed successfully`);
        return response.data;
      } else {
        throw new Error(`Tool execution failed with status: ${response.status}`);
      }
      
    } catch (error) {
      this.logger.error(`❌ Failed to execute tool ${request.name}:`, error);
      throw error;
    }
  }

  async listResources(): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info('📚 Fetching available resources from MCP server...');
      
      const response = await axios.get(`${this.config.serverUrl}/resources`, {
        timeout: 10000,
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Invalid resources response from MCP server');
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch resources:', error);
      throw error;
    }
  }

  async getResourceContent(uri: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info(`📖 Fetching resource content: ${uri}`);
      
      const response = await axios.get(`${this.config.serverUrl}/resources/${encodeURIComponent(uri)}`, {
        timeout: 10000,
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Invalid resource content response from MCP server');
      }
      
    } catch (error) {
      this.logger.error(`❌ Failed to fetch resource content for ${uri}:`, error);
      throw error;
    }
  }

  async listPrompts(): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info('💬 Fetching available prompts from MCP server...');
      
      const response = await axios.get(`${this.config.serverUrl}/prompts`, {
        timeout: 10000,
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Invalid prompts response from MCP server');
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to fetch prompts:', error);
      throw error;
    }
  }

  async getPromptMessages(name: string, args?: Record<string, any>): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info(`💬 Fetching prompt messages for: ${name}`);
      
      const response = await axios.post(`${this.config.serverUrl}/prompts/${name}/messages`, {
        arguments: args || {},
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Invalid prompt messages response from MCP server');
      }
      
    } catch (error) {
      this.logger.error(`❌ Failed to fetch prompt messages for ${name}:`, error);
      throw error;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getServerInfo(): MCPClientConfig {
    return { ...this.config };
  }

  disconnect(): void {
    this.isConnected = false;
    this.availableTools = [];
    this.logger.info('🔌 Disconnected from MCP server');
  }
}
