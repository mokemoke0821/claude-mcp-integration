export class TemplateService {
  private commitTemplates: Record<string, string> = {
    feat: 'feat: add new feature',
    fix: 'fix: resolve issue with',
    docs: 'docs: update documentation for',
    style: 'style: improve formatting in',
    refactor: 'refactor: restructure',
    test: 'test: add tests for',
    chore: 'chore: update'
  };
  
  generateCommitMessage(diff: string, type?: string): string {
    try {
      const changes = this.analyzeDiff(diff);
      const suggestedType = type || this.suggestCommitType(changes);
      const template = this.commitTemplates[suggestedType as keyof typeof this.commitTemplates] || this.commitTemplates.feat;
      
      return `${template} ${changes.primaryFile || 'multiple files'}`;
    } catch (error) {
      return 'feat: update codebase';
    }
  }
  
  private analyzeDiff(diff: string): any {
    const lines = diff.split('\n');
    const changedFiles = lines
      .filter(line => line.startsWith('+++') || line.startsWith('---'))
      .map(line => line.replace(/^[\+\-]{3}\s*/, ''))
      .filter(file => !file.startsWith('/dev/null'));
    
    const addedLines = lines.filter(line => line.startsWith('+')).length;
    const removedLines = lines.filter(line => line.startsWith('-')).length;
    
    return {
      changedFiles,
      primaryFile: changedFiles[0]?.split('/').pop(),
      addedLines,
      removedLines,
      isLargeChange: changedFiles.length > 5 || addedLines > 100
    };
  }
  
  private suggestCommitType(changes: any): string {
    if (changes.primaryFile?.includes('test')) return 'test';
    if (changes.primaryFile?.includes('README') || changes.primaryFile?.includes('.md')) return 'docs';
    if (changes.removedLines > changes.addedLines) return 'refactor';
    if (changes.isLargeChange) return 'feat';
    return 'fix';
  }
  
  generateCodeTemplate(type: string, name: string): string {
    const templates: Record<string, string> = {
      component: `export interface ${name}Props {
  // Define props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};`,
      
      function: `export function ${name}() {
  // Function implementation
  return;
}`,
      
      class: `export class ${name} {
  constructor() {
    // Constructor implementation
  }
  
  // Class methods
}`,
      
      test: `describe('${name}', () => {
  it('should work correctly', () => {
    // Test implementation
    expect(true).toBe(true);
  });
});`
    };
    
    return templates[type] || templates.function;
  }
}