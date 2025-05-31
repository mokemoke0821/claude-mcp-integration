import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPToolDefinition } from '../types/common.js';

export class ToolRegistry {
  private tools: Map<string, any> = new Map();
  private toolDefinitions: MCPToolDefinition[] = [];
  
  constructor(private server: Server) {
    this.setupHandlers();
  }
  
  registerToolGroup(toolGroup: any) {
    const definitions = toolGroup.getToolDefinitions();
    this.toolDefinitions.push(...definitions);
    
    definitions.forEach((def: MCPToolDefinition) => {
      this.tools.set(def.name, toolGroup);
    });
  }
  
  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolDefinitions
    }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const toolGroup = this.tools.get(name);
      
      if (!toolGroup) {
        throw new Error(`Tool not found: ${name}`);
      }
      
      return await toolGroup.handleTool(name, args || {});
    });
  }
}