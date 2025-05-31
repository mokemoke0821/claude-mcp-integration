#!/usr/bin/env node
// CommonJS形式で記述
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');

// Deep Thinkingツール用サーバー
class DeepThinkCommanderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'deep-think-commander',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // エラーハンドリング
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
        },
        {
          name: 'counter',
          description: '仮説に対する反証を検討します',
          inputSchema: {
            type: 'object',
            properties: {
              hypothesis: {
                type: 'string',
                description: '反証を検討する仮説'
              }
            },
            required: ['hypothesis']
          },
        },
        {
          name: 'perspective',
          description: '代替視点から分析を行います',
          inputSchema: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '分析対象のテーマ'
              }
            },
            required: ['theme']
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'analyze':
            return await this.handleAnalyze(request.params.arguments);
          case 'counter':
            return await this.handleCounter(request.params.arguments);
          case 'perspective':
            return await this.handlePerspective(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `未知のツール: ${request.params.name}`
            );
        }
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
        mainHypothesis: `${theme}に関する主な仮説`,
        supportingPoints: [
          "支持点1: 様々な研究によれば、この観点は有効である",
          "支持点2: 歴史的な事例がこの仮説を支持している",
          "支持点3: 現代の状況からも妥当性が確認できる"
        ]
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

  async handleCounter(args) {
    const { hypothesis } = args;
    
    if (!hypothesis) {
      throw new Error('仮説が指定されていません');
    }

    try {
      const result = {
        counterPoints: [
          "反証1: 別の観点からは異なる解釈が可能",
          "反証2: これに対する重要な批判点として以下が挙げられる",
          "反証3: データからは異なる結論も導き出せる"
        ]
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
      throw new Error(`反証実行エラー: ${error.message}`);
    }
  }

  async handlePerspective(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      const result = {
        perspectives: [
          "代替視点1: 歴史的観点からの分析",
          "代替視点2: 経済的観点からの分析",
          "代替視点3: 社会的観点からの分析"
        ]
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
      throw new Error(`視点分析エラー: ${error.message}`);
    }
  }
}

// サーバーインスタンスを作成して実行
const server = new DeepThinkCommanderServer();
server.run = async function() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error('Deep Think Commander MCPサーバーが起動しました。');
};

server.run().catch(err => {
  console.error('サーバー起動エラー:', err);
  process.exit(1);
});
