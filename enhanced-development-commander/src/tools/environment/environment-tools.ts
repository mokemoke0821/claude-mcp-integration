import { EnvironmentService } from '../../services/environment-service.js';
import { MCPToolDefinition, ToolResponse } from '../../types/common.js';

export class EnvironmentTools {
  private envService: EnvironmentService;

  constructor() {
    this.envService = new EnvironmentService();
  }

  getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'env_process_monitor',
        description: 'Monitor running Node.js processes and development servers',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Filter processes by name (optional)'
            }
          },
          required: []
        }
      },
      {
        name: 'env_port_manager',
        description: 'Check port usage and find available ports',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'check', 'find'],
              description: 'Action to perform'
            },
            port: {
              type: 'number',
              description: 'Port number (for check action)'
            },
            startPort: {
              type: 'number',
              description: 'Starting port for find action (default: 3000)'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'env_config_manager',
        description: 'Manage environment variables and .env files',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['load', 'save', 'switch', 'list'],
              description: 'Action to perform'
            },
            environment: {
              type: 'string',
              enum: ['development', 'production', 'test', 'staging'],
              description: 'Environment to switch to'
            },
            key: {
              type: 'string',
              description: 'Environment variable key'
            },
            value: {
              type: 'string',
              description: 'Environment variable value'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'env_log_analyzer',
        description: 'Analyze application logs for errors and patterns',
        inputSchema: {
          type: 'object',
          properties: {
            logPath: {
              type: 'string',
              description: 'Path to log file'
            },
            tail: {
              type: 'number',
              description: 'Number of lines from end (optional)'
            },
            grep: {
              type: 'string',
              description: 'Search pattern (optional)'
            }
          },
          required: ['logPath']
        }
      },
      {
        name: 'env_system_info',
        description: 'Get system and development environment information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }

  async handleTool(name: string, args: any): Promise<ToolResponse> {
    try {
      switch (name) {
        case 'env_process_monitor':
          return await this.handleProcessMonitor(args);
        case 'env_port_manager':
          return await this.handlePortManager(args);
        case 'env_config_manager':
          return await this.handleConfigManager(args);
        case 'env_log_analyzer':
          return await this.handleLogAnalyzer(args);
        case 'env_system_info':
          return await this.handleSystemInfo(args);
        default:
          throw new Error(`Unknown environment tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }

  private async handleProcessMonitor(args: any): Promise<ToolResponse> {
    const { filter } = args;
    const processes = await this.envService.getRunningProcesses(filter);

    if (processes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No Node.js processes found\n\nTip: Start your development server with npm run dev or similar command.`
        }]
      };
    }

    const processText = `Running Development Processes

Active Processes (${processes.length} found):
${processes.map(p => `
• PID ${p.pid} - ${p.name}
   Command: ${p.command}
   ${p.cpu !== undefined ? `CPU: ${p.cpu}%` : ''}
   ${p.memory !== undefined ? `Memory: ${p.memory}${process.platform === 'win32' ? ' KB' : '%'}` : ''}
`).join('\n')}

Quick Actions:
• Kill a process: kill <PID> (Unix) or taskkill /PID <PID> /F (Windows)
• View detailed info: ps aux | grep <PID> (Unix)
• Monitor in real-time: top or htop (Unix)

Tips:
• High CPU usage might indicate infinite loops
• High memory usage might indicate memory leaks
• Use process managers like PM2 for production`;

    return {
      content: [{
        type: 'text',
        text: processText
      }]
    };
  }

  private async handlePortManager(args: any): Promise<ToolResponse> {
    const { action, port, startPort = 3000 } = args;

    switch (action) {
      case 'list': {
        const ports = await this.envService.getPortUsage();

        if (ports.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No active ports detected\n\nTip: This might be due to permissions. Try running with elevated privileges if needed.`
            }]
          };
        }

        // Group ports by common services
        const webPorts = ports.filter(p => p.port >= 3000 && p.port <= 9999);
        const dbPorts = ports.filter(p => [3306, 5432, 27017, 6379].includes(p.port));
        const otherPorts = ports.filter(p => !webPorts.includes(p) && !dbPorts.includes(p));

        const portsText = `Active Port Usage

${webPorts.length > 0 ? `Web Services (${webPorts.length}):
${webPorts.map(p => `• Port ${p.port} - ${p.process} (PID: ${p.pid})`).join('\n')}` : ''}

${dbPorts.length > 0 ? `
Database Services (${dbPorts.length}):
${dbPorts.map(p => `• Port ${p.port} - ${p.process} (PID: ${p.pid})`).join('\n')}` : ''}

${otherPorts.length > 0 ? `
Other Services (${otherPorts.length}):
${otherPorts.slice(0, 10).map(p => `• Port ${p.port} - ${p.process} (PID: ${p.pid})`).join('\n')}
${otherPorts.length > 10 ? `
... and ${otherPorts.length - 10} more` : ''}` : ''}

Common Ports:
• 3000-3999: Development servers
• 5432: PostgreSQL
• 3306: MySQL
• 27017: MongoDB
• 6379: Redis`;

        return {
          content: [{
            type: 'text',
            text: portsText
          }]
        };
      }

      case 'check': {
        if (!port) throw new Error('Port number is required for check action');

        const isAvailable = await this.envService.checkPortAvailability(port);

        return {
          content: [{
            type: 'text',
            text: `Port ${port} Status

${isAvailable ?
                `Available - Port ${port} is free to use!` :
                `In Use - Port ${port} is already occupied.

Tip: Use env_port_manager with action: "find" to get an available port.`}`
          }]
        };
      }

      case 'find': {
        const availablePort = await this.envService.findAvailablePort(startPort);

        return {
          content: [{
            type: 'text',
            text: `Available Port Found

Available Port ${availablePort} is available!

Usage Examples:
• npm run dev -- --port ${availablePort}
• PORT=${availablePort} npm start
• Update your .env: PORT=${availablePort}`
          }]
        };
      }

      default:
        throw new Error(`Unknown port action: ${action}`);
    }
  }

  private async handleConfigManager(args: any): Promise<ToolResponse> {
    const { action, environment, key, value } = args;

    switch (action) {
      case 'load': {
        const config = await this.envService.loadEnvFile();
        const configKeys = Object.keys(config);

        if (configKeys.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No .env file found

Tip: Create one with:
\`\`\`bash
echo "NODE_ENV=development" > .env
\`\`\``
            }]
          };
        }

        const configText = `Environment Configuration

Current Variables (${configKeys.length}):
${configKeys.map(k => `• **${k}**: \`${config[k].substring(0, 50)}${config[k].length > 50 ? '...' : ''}\``).join('\n')}

Tips:
• Keep sensitive values in .env.local
• Never commit .env files with secrets
• Use different .env files for different environments`;

        return {
          content: [{
            type: 'text',
            text: configText
          }]
        };
      }

      case 'switch': {
        if (!environment) throw new Error('Environment is required for switch action');

        const config = await this.envService.switchEnvironment(environment);

        return {
          content: [{
            type: 'text',
            text: `Environment Switched

Now using ${environment} environment

Active Config:
${Object.entries(config).slice(0, 5).map(([k, v]) => `• ${k}: ${v}`).join('\n')}${Object.keys(config).length > 5 ? `
... and ${Object.keys(config).length - 5} more variables` : ''}`
          }]
        };
      }

      case 'list': {
        const envFiles = ['.env', '.env.development', '.env.production', '.env.test', '.env.staging'];
        const existing = [];

        for (const file of envFiles) {
          try {
            const config = await this.envService.loadEnvFile(file);
            if (Object.keys(config).length > 0) {
              existing.push({ file, count: Object.keys(config).length });
            }
          } catch (e) { }
        }

        return {
          content: [{
            type: 'text',
            text: `Available Environment Files

${existing.length > 0 ?
                existing.map(e => `• **${e.file}** (${e.count} variables)`).join('\n') :
                'No environment files found'}

Tip: Create environment files:
• Development: .env.development
• Production: .env.production
• Testing: .env.test`
          }]
        };
      }

      case 'save': {
        if (!key || !value) throw new Error('Both key and value are required for save action');

        const config = await this.envService.loadEnvFile();
        config[key] = value;
        await this.envService.saveEnvFile(config);

        return {
          content: [{
            type: 'text',
            text: `Environment Variable Saved

${key} = \`${value}\`

Note: Restart your application to apply changes.`
          }]
        };
      }

      default:
        throw new Error(`Unknown config action: ${action}`);
    }
  }

  private async handleLogAnalyzer(args: any): Promise<ToolResponse> {
    const { logPath, tail, grep } = args;
    const analysis = await this.envService.analyzeLogFile(logPath, { tail, grep });

    const logText = `Log Analysis Report

File: \`${logPath}\`
Statistics:
• Total lines: ${analysis.totalLines.toLocaleString()}
• Filtered lines: ${analysis.filteredLines}
• Errors: ${analysis.errors}
• Warnings: ${analysis.warnings}
• Info: ${analysis.info}

${analysis.errors > 0 ? `
Error Summary:
Found ${analysis.errors} error entries. Review logs for details.` : ''}

Recent Entries (last ${analysis.tail.length} lines):
\`\`\`
${analysis.tail.slice(-10).join('\n')}
\`\`\`

Log Management Tips:
• Use log rotation to prevent huge files
• Implement structured logging (JSON)
• Use log levels appropriately
• Consider centralized logging for production`;

    return {
      content: [{
        type: 'text',
        text: logText
      }]
    };
  }

  private async handleSystemInfo(args: any): Promise<ToolResponse> {
    const info = await this.envService.getSystemInfo();

    const systemText = `System & Environment Information

System:
• Platform: ${info.platform}
• Architecture: ${info.arch}
• Node.js: ${info.nodeVersion}
• Uptime: ${info.uptime}

Memory Usage:
• Heap Used: ${info.memoryUsage.heapUsed}
• Heap Total: ${info.memoryUsage.heapTotal}
• External: ${info.memoryUsage.external}

Package Managers:
${info.npmVersion ? `• npm: v${info.npmVersion}` : '• npm: not found'}
${info.yarnVersion ? `• yarn: v${info.yarnVersion}` : '• yarn: not found'}
${info.pnpmVersion ? `• pnpm: v${info.pnpmVersion}` : '• pnpm: not found'}

Performance Tips:
• Monitor memory usage to detect leaks
• Use \`--max-old-space-size\` for memory limits
• Enable \`--inspect\` for debugging
• Use process managers for production`;

    return {
      content: [{
        type: 'text',
        text: systemText
      }]
    };
  }
}