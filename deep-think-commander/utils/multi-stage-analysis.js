/**
 * 多段階分析プロセスマネージャー
 * 複数のステップを組み合わせた高度な分析フローを管理
 */

const ThinkingUtils = require('./thinking-utils.js');
const ThinkingTools = require('./thinking-tools.js');
const AdvancedThinking = require('./advanced-thinking.js');
const ThoughtChain = require('./thought-chain.js');
const debug = require('./debug-utility.js');

class MultiStageAnalysisManager {
  constructor() {
    // 事前定義された分析フロー
    this.analysisFlows = {
      'comprehensive-problem-analysis': {
        name: '包括的問題分析',
        description: '問題を多角的に分解し、解決策を体系的に導出するプロセス',
        stages: [
          {
            name: '問題の定義と分解',
            tools: ['decompose', 'analysis5W1H']
          },
          {
            name: '原因と影響の分析',
            tools: ['causeEffectAnalysis', 'perspective']
          },
          {
            name: '解決策の生成と評価',
            tools: ['generateHypotheses', 'decisionMatrix']
          },
          {
            name: '実装計画の策定',
            tools: ['scenarioPlanning', 'mindMap']
          }
        ]
      },
      'strategic-decision-making': {
        name: '戦略的意思決定',
        description: '複雑な意思決定を論理的かつ多角的に行うためのプロセス',
        stages: [
          {
            name: '状況と文脈の理解',
            tools: ['swotAnalysis', 'analysis5W1H']
          },
          {
            name: '選択肢の探索と生成',
            tools: ['dialecticalThinking', 'sixThinkingHats']
          },
          {
            name: '選択肢の評価と優先順位付け',
            tools: ['decisionMatrix', 'evaluateEvidence']
          },
          {
            name: '意思決定と実装戦略',
            tools: ['scenarioPlanning', 'strategicThinkingChain']
          }
        ]
      },
      'cognitive-bias-analysis': {
        name: '認知バイアス分析',
        description: '思考プロセスのバイアスを特定し、より客観的な分析を行うプロセス',
        stages: [
          {
            name: '初期理解と思考プロセスの明確化',
            tools: ['decompose', 'metaCognition']
          },
          {
            name: 'バイアスの特定と分析',
            tools: ['detectCognitiveBiases', 'socraticQuestioning']
          },
          {
            name: '代替視点と再評価',
            tools: ['perspective', 'sixThinkingHats']
          },
          {
            name: '改善された結論と学習',
            tools: ['criticalThinkingChain', 'metaCognition']
          }
        ]
      }
    };
    
    // カスタム分析フロー（ユーザー定義）
    this.customAnalysisFlows = {};
  }

  /**
   * 利用可能な分析フローを取得
   * @returns {Array} 分析フロー一覧
   */
  getAvailableFlows() {
    const predefinedFlows = Object.keys(this.analysisFlows).map(id => ({
      id,
      name: this.analysisFlows[id].name,
      description: this.analysisFlows[id].description,
      type: 'predefined'
    }));
    
    const customFlows = Object.keys(this.customAnalysisFlows).map(id => ({
      id,
      name: this.customAnalysisFlows[id].name,
      description: this.customAnalysisFlows[id].description,
      type: 'custom'
    }));
    
    return [...predefinedFlows, ...customFlows];
  }

  /**
   * 特定の分析フローの詳細を取得
   * @param {string} flowId - 分析フローID
   * @returns {Object} 分析フローの詳細
   */
  getFlowDetails(flowId) {
    const flow = this.analysisFlows[flowId] || this.customAnalysisFlows[flowId];
    
    if (!flow) {
      throw new Error(`分析フロー "${flowId}" が見つかりません。`);
    }
    
    return {
      id: flowId,
      name: flow.name,
      description: flow.description,
      stages: flow.stages.map(stage => ({
        name: stage.name,
        tools: stage.tools
      }))
    };
  }

  /**
   * 分析フローを実行
   * @param {string} flowId - 分析フローID
   * @param {Object} params - 分析パラメータ
   * @returns {Object} 分析結果
   */
  async executeAnalysisFlow(flowId, params) {
    debug.info(`分析フロー "${flowId}" の実行を開始`, params);
    
    const flow = this.analysisFlows[flowId] || this.customAnalysisFlows[flowId];
    
    if (!flow) {
      throw new Error(`分析フロー "${flowId}" が見つかりません。`);
    }
    
    const results = {
      flowId,
      flowName: flow.name,
      params,
      stageResults: [],
      integratedResults: {}
    };
    
    // コンテキスト（ステージ間で共有される情報）
    const context = {
      ...params
    };
    
    // 各ステージを順番に実行
    for (const stage of flow.stages) {
      debug.debug(`ステージ "${stage.name}" の実行を開始`, { flowId, context });
      
      const stageTimer = debug.startTimer(`stage-${stage.name}`);
      const stageResult = {
        name: stage.name,
        toolResults: {}
      };
      
      // 各ツールを実行
      for (const tool of stage.tools) {
        try {
          const toolTimer = debug.startTimer(`tool-${tool}`);
          
          // ここでは実際のツール実行は行わず、モックデータを返す
          stageResult.toolResults[tool] = {
            status: 'success',
            result: `${tool} の実行結果（実際の実装では各ツールの関数を呼び出す）`
          };
          
          debug.endTimer(toolTimer);
        } catch (error) {
          debug.error(`ツール "${tool}" の実行中にエラーが発生`, { error });
          stageResult.toolResults[tool] = {
            status: 'error',
            error: error.message
          };
        }
      }
      
      // ステージの結果を統合
      try {
        stageResult.integrated = this.integrateStageResults(stage.name, stageResult.toolResults, context);
        
        // コンテキストを更新
        context.lastStageResult = stageResult.integrated;
        
        // 統合結果をツールと紐づける
        Object.keys(stageResult.toolResults).forEach(tool => {
          if (stageResult.toolResults[tool].status === 'success') {
            context[`${tool}Result`] = stageResult.toolResults[tool].result;
          }
        });
      } catch (error) {
        debug.error(`ステージ "${stage.name}" の統合中にエラーが発生`, { error });
        stageResult.integrated = {
          status: 'error',
          error: error.message
        };
      }
      
      debug.endTimer(stageTimer);
      
      results.stageResults.push(stageResult);
    }
    
    // 全体の統合的な洞察を生成
    results.integratedResults = this.generateIntegratedInsights(results.stageResults, params);
    
    debug.info(`分析フロー "${flowId}" の実行を完了`, { flowId, params });
    
    return results;
  }

  /**
   * ステージの結果を統合
   * @param {string} stageName - ステージ名
   * @param {Object} toolResults - ツールの結果
   * @param {Object} context - コンテキスト
   * @returns {Object} 統合された結果
   */
  integrateStageResults(stageName, toolResults, context) {
    // 実際の実装では、ステージに応じた統合ロジックを実装
    return {
      stageName,
      summary: `${stageName}の統合結果`,
      keyPoints: ['統合ポイント1', '統合ポイント2', '統合ポイント3'],
      nextSteps: ['次のステップ1', '次のステップ2']
    };
  }

  /**
   * 全体の統合的な洞察を生成
   * @param {Array} stageResults - 各ステージの結果
   * @param {Object} params - 分析パラメータ
   * @returns {Object} 統合された洞察
   */
  generateIntegratedInsights(stageResults, params) {
    return {
      summary: `${params.topic || '分析対象'}の総合的な分析結果`,
      keyInsights: [
        '主要な洞察1',
        '主要な洞察2',
        '主要な洞察3'
      ],
      recommendations: [
        '推奨アクション1',
        '推奨アクション2',
        '推奨アクション3'
      ],
      nextSteps: [
        '次のステップ1',
        '次のステップ2',
        '次のステップ3'
      ]
    };
  }

  /**
   * 新しいカスタム分析フローを作成
   * @param {string} flowId - 分析フローID
   * @param {Object} flowDefinition - フロー定義
   * @returns {Object} 作成された分析フローの情報
   */
  createCustomAnalysisFlow(flowId, flowDefinition) {
    if (this.analysisFlows[flowId] || this.customAnalysisFlows[flowId]) {
      throw new Error(`分析フロー "${flowId}" は既に存在します。`);
    }
    
    // 基本的な検証
    if (!flowDefinition.name || !flowDefinition.description || !Array.isArray(flowDefinition.stages)) {
      throw new Error('分析フロー定義が不完全です。name, description, stagesが必要です。');
    }
    
    for (const stage of flowDefinition.stages) {
      if (!stage.name || !Array.isArray(stage.tools) || stage.tools.length < 1) {
        throw new Error('ステージ定義が不完全です。name, toolsが必要です。');
      }
    }
    
    // カスタム分析フローに追加
    this.customAnalysisFlows[flowId] = {
      name: flowDefinition.name,
      description: flowDefinition.description,
      stages: flowDefinition.stages
    };
    
    return {
      id: flowId,
      name: flowDefinition.name,
      description: flowDefinition.description,
      type: 'custom'
    };
  }
}

module.exports = MultiStageAnalysisManager;
