#!/usr/bin/env node
/**
 * Deep Think Commander V3 - 拡張版思考プロセスMCPサーバー
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');

// ユーティリティモジュールの読み込み
const ThinkingUtils = require('./utils/thinking-utils.js');
const ThinkingTools = require('./utils/thinking-tools.js');
const AdvancedThinking = require('./utils/advanced-thinking.js');
const ThoughtChain = require('./utils/thought-chain.js');
const debug = require('./utils/debug-utility.js');
const MCPCommunicator = require('./utils/mcp-communicator.js');
const MultiStageAnalysisManager = require('./utils/multi-stage-analysis.js');

// Deep Thinking拡張版サーバー
class EnhancedDeepThinkCommanderServer {
  constructor() {
    debug.info('Deep Think Commander V3サーバーの初期化を開始');
    
    // サーバーの設定
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

    // フレームワーク管理とMCP連携の初期化
    this.frameworkManager = new ThinkingFrameworkManager();
    this.mcpIntegration = new MCPCommunicator();
    this.multiStageAnalysis = new MultiStageAnalysisManager();
    
    // セッション状態の初期化
    this.sessions = new Map();
    
    // ツールハンドラの設定
    this.setupToolHandlers();
    
    // エラーハンドリング
    this.server.onerror = (error) => {
      debug.error('MCPサーバーエラー', error);
      console.error('[MCP Error]', error);
    };
    
    process.on('SIGINT', async () => {
      debug.info('SIGINTシグナルを受信、サーバーを終了します');
      await this.server.close();
      process.exit(0);
    });
    
    debug.info('Deep Think Commander V3サーバーの初期化を完了');
  }

  setupToolHandlers() {
    debug.info('ツールハンドラーの設定を開始');
    
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      const sessionId = request?.meta?.sessionId;
      debug.debug('ListToolsリクエストを受信', { sessionId });
      
      // 新しいセッションの場合は初期化
      if (sessionId && !this.sessions.has(sessionId)) {
        this.initializeSession(sessionId);
        debug.info('新しいセッションを初期化', { sessionId });
      }
      
      return {
        tools: [
          // 基本的な思考分析機能
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
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const sessionId = request?.meta?.sessionId;
      const toolName = request.params.name;
      const args = request.params.arguments;
      
      debug.debug(`ツール "${toolName}" の実行リクエストを受信`, { sessionId, args });
      
      try {
        let result;
        
        if (toolName === 'analyze') {
          result = await this.handleAnalyze(args);
        } else if (toolName === 'counter') {
          result = await this.handleCounter(args);
        } else if (toolName === 'perspective') {
          result = await this.handlePerspective(args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `未知のツール: ${toolName}`
          );
        }
        
        return result;
      } catch (error) {
        debug.error(`ツール "${toolName}" の実行中にエラーが発生`, { error });
        console.error(`ツール ${toolName} の実行中にエラーが発生`, error);
        
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
    
    debug.info('ツールハンドラーの設定を完了');
  }

  // セッションの初期化
  initializeSession(sessionId) {
    this.sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      history: [],
      context: {},
      activeFramework: null
    });
  }
  
  // 基本的な思考分析機能
  async handleAnalyze(args) {
    const { theme } = args;
    
    if (!theme) {
      throw new Error('テーマが指定されていません');
    }

    debug.info(`分析実行: "${theme}"`);
    
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
      debug.error(`分析実行エラー: ${error.message}`, { theme, error });
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
      debug.error(`反証実行エラー: ${error.message}`, { hypothesis, error });
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
      debug.error(`視点分析エラー: ${error.message}`, { theme, error });
      throw new Error(`視点分析エラー: ${error.message}`);
    }
  }
}

/**
 * カスタマイズ可能な思考フレームワーク管理
 */
class ThinkingFrameworkManager {
  constructor() {
    this.frameworks = {
      'technical-analysis': {
        name: '技術分析フレームワーク',
        description: '技術的な問題に対する体系的な分析プロセス',
        stages: [
          {
            name: '問題の定義と分解',
            tools: ['decompose', 'causeEffectAnalysis']
          },
          {
            name: '多角的検討と仮説生成',
            tools: ['generateHypotheses', 'perspective']
          },
          {
            name: '論理的評価と検証',
            tools: ['logicalReasoning', 'evaluateEvidence']
          },
          {
            name: '実装戦略と最適化',
            tools: ['decisionMatrix', 'scenarioPlanning']
          }
        ]
      },
      'business-strategy': {
        name: 'ビジネス戦略フレームワーク',
        description: 'ビジネス戦略策定のための思考プロセス',
        stages: [
          {
            name: '状況分析と市場理解',
            tools: ['swotAnalysis', 'analysis5W1H']
          },
          {
            name: '戦略的選択肢の探索',
            tools: ['dialecticalThinking', 'sixThinkingHats']
          },
          {
            name: '意思決定と優先順位付け',
            tools: ['decisionMatrix', 'strategicThinkingChain']
          },
          {
            name: '実行計画と適応戦略',
            tools: ['mentalModels', 'mindMap']
          }
        ]
      }
    };
  }

  /**
   * 登録されているフレームワーク一覧を取得
   */
  getFrameworks() {
    return Object.keys(this.frameworks).map(key => ({
      id: key,
      name: this.frameworks[key].name,
      description: this.frameworks[key].description
    }));
  }

  /**
   * 特定のフレームワークの詳細を取得
   */
  getFrameworkDetails(frameworkId) {
    return this.frameworks[frameworkId];
  }
}

// サーバーインスタンスを作成して実行
const server = new EnhancedDeepThinkCommanderServer();
server.run = async function() {
  debug.info('Deep Think Commander V3サーバーの起動を開始');
  
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  
  debug.info('Deep Think Commander V3サーバーが起動しました');
  console.error('Deep Think Commander V3 MCPサーバーが起動しました。');
  console.error('機能強化: 多段階分析プロセス, 思考ツール連携, カスタマイズ可能な思考フレームワーク, MCPサーバー間連携');
};

// サーバー実行
if (require.main === module) {
  server.run().catch(err => {
    debug.error('サーバー起動エラー', { error: err });
    console.error('サーバー起動エラー:', err);
    process.exit(1);
  });
}

module.exports = EnhancedDeepThinkCommanderServer;
