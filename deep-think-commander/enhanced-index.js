#!/usr/bin/env node
// 拡張版Deep Think Commander
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');

// ユーティリティモジュールの読み込み
const ThinkingUtils = require('./utils/thinking-utils.js');
const ThinkingTools = require('./utils/thinking-tools.js');

// Deep Thinking拡張版サーバー
class EnhancedDeepThinkCommanderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'deep-think-commander',
        version: '2.0.0',
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
        // 基本的な思考分析機能 (オリジナルから拡張)
        {
          name: 'analyze',
          description: 'テーマを分析し仮説を生成します',
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
        },
        
        // 思考プロセスの詳細化ツール (新規追加)
        {
          name: 'decompose',
          description: 'テーマや問題を構成要素に分解します',
          inputSchema: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '分解する対象のテーマや問題'
              }
            },
            required: ['theme']
          }
        },
        {
          name: 'generateHypotheses',
          description: '体系的に複数の仮説を生成します',
          inputSchema: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '仮説を生成するテーマ'
              }
            },
            required: ['theme']
          }
        },
        {
          name: 'evaluateEvidence',
          description: '仮説の証拠を評価するフレームワークを提供します',
          inputSchema: {
            type: 'object',
            properties: {
              hypothesis: {
                type: 'string',
                description: '評価する仮説'
              }
            },
            required: ['hypothesis']
          }
        },
        {
          name: 'logicalReasoning',
          description: '論理的推論プロセスを適用します',
          inputSchema: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                description: '推論を適用するテーマ'
              }
            },
            required: ['theme']
          }
        },
        {
          name: 'metaCognition',
          description: '思考プロセス自体を評価します',
          inputSchema: {
            type: 'object',
            properties: {
              thinkingProcess: {
                type: 'string',
                description: '評価する思考プロセスの説明'
              }
            },
            required: ['thinkingProcess']
          }
        },
        
        // 思考ツール (新規追加)
        {
          name: 'swotAnalysis',
          description: 'SWOT分析（強み、弱み、機会、脅威）を実施します',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'SWOT分析を行うトピック'
              }
            },
            required: ['topic']
          }
        },
        {
          name: 'analysis5W1H',
          description: '5W1H分析（What, Why, Who, When, Where, How）を実施します',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: '5W1H分析を行うトピック'
              }
            },
            required: ['topic']
          }
        },
        {
          name: 'causeEffectAnalysis',
          description: '原因-結果分析（フィッシュボーン/特性要因図）を実施します',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: '分析する問題'
              }
            },
            required: ['problem']
          }
        },
        {
          name: 'mindMap',
          description: 'マインドマップの基本構造を生成します',
          inputSchema: {
            type: 'object',
            properties: {
              centralTopic: {
                type: 'string',
                description: 'マインドマップの中心トピック'
              }
            },
            required: ['centralTopic']
          }
        },
        {
          name: 'socraticQuestioning',
          description: 'ソクラテス的問答法のフレームワークを適用します',
          inputSchema: {
            type: 'object',
            properties: {
              belief: {
                type: 'string',
                description: '検証する信念や主張'
              }
            },
            required: ['belief']
          }
        },
        {
          name: 'sixThinkingHats',
          description: 'シックスシンキングハット法による多角的思考を促進します',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: '考察するトピック'
              }
            },
            required: ['topic']
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolName = request.params.name;
        const args = request.params.arguments;
        
        let result;
        
        // 基本的な思考分析機能 (拡張版)
        if (toolName === 'analyze') {
          result = await this.handleAnalyze(args);
        } else if (toolName === 'counter') {
          result = await this.handleCounter(args);
        } else if (toolName === 'perspective') {
          result = await this.handlePerspective(args);
        } 
        // 思考プロセスの詳細化ツール
        else if (toolName === 'decompose') {
          result = await this.handleDecompose(args);
        } else if (toolName === 'generateHypotheses') {
          result = await this.handleGenerateHypotheses(args);
        } else if (toolName === 'evaluateEvidence') {
          result = await this.handleEvaluateEvidence(args);
        } else if (toolName === 'logicalReasoning') {
          result = await this.handleLogicalReasoning(args);
        } else if (toolName === 'metaCognition') {
          result = await this.handleMetaCognition(args);
        }
        // 思考ツール
        else if (toolName === 'swotAnalysis') {
          result = await this.handleSWOTAnalysis(args);
        } else if (toolName === 'analysis5W1H') {
          result = await this.handle5W1HAnalysis(args);
        } else if (toolName === 'causeEffectAnalysis') {
          result = await this.handleCauseEffectAnalysis(args);
        } else if (toolName === 'mindMap') {
          result = await this.handleMindMap(args);
        } else if (toolName === 'socraticQuestioning') {
          result = await this.handleSocraticQuestioning(args);
        } else if (toolName === 'sixThinkingHats') {
          result = await this.handleSixThinkingHats(args);
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

  // ========== 基本的な思考分析機能（拡張版） ==========
  
  async handleAnalyze(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      // テーマの分解
      const decomposition = ThinkingUtils.decomposeTheme(theme);
      
      // 仮説生成
      const hypotheses = ThinkingUtils.generateHypotheses(theme);
      
      // 複数の視点からの分析
      const perspectives = ThinkingUtils.thinkFromMultiplePerspectives(theme);
      
      const result = {
        theme: theme,
        decomposition: decomposition,
        mainHypothesis: hypotheses[0],
        alternativeHypotheses: hypotheses.slice(1, 3),
        keyPerspectives: perspectives.perspectives.slice(0, 3),
        nextSteps: [
          "仮説の証拠評価を行う（evaluateEvidenceツールを使用）",
          "論理的推論プロセスを適用する（logicalReasoningツールを使用）",
          "代替視点からさらに分析を深める（perspectiveツールを使用）"
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
      // 仮説の証拠評価フレームワークを適用
      const evidenceEvaluation = ThinkingUtils.evaluateEvidence(hypothesis);
      
      const result = {
        hypothesis: hypothesis,
        counterArguments: [
          {
            point: "論理的批判",
            description: "この仮説には以下の論理的欠陥があります",
            details: evidenceEvaluation.evidenceFramework.counterEvidence.map(item => item.question)
          },
          {
            point: "代替説明",
            description: "同じ現象を説明できる代替仮説",
            examples: ["代替説明1: 別の因果関係の可能性", "代替説明2: より単純な説明の可能性"]
          },
          {
            point: "限界と境界条件",
            description: "この仮説が適用できない条件や状況",
            conditions: ["適用限界1: 特定の条件下では当てはまらない", "適用限界2: 例外的なケースの存在"]
          }
        ],
        refinementSuggestions: [
          "仮説の範囲を明確に限定する",
          "前提条件を明示的に示す",
          "反証可能な形に仮説を再構成する"
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
      // 複数の視点から思考
      const multiPerspectives = ThinkingUtils.thinkFromMultiplePerspectives(theme);
      
      const result = {
        theme: theme,
        perspectives: multiPerspectives.perspectives.map(p => ({
          name: p.name,
          analysis: `${p.approach} - ${p.keyQuestions[0]}`,
          insights: `この視点からの洞察: ${p.keyQuestions[1]}`
        })),
        synthesis: {
          commonPoints: "複数の視点に共通する重要なポイント",
          tensions: "異なる視点間の緊張関係や対立点",
          integratedView: "異なる視点を統合した包括的理解"
        },
        applicationSuggestions: [
          "特定の視点をさらに深く探索するために使用できるツール",
          "異なる視点間の対話を促進する方法",
          "状況に応じた最適な視点の選択基準"
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

  // ========== 思考プロセスの詳細化ツール ==========
  
  async handleDecompose(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      const decomposition = ThinkingUtils.decomposeTheme(theme);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(decomposition, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`分解実行エラー: ${error.message}`);
    }
  }

  async handleGenerateHypotheses(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      const hypotheses = ThinkingUtils.generateHypotheses(theme);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(hypotheses, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`仮説生成エラー: ${error.message}`);
    }
  }

  async handleEvaluateEvidence(args) {
    const { hypothesis } = args;
    
    if (!hypothesis) {
      throw new Error('仮説が指定されていません');
    }

    try {
      const evidenceEvaluation = ThinkingUtils.evaluateEvidence(hypothesis);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(evidenceEvaluation, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`証拠評価エラー: ${error.message}`);
    }
  }

  async handleLogicalReasoning(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    try {
      const reasoningApproaches = ThinkingUtils.applyLogicalReasoning(theme);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(reasoningApproaches, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`論理的推論エラー: ${error.message}`);
    }
  }

  async handleMetaCognition(args) {
    const { thinkingProcess } = args;
    
    if (!thinkingProcess) {
      throw new Error('思考プロセスが指定されていません');
    }

    try {
      const metaEvaluation = ThinkingUtils.applyMetaCognition(thinkingProcess);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(metaEvaluation, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`メタ認知評価エラー: ${error.message}`);
    }
  }

  // ========== 思考ツール ==========
  
  async handleSWOTAnalysis(args) {
    const { topic } = args;
    
    if (!topic) {
      throw new Error('トピックが指定されていません');
    }

    try {
      const swotAnalysis = ThinkingTools.applySWOT(topic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(swotAnalysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`SWOT分析エラー: ${error.message}`);
    }
  }

  async handle5W1HAnalysis(args) {
    const { topic } = args;
    
    if (!topic) {
      throw new Error('トピックが指定されていません');
    }

    try {
      const analysis5W1H = ThinkingTools.apply5W1H(topic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis5W1H, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`5W1H分析エラー: ${error.message}`);
    }
  }

  async handleCauseEffectAnalysis(args) {
    const { problem } = args;
    
    if (!problem) {
      throw new Error('問題が指定されていません');
    }

    try {
      const causeEffectAnalysis = ThinkingTools.applyCauseEffectAnalysis(problem);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(causeEffectAnalysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`原因-結果分析エラー: ${error.message}`);
    }
  }

  async handleMindMap(args) {
    const { centralTopic } = args;
    
    if (!centralTopic) {
      throw new Error('中心トピックが指定されていません');
    }

    try {
      const mindMap = ThinkingTools.generateMindMap(centralTopic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mindMap, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`マインドマップ生成エラー: ${error.message}`);
    }
  }

  async handleSocraticQuestioning(args) {
    const { belief } = args;
    
    if (!belief) {
      throw new Error('信念や主張が指定されていません');
    }

    try {
      const socraticQuestioning = ThinkingTools.applySocraticQuestioning(belief);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(socraticQuestioning, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`ソクラテス的問答法エラー: ${error.message}`);
    }
  }

  async handleSixThinkingHats(args) {
    const { topic } = args;
    
    if (!topic) {
      throw new Error('トピックが指定されていません');
    }

    try {
      const sixThinkingHats = ThinkingTools.applySixThinkingHats(topic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sixThinkingHats, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`シックスシンキングハット法エラー: ${error.message}`);
    }
  }
}

// サーバーインスタンスを作成して実行
const server = new EnhancedDeepThinkCommanderServer();
server.run = async function() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error('Enhanced Deep Think Commander MCPサーバーが起動しました。');
};

server.run().catch(err => {
  console.error('サーバー起動エラー:', err);
  process.exit(1);
});
