import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { ToolRegistry } from './core/tool-registry.js';
import { AnalysisTools } from './tools/analysis/analysis-tools.js';
import { EnvironmentTools } from './tools/environment/environment-tools.js';
import { GitTools } from './tools/git/git-tools.js';
import { TemplateTools } from './tools/templates/template-tools.js';

config();

console.error('Enhanced Development Commander starting...');
console.error('High-performance local development assistant ready!');

class EnhancedDevelopmentCommander {
  private server: Server;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.server = new Server({
      name: 'enhanced-development-commander',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.toolRegistry = new ToolRegistry(this.server);
    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools() {
    this.toolRegistry.registerToolGroup(new GitTools());
    console.error('Git tools registered');

    this.toolRegistry.registerToolGroup(new AnalysisTools());
    console.error('Analysis tools registered');

    this.toolRegistry.registerToolGroup(new TemplateTools());
    console.error('Template tools registered');

    this.toolRegistry.registerToolGroup(new EnvironmentTools());
    console.error('Environment tools registered');
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('Shutting down Enhanced Development Commander...');
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Enhanced Development Commander running on stdio');
      console.error('Available tool categories: Git, Analysis, Templates, Environment');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new EnhancedDevelopmentCommander();
server.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});