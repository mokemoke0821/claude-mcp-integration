            text: JSON.stringify(scenarioPlanning, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`シナリオプランニングエラー: ${error.message}`);
    }
  }
  
  async handleMentalModels(args) {
    const { problem } = args;
    
    if (!problem) {
      throw new Error('問題が指定されていません');
    }

    try {
      const mentalModels = AdvancedThinking.applyMentalModels(problem);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mentalModels, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`モデル思考エラー: ${error.message}`);
    }
  }
  
  // ========== 思考チェーンツール ==========
  
  async handleProblemAnalysisChain(args) {
    const { problem } = args;
    
    if (!problem) {
      throw new Error('問題が指定されていません');
    }

    try {
      const problemAnalysisChain = ThoughtChain.problemAnalysisChain(problem);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(problemAnalysisChain, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`問題分析チェーンエラー: ${error.message}`);
    }
  }
  
  async handleStrategicThinkingChain(args) {
    const { strategicTopic } = args;
    
    if (!strategicTopic) {
      throw new Error('戦略的トピックが指定されていません');
    }

    try {
      const strategicThinkingChain = ThoughtChain.strategicThinkingChain(strategicTopic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(strategicThinkingChain, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`戦略思考チェーンエラー: ${error.message}`);
    }
  }
  
  async handleCreativeThinkingChain(args) {
    const { innovationChallenge } = args;
    
    if (!innovationChallenge) {
      throw new Error('革新の課題が指定されていません');
    }

    try {
      const creativeThinkingChain = ThoughtChain.creativeThinkingChain(innovationChallenge);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(creativeThinkingChain, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`創造的思考チェーンエラー: ${error.message}`);
    }
  }
  
  async handleCriticalThinkingChain(args) {
    const { claim } = args;
    
    if (!claim) {
      throw new Error('主張が指定されていません');
    }

    try {
      const criticalThinkingChain = ThoughtChain.criticalThinkingChain(claim);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(criticalThinkingChain, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`批判的思考チェーンエラー: ${error.message}`);
    }
  }
  
  async handleLearningOptimizationChain(args) {
    const { learningTopic } = args;
    
    if (!learningTopic) {
      throw new Error('学習テーマが指定されていません');
    }

    try {
      const learningOptimizationChain = ThoughtChain.learningOptimizationChain(learningTopic);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(learningOptimizationChain, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`学習最適化チェーンエラー: ${error.message}`);
    }
  }
}

// サーバーインスタンスを作成して実行
const server = new EnhancedDeepThinkCommanderServer();
server.run = async function() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error('Enhanced Deep Think Commander V2 MCPサーバーが起動しました。');
  console.error('新機能: 高度な思考ツールと思考チェーンシステムが利用可能です。');
};

server.run().catch(err => {
  console.error('サーバー起動エラー:', err);
  process.exit(1);
});
