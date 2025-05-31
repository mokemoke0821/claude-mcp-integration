export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface GitStatus {
  current: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  not_added: string[];
  deleted: string[];
  conflicted: string[];
}

export interface ProjectAnalysis {
  summary: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    complexity: number;
  };
  structure: any;
  dependencies: any;
  recommendations: string[];
}