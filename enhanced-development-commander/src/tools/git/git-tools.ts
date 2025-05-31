import { GitService } from '../../services/git-service.js';
import { MCPToolDefinition, ToolResponse } from '../../types/common.js';

export class GitTools {
  private gitService: GitService;

  constructor() {
    this.gitService = new GitService();
  }

  getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'git_status_enhanced',
        description: 'Get enhanced git repository status with detailed information',
        inputSchema: {
          type: 'object',
          properties: {
            workingDir: {
              type: 'string',
              description: 'Working directory path (optional)'
            }
          },
          required: []
        }
      },
      {
        name: 'git_commit_smart',
        description: 'Create a smart commit with template-based message generation',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message (optional if autoGenerate is true)'
            },
            autoGenerate: {
              type: 'boolean',
              description: 'Auto-generate commit message using templates'
            },
            type: {
              type: 'string',
              enum: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
              description: 'Conventional commit type'
            }
          },
          required: []
        }
      },
      {
        name: 'git_branch_manager',
        description: 'Manage git branches (create, switch, list, delete)',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'switch', 'list', 'delete'],
              description: 'Action to perform'
            },
            branchName: {
              type: 'string',
              description: 'Branch name (required for create/switch/delete)'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'git_history_explorer',
        description: 'Explore git commit history with formatting',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of commits to show (default: 10)'
            }
          },
          required: []
        }
      },
      {
        name: 'git_diff_analyzer',
        description: 'Analyze git differences between commits, staged/unstaged',
        inputSchema: {
          type: 'object',
          properties: {
            staged: {
              type: 'boolean',
              description: 'Show staged changes (default: false shows unstaged)'
            }
          },
          required: []
        }
      },
      {
        name: 'git_stash_manager',
        description: 'Manage git stash (save/restore changes)',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['stash', 'unstash'],
              description: 'Stash action to perform'
            },
            message: {
              type: 'string',
              description: 'Stash message (for stash action)'
            }
          },
          required: ['action']
        }
      }
    ];
  }

  async handleTool(name: string, args: any): Promise<ToolResponse> {
    try {
      switch (name) {
        case 'git_status_enhanced':
          return await this.handleEnhancedStatus(args);
        case 'git_commit_smart':
          return await this.handleSmartCommit(args);
        case 'git_branch_manager':
          return await this.handleBranchManager(args);
        case 'git_history_explorer':
          return await this.handleHistoryExplorer(args);
        case 'git_diff_analyzer':
          return await this.handleDiffAnalyzer(args);
        case 'git_stash_manager':
          return await this.handleStashManager(args);
        default:
          throw new Error(`Unknown git tool: ${name}`);
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

  private async handleEnhancedStatus(args: any): Promise<ToolResponse> {
    const status = await this.gitService.getEnhancedStatus();

    const statusText = `Git Repository Status

Current Branch: ${status.current}
Sync Status: ${status.ahead} ahead, ${status.behind} behind

File Changes:
${status.staged.length > 0 ? `Staged (${status.staged.length}): ${status.staged.slice(0, 5).join(', ')}${status.staged.length > 5 ? '...' : ''}` : ''}
${status.modified.length > 0 ? `Modified (${status.modified.length}): ${status.modified.slice(0, 5).join(', ')}${status.modified.length > 5 ? '...' : ''}` : ''}
${status.not_added.length > 0 ? `Untracked (${status.not_added.length}): ${status.not_added.slice(0, 5).join(', ')}${status.not_added.length > 5 ? '...' : ''}` : ''}
${status.deleted.length > 0 ? `Deleted (${status.deleted.length}): ${status.deleted.slice(0, 5).join(', ')}${status.deleted.length > 5 ? '...' : ''}` : ''}
${status.conflicted.length > 0 ? `Conflicted (${status.conflicted.length}): ${status.conflicted.join(', ')}` : ''}

${status.staged.length === 0 && status.modified.length === 0 && status.not_added.length === 0 ? 'Working tree clean' : ''}

Quick Actions:
- Use git_commit_smart to commit staged changes
- Use git_branch_manager to manage branches
- Use git_diff_analyzer to see detailed changes`;

    return {
      content: [{
        type: 'text',
        text: statusText
      }]
    };
  }

  private async handleSmartCommit(args: any): Promise<ToolResponse> {
    const { message, autoGenerate = false, type } = args;
    const result = await this.gitService.smartCommit(message, autoGenerate, type);

    return {
      content: [{
        type: 'text',
        text: `Commit Successful\n\n${result}\n\nTip: Use conventional commit types (feat, fix, docs, etc.) for better history!`
      }]
    };
  }

  private async handleBranchManager(args: any): Promise<ToolResponse> {
    const { action, branchName } = args;

    let result: string;
    switch (action) {
      case 'create':
        if (!branchName) throw new Error('Branch name is required for create action');
        result = await this.gitService.createBranch(branchName);
        break;
      case 'switch':
        if (!branchName) throw new Error('Branch name is required for switch action');
        result = await this.gitService.switchBranch(branchName);
        break;
      case 'list':
        const branches = await this.gitService.getBranches();
        result = `**Available Branches**:\n${branches.map(b => `• ${b}`).join('\n')}`;
        break;
      case 'delete':
        result = 'Branch deletion feature coming soon';
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      content: [{
        type: 'text',
        text: result
      }]
    };
  }

  private async handleHistoryExplorer(args: any): Promise<ToolResponse> {
    const { limit = 10 } = args;
    const history = await this.gitService.getCommitHistory(limit);

    const historyText = `Git Commit History (Last ${limit} commits)

${history.map(commit =>
      `${commit.hash} - ${commit.message}
  Author: ${commit.author}
  Date: ${commit.date}`
    ).join('\n\n')}

Tips:
- Use git_diff_analyzer to see changes for specific commits
- Use git_branch_manager to see commit history per branch`;

    return {
      content: [{
        type: 'text',
        text: historyText
      }]
    };
  }

  private async handleDiffAnalyzer(args: any): Promise<ToolResponse> {
    const { staged = false } = args;
    const diff = await this.gitService.getDiff(staged);

    if (!diff) {
      return {
        content: [{
          type: 'text',
          text: `No ${staged ? 'staged' : 'unstaged'} changes found\n\nTip: ${staged ? 'Stage files with \`git add\`' : 'Make some changes to see diffs here'}`
        }]
      };
    }

    const lines = diff.split('\n');
    const addedLines = lines.filter(line => line.startsWith('+')).length;
    const removedLines = lines.filter(line => line.startsWith('-')).length;
    const changedFiles = lines.filter(line => line.startsWith('+++') || line.startsWith('---')).length / 2;

    const diffText = `Diff Analysis (${staged ? 'Staged' : 'Unstaged'} Changes)

Summary:
- Files changed: ${changedFiles}
- Lines added: ${addedLines}
- Lines removed: ${removedLines}
- Net change: ${addedLines - removedLines > 0 ? '+' : ''}${addedLines - removedLines}

${diff}

Tip: Use \`git_commit_smart\` with \`autoGenerate: true\` to create a contextual commit message!`;

    return {
      content: [{
        type: 'text',
        text: diffText
      }]
    };
  }

  private async handleStashManager(args: any): Promise<ToolResponse> {
    const { action, message } = args;

    let result: string;
    switch (action) {
      case 'stash':
        result = await this.gitService.stashChanges(message);
        break;
      case 'unstash':
        result = await this.gitService.unstashChanges();
        break;
      default:
        throw new Error(`Unknown stash action: ${action}`);
    }

    return {
      content: [{
        type: 'text',
        text: `Stash Operation Complete\n\n${result}`
      }]
    };
  }
}