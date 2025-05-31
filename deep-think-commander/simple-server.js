// 構文チェック用のより単純なバージョンを作成する
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');

class SimpleDeepThinkCommanderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'deep-think-commander',
        version: '3.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze',
          description: 'テーマを分析し、仮説を生成します',
          inputSchema: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '分析対象のテーマ'
              }
            },
            required: ['theme']
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolName = request.params.name;
        const args = request.params.arguments;
        
        let result;
        
        if (toolName === 'analyze') {
          result = await this.handleAnalyze(args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `未知のツール: ${toolName}`
          );
        }
        
        return result;
      } catch (error) {
        console.error(`ツール ${request.params.name} の実行中にエラーが発生`, error);
        
        let errorMessage = `エラーが発生しました: ${error.message || String(error)}`;
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleAnalyze(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      const result = {
        theme: theme,
        analysis: "分析結果サンプル"
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`分析実行エラー: ${error.message}`);
    }
  }
}

const server = new SimpleDeepThinkCommanderServer();
server.run = async function() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error('Simple Deep Think Commander MCPサーバーが起動しました。');
};

if (require.main === module) {
  server.run().catch(err => {
    console.error('サーバー起動エラー:', err);
    process.exit(1);
  });
}

module.exports = SimpleDeepThinkCommanderServer;
