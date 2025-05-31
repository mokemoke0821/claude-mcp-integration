const { getThemeCategory } = require("./thinking-utils");

/**
 * AI思考強化モジュール
 * 思考ツールの結果を強化し、コンテキストと知識ベースを活用して出力を充実させる
 */
class AIThinkingEnhancer {
  constructor() {
    // コンストラクタの内容
  }
  
  /**
   * 分析結果を強化する
   * @param {Object} result - 元の分析結果
   * @param {string} theme - テーマ
   * @param {Object} knowledgeBase - 知識ベース
   * @param {Array} relatedContext - 関連コンテキスト
   * @returns {Object} 強化された結果
   */
  enhanceAnalysisResult(result, theme, knowledgeBase, relatedContext) {
    const category = getThemeCategory(theme);
    
    switch(category) {
      case "technology":
        return this.enhanceTechnologyResult(result, theme, knowledgeBase, relatedContext);
      case "business":
        return this.enhanceBusinessResult(result, theme, knowledgeBase, relatedContext);
      default:
        return this.enhanceGenericResult(result, theme, knowledgeBase, relatedContext);
    }
  }
  
  /**
   * テクノロジー関連の結果強化
   * @param {Object} result - 元の結果
   * @param {string} theme - テーマ
   * @param {Object} knowledgeBase - 知識ベース
   * @param {Array} relatedContext - 関連コンテキスト
   * @returns {Object} 強化された結果
   */
  enhanceTechnologyResult(result, theme, knowledgeBase, relatedContext) {
    // 既存のJSON構造を維持しながら、知識ベースの情報を注入
    const enhancedResult = JSON.parse(JSON.stringify(result));
    
    // 関連する技術トレンドとコンセプトを抽出
    const relevantTrends = knowledgeBase.currentTrends?.filter(trend => 
      trend.keywords.some(keyword => theme.toLowerCase().includes(keyword.toLowerCase()))
    ) || [];
    
    const relevantConcepts = knowledgeBase.concepts?.filter(concept => 
      concept.keywords.some(keyword => theme.toLowerCase().includes(keyword.toLowerCase()))
    ) || [];
    
    // 技術特化の洞察を追加
    enhancedResult.technologyInsights = {
      relevantTrends: relevantTrends.slice(0, 3),
      technicalConcepts: relevantConcepts.slice(0, 3),
      implementations: knowledgeBase.implementations?.slice(0, 2) || [],
      challenges: knowledgeBase.challenges?.slice(0, 2) || []
    };
    
    // 関連コンテキストからの洞察を追加
    if (relatedContext.length > 0) {
      enhancedResult.contextualInsights = {
        relatedTools: relatedContext.map(rc => rc.tool),
        technicalIntegration: `${theme}について複数の視点から分析することで、より多角的な技術理解が可能になる`
      };
    }
    
    return enhancedResult;
  }
  
  /**
   * ビジネス関連の結果強化
   * @param {Object} result - 元の結果
   * @param {string} theme - テーマ
   * @param {Object} knowledgeBase - 知識ベース
   * @param {Array} relatedContext - 関連コンテキスト
   * @returns {Object} 強化された結果
   */
  enhanceBusinessResult(result, theme, knowledgeBase, relatedContext) {
    // 既存のJSON構造を維持しながら、知識ベースの情報を注入
    const enhancedResult = JSON.parse(JSON.stringify(result));
    
    // 関連するビジネスフレームワークと概念を抽出
    const relevantFrameworks = knowledgeBase.frameworks?.filter(framework => 
      framework.keywords.some(keyword => theme.toLowerCase().includes(keyword.toLowerCase()))
    ) || [];
    
    const relevantConcepts = knowledgeBase.concepts?.filter(concept => 
      concept.keywords.some(keyword => theme.toLowerCase().includes(keyword.toLowerCase()))
    ) || [];
    
    // キー思想家を抽出
    const keyThinkers = knowledgeBase.keyThinkers || [];
    
    // ビジネス特化の洞察を追加
    enhancedResult.businessInsights = {
      relevantFrameworks: relevantFrameworks.slice(0, 2),
      marketTrends: knowledgeBase.marketTrends?.slice(0, 3) || [],
      strategicImplications: `${theme}のビジネスへの影響は${relevantConcepts[0]?.implications || "様々な側面"}でより正確に理解できる`,
      keyInsights: `${keyThinkers.slice(0, 2).map(t => t?.name || "").join("と")}の視点を統合すると、${theme}について新たな理解が生まれる`,
      practicalApplications: `この分析を${relevantConcepts[0]?.applications || "実践的な場面"}に適用できる`
    };
    
    return enhancedResult;
  }
  
  /**
   * 汎用的な結果強化
   * @param {Object} result - 元の結果
   * @param {string} theme - テーマ
   * @param {Object} knowledgeBase - 知識ベース
   * @param {Array} relatedContext - 関連コンテキスト
   * @returns {Object} 強化された結果
   */
  enhanceGenericResult(result, theme, knowledgeBase, relatedContext) {
    // 既存のJSON構造を維持しながら、知識ベースの情報を注入
    const enhancedResult = JSON.parse(JSON.stringify(result));
    
    // 知識ベースの情報を追加
    enhancedResult.knowledgeEnhancement = {
      relevantConcepts: knowledgeBase.concepts?.slice(0, 3) || [],
      keyThinkers: knowledgeBase.keyThinkers?.slice(0, 3) || [],
      frameworks: knowledgeBase.frameworks?.slice(0, 2) || [],
      currentTrends: knowledgeBase.currentTrends?.slice(0, 3) || []
    };
    
    // 関連コンテキストからの洞察を追加
    if (relatedContext.length > 0) {
      enhancedResult.contextualInsights = {
        relatedTools: relatedContext.map(rc => rc.tool),
        integratedPerspective: `${theme}に関する複数の思考ツールからの分析を統合すると、より包括的な理解が得られます`
      };
    }
    
    return enhancedResult;
  }
}

module.exports = AIThinkingEnhancer;