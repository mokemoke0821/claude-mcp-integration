declare module '@modelcontextprotocol/sdk' {
  export interface ServerResult {
    [key: string]: unknown;
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
    output?: string;
    error?: string;
    exitCode?: number;
    _meta?: {
      [key: string]: unknown;
    };
  }

  export class Server {
    constructor(config: { name: string; version: string }, options: { capabilities: { tools: Record<string, any> } });
    setRequestHandler(schema: any, handler: (request: any, extra: any) => Promise<ServerResult>): void;
    notification(notification: { method: string; params: Record<string, any> }): void;
  }
} 