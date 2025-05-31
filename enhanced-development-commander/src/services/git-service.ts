import simpleGit, { SimpleGit } from 'simple-git';
import { GitStatus } from '../types/common.js';
import { TemplateService } from './template-service.js';

export class GitService {
  private git: SimpleGit;
  private templateService: TemplateService;
  
  constructor(workingDir: string = process.cwd()) {
    this.git = simpleGit(workingDir);
    this.templateService = new TemplateService();
  }
  
  async getEnhancedStatus(): Promise<GitStatus> {
    try {
      const status = await this.git.status();
      const branch = await this.git.branch();
      
      let ahead = 0;
      let behind = 0;
      
      if ('tracking' in branch && branch.tracking) {
        try {
          const aheadResult = await this.git.raw(['rev-list', '--count', `${branch.tracking}..HEAD`]);
          const behindResult = await this.git.raw(['rev-list', '--count', `HEAD..${branch.tracking}`]);
          ahead = parseInt(aheadResult.trim()) || 0;
          behind = parseInt(behindResult.trim()) || 0;
        } catch (error) {
          console.warn('Failed to calculate ahead/behind counts:', error instanceof Error ? error.message : String(error));
        }
      }
      
      return {
        current: branch.current || 'unknown',
        ahead,
        behind,
        staged: status.staged,
        modified: status.modified,
        not_added: status.not_added,
        deleted: status.deleted,
        conflicted: status.conflicted
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async smartCommit(message?: string, autoGenerate = false, type?: string): Promise<string> {
    try {
      if (autoGenerate && !message) {
        const diff = await this.git.diff(['--cached']);
        if (!diff) {
          throw new Error('No staged changes found for commit');
        }
        message = this.templateService.generateCommitMessage(diff, type);
      }
      
      if (!message) {
        throw new Error('Commit message is required');
      }
      
      const result = await this.git.commit(message);
      return `Committed: ${result.commit} - ${message}`;
    } catch (error) {
      throw new Error(`Failed to commit: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async createBranch(branchName: string, checkout = true): Promise<string> {
    try {
      await this.git.checkoutLocalBranch(branchName);
      return `Created and switched to branch: ${branchName}`;
    } catch (error) {
      throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async switchBranch(branchName: string): Promise<string> {
    try {
      await this.git.checkout(branchName);
      return `Switched to branch: ${branchName}`;
    } catch (error) {
      throw new Error(`Failed to switch branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getBranches(): Promise<string[]> {
    try {
      const branches = await this.git.branch();
      return branches.all;
    } catch (error) {
      throw new Error(`Failed to get branches: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getCommitHistory(limit = 10): Promise<any[]> {
    try {
      const log = await this.git.log({ maxCount: limit });
      return log.all.map(commit => ({
        hash: commit.hash.substring(0, 8),
        message: commit.message,
        author: commit.author_name,
        date: commit.date
      }));
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getDiff(staged = false): Promise<string> {
    try {
      const args = staged ? ['--cached'] : [];
      return await this.git.diff(args);
    } catch (error) {
      throw new Error(`Failed to get diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async stashChanges(message?: string): Promise<string> {
    try {
      const result = await this.git.stash(['push', '-m', message || 'Auto stash']);
      return `Stashed changes: ${message || 'Auto stash'}`;
    } catch (error) {
      throw new Error(`Failed to stash changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async unstashChanges(): Promise<string> {
    try {
      await this.git.stash(['pop']);
      return 'Unstashed latest changes';
    } catch (error) {
      throw new Error(`Failed to unstash changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}