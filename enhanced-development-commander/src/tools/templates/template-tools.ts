import { TemplateService } from '../../services/template-service.js';
import { MCPToolDefinition, ToolResponse } from '../../types/common.js';

export class TemplateTools {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();
  }

  getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'generate_code_template',
        description: 'Generate code templates for common patterns',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['component', 'function', 'class', 'test', 'api'],
              description: 'Type of template to generate'
            },
            name: {
              type: 'string',
              description: 'Name for the generated code'
            },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript', 'react', 'node'],
              description: 'Target language/framework'
            }
          },
          required: ['type', 'name']
        }
      },
      {
        name: 'suggest_commit_message',
        description: 'Suggest commit message based on changes',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
              description: 'Conventional commit type'
            },
            description: {
              type: 'string',
              description: 'Brief description of changes'
            }
          },
          required: []
        }
      }
    ];
  }

  async handleTool(name: string, args: any): Promise<ToolResponse> {
    try {
      switch (name) {
        case 'generate_code_template':
          return await this.handleCodeTemplate(args);
        case 'suggest_commit_message':
          return await this.handleCommitMessage(args);
        default:
          throw new Error(`Unknown template tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }

  private async handleCodeTemplate(args: any): Promise<ToolResponse> {
    const { type, name, language = 'typescript' } = args;
    const template = this.templateService.generateCodeTemplate(type, name);

    const templateText = `Generated ${type.charAt(0).toUpperCase() + type.slice(1)} Template

Name: ${name}
Language: ${language}

\`\`\`${language === 'typescript' ? 'typescript' : 'javascript'}
${template}
\`\`\`

Tips:
• Customize the template to fit your project structure
• Add proper types for TypeScript projects
• Consider adding JSDoc comments for documentation
• Follow your project's naming conventions

Next Steps:
1. Save to appropriate file location
2. Add imports/exports as needed
3. Implement the actual logic
4. Add tests if applicable`;

    return {
      content: [{
        type: 'text',
        text: templateText
      }]
    };
  }

  private async handleCommitMessage(args: any): Promise<ToolResponse> {
    const { type, description } = args;

    const suggestions = [
      type && description ? `${type}: ${description}` : null,
      type ? `${type}: update implementation` : null,
      description ? `feat: ${description}` : null,
      'feat: implement new functionality',
      'fix: resolve issue',
      'docs: update documentation',
      'refactor: improve code structure'
    ].filter(Boolean);

    const messageText = `Commit Message Suggestions

Recommended Messages:
${suggestions.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Conventional Commit Format:
<type>[optional scope]: <description>

Common Types:
• feat - New feature
• fix - Bug fix
• docs - Documentation
• style - Formatting changes
• refactor - Code restructuring
• test - Adding tests
• chore - Maintenance tasks

Best Practices:
• Keep messages under 50 characters for the subject
• Use imperative mood ("add" not "added")
• Capitalize the first letter
• Don't end with a period

Example: feat: add user authentication system`;

    return {
      content: [{
        type: 'text',
        text: messageText
      }]
    };
  }
}