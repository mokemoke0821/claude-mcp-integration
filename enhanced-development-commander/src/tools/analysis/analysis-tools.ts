import { AnalysisService } from '../../services/analysis-service.js';
import { MCPToolDefinition, ToolResponse } from '../../types/common.js';

export class AnalysisTools {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService();
  }

  getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'analyze_project_structure',
        description: 'Analyze project structure, dependencies, and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to project directory (default: current directory)'
            }
          },
          required: []
        }
      },
      {
        name: 'analyze_code_performance',
        description: 'Analyze code performance and detect potential issues',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to code file to analyze'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'find_dead_code',
        description: 'Find potentially unused code in project',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to project directory (default: current directory)'
            }
          },
          required: []
        }
      },
      {
        name: 'dependency_analyzer',
        description: 'Analyze project dependencies and find potential issues',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to project directory (default: current directory)'
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
        case 'analyze_project_structure':
          return await this.handleProjectStructure(args);
        case 'analyze_code_performance':
          return await this.handleCodePerformance(args);
        case 'find_dead_code':
          return await this.handleDeadCode(args);
        case 'dependency_analyzer':
          return await this.handleDependencyAnalysis(args);
        default:
          throw new Error(`Unknown analysis tool: ${name}`);
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

  private async handleProjectStructure(args: any): Promise<ToolResponse> {
    const { projectPath = process.cwd() } = args;
    const analysis = await this.analysisService.analyzeProject(projectPath);

    const structureText = `Project Structure Analysis

Summary:
- Total files: ${analysis.summary.totalFiles}
- Total lines: ${analysis.summary.totalLines.toLocaleString()}
- Total size: ${(analysis.summary.size / (1024 * 1024)).toFixed(2)} MB

Languages/Extensions:
${Object.entries(analysis.summary.languages)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([ext, count]) => `• ${ext || '(no ext)'}: ${count} files`)
        .join('\n')}

Dependencies (${analysis.dependencies.total} total):
- Production: ${analysis.dependencies.dependencies.length}
- Development: ${analysis.dependencies.devDependencies.length}

Recommendations:
${analysis.recommendations.length > 0 ? analysis.recommendations.map((r: string) => `• ${r}`).join('\n') : '• Project structure looks good!'}

Next Steps:
- Use analyze_code_performance to check specific files
- Use find_dead_code to identify unused code
- Use dependency_analyzer for detailed dependency analysis`;

    return {
      content: [{
        type: 'text',
        text: structureText
      }]
    };
  }

  private async handleCodePerformance(args: any): Promise<ToolResponse> {
    const { filePath } = args;
    const performance = await this.analysisService.analyzePerformance(filePath);

    const performanceText = `Code Performance Analysis

File: ${performance.file}
Metrics:
- Lines of code: ${performance.lineCount}
- Complexity score: ${performance.complexity}/10 ${performance.complexity > 7 ? '(High)' : '(Good)'}

Issues Found (${performance.issues.length}):
${performance.issues.length > 0 ? performance.issues.map((issue: string) => `• ${issue}`).join('\n') : 'No performance issues detected!'}

Recommendations:
${performance.complexity > 7 ? '• Consider breaking down complex functions\n' : ''}
${performance.issues.length > 5 ? '• Multiple issues found - prioritize fixing them\n' : ''}
${performance.issues.length === 0 ? '• Code looks performant!' : ''}

Next Steps:
- Fix high-priority issues first
- Consider code review for complex sections
- Run tests after making changes`;

    return {
      content: [{
        type: 'text',
        text: performanceText
      }]
    };
  }

  private async handleDeadCode(args: any): Promise<ToolResponse> {
    const { projectPath = process.cwd() } = args;
    const deadCode = await this.analysisService.findDeadCode(projectPath);

    const deadCodeText = `Dead Code Analysis

Results:
${deadCode.length === 0 ? 'No obvious dead code found!' : `Found ${deadCode.length} potential dead code issues:`}

${deadCode.length > 0 ? deadCode.slice(0, 20).map(item => `• ${item}`).join('\n') : ''}
${deadCode.length > 20 ? `\n... and ${deadCode.length - 20} more issues` : ''}

Recommendations:
${deadCode.length > 0 ? `
• Review flagged code carefully before removing
• Use your IDE's "Find Usages" to double-check
• Consider gradual cleanup over time
• Update documentation after cleanup
` : `
• Maintain good practices to avoid dead code
• Regular code reviews help catch unused code
• Consider automated tools for continuous monitoring
`}

Next Steps:
- Review each flagged item manually
- Use version control to track removals
- Update tests if needed`;

    return {
      content: [{
        type: 'text',
        text: deadCodeText
      }]
    };
  }

  private async handleDependencyAnalysis(args: any): Promise<ToolResponse> {
    const { projectPath = process.cwd() } = args;
    const analysis = await this.analysisService.analyzeProject(projectPath);

    const dependencyText = `Dependency Analysis

Overview:
- Total dependencies: ${analysis.dependencies.total}
- Production: ${analysis.dependencies.dependencies.length}
- Development: ${analysis.dependencies.devDependencies.length}

Production Dependencies:
${analysis.dependencies.dependencies.slice(0, 15).map((dep: string) => `• ${dep}`).join('\n')}
${analysis.dependencies.dependencies.length > 15 ? `\n... and ${analysis.dependencies.dependencies.length - 15} more` : ''}

Development Dependencies:
${analysis.dependencies.devDependencies.slice(0, 10).map((dep: string) => `• ${dep}`).join('\n')}
${analysis.dependencies.devDependencies.length > 10 ? `\n... and ${analysis.dependencies.devDependencies.length - 10} more` : ''}

Recommendations:
• Regularly audit dependencies for security updates
• Consider removing unused dependencies
• Keep dependencies up to date
• Use tools like npm audit for security checks

Quick Commands:
- npm audit - Check for vulnerabilities
- npm outdated - Check for updates
- npm ls - View dependency tree`;

    return {
      content: [{
        type: 'text',
        text: dependencyText
      }]
    };
  }
}