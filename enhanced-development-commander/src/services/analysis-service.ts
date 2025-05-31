import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export class AnalysisService {
  async analyzeProject(projectPath: string): Promise<any> {
    try {
      const files = await this.scanProjectFiles(projectPath);
      const structure = await this.analyzeStructure(files);
      const dependencies = await this.analyzeDependencies(projectPath);
      const metrics = await this.calculateMetrics(files);
      
      return {
        summary: {
          totalFiles: files.length,
          totalLines: metrics.totalLines,
          languages: metrics.languages,
          size: metrics.totalSize
        },
        structure,
        dependencies,
        recommendations: this.generateRecommendations(metrics, structure)
      };
    } catch (error) {
      throw new Error(`Failed to analyze project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private async scanProjectFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      '**/*.{js,ts,jsx,tsx,py,java,cpp,c,h,cs,php,rb,go,rs}',
      '**/*.{json,yaml,yml,xml,html,css,scss,sass,less}',
      '**/*.{md,txt,conf,config}'
    ];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'build/**', 'dist/**']
      });
      files.push(...matches.map(f => path.join(projectPath, f)));
    }
    
    return files;
  }
  
  private async analyzeStructure(files: string[]): Promise<any> {
    const structure: Record<string, string[]> = {};
    const extensions: Record<string, number> = {};
    
    for (const file of files) {
      const ext = path.extname(file);
      extensions[ext] = (extensions[ext] || 0) + 1;
      
      const dir = path.dirname(file);
      if (!structure[dir]) structure[dir] = [];
      structure[dir].push(path.basename(file));
    }
    
    return { directories: structure, extensions };
  }
  
  private async analyzeDependencies(projectPath: string): Promise<any> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        total: Object.keys({
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        }).length
      };
    } catch (error) {
      return { dependencies: [], devDependencies: [], total: 0 };
    }
  }
  
  private async calculateMetrics(files: string[]): Promise<any> {
    let totalLines = 0;
    let totalSize = 0;
    const languages: Record<string, number> = {};
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        totalSize += stats.size;
        
        const ext = path.extname(file);
        languages[ext] = (languages[ext] || 0) + 1;
        
        const content = await fs.readFile(file, 'utf8');
        totalLines += content.split('\n').length;
      } catch (error) {
        continue;
      }
    }
    
    return { totalLines, totalSize, languages };
  }
  
  private generateRecommendations(metrics: any, structure: any): string[] {
    const recommendations = [];
    
    if (metrics.totalLines > 50000) {
      recommendations.push('Consider breaking down large files for better maintainability');
    }
    
    if (Object.keys(structure.extensions).length > 10) {
      recommendations.push('Multiple language types detected - consider consistency');
    }
    
    if (metrics.totalSize > 100 * 1024 * 1024) {
      recommendations.push('Large project size - consider code optimization');
    }
    
    return recommendations;
  }
  
  async findDeadCode(projectPath: string): Promise<string[]> {
    const deadCode: string[] = [];
    return deadCode;
  }
  
  async analyzePerformance(file: string): Promise<any> {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      const issues: string[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('console.log')) {
          issues.push(`Line ${index + 1}: Remove console.log in production`);
        }
        if (line.includes('for (') && line.includes('.length')) {
          issues.push(`Line ${index + 1}: Consider caching array length`);
        }
        if (line.includes('innerHTML')) {
          issues.push(`Line ${index + 1}: innerHTML can be a security risk`);
        }
      });
      
      return {
        file,
        issues,
        lineCount: lines.length,
        complexity: this.calculateComplexity(content)
      };
    } catch (error) {
      throw new Error(`Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private calculateComplexity(content: string): number {
    const keywords = ['if', 'else', 'for', 'while', 'case', 'catch', 'try'];
    let complexity = 1;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      complexity += matches ? matches.length : 0;
    });
    
    return complexity;
  }
}