/**
 * 思考ツール関連のユーティリティ関数
 */

const ThinkingTools = {
  /**
   * SWOTフレームワーク
   * @param {string} topic - 分析対象のトピック
   * @returns {Object} SWOT分析結果
   */
  applySWOT: (topic) => {
    return {
      topic: topic,
      strengths: {
        description: "内部的な強み・利点",
        questions: [
          "何が優れているか？",
          "独自の資源や能力は？",
          "他との差別化要因は？"
        ]
      },
      weaknesses: {
        description: "内部的な弱み・欠点",
        questions: [
          "改善すべき点は？",
          "リソースの不足は？",
          "他と比較して不利な点は？"
        ]
      },
      opportunities: {
        description: "外部環境における機会",
        questions: [
          "活用できる外部の傾向や状況は？",
          "見落とされている可能性は？",
          "変化によって生まれるチャンスは？"
        ]
      },
      threats: {
        description: "外部環境からの脅威",
        questions: [
          "直面する障害は？",
          "競合の動向は？",
          "要件や標準の変化は？"
        ]
      }
    };
  },
  
  /**
   * 5W1H分析
   * @param {string} topic - 分析対象のトピック
   * @returns {Object} 5W1H分析結果
   */
  apply5W1H: (topic) => {
    return {
      topic: topic,
      what: {
        description: "何が起きているのか？",
        questions: [
          "具体的に何が問題または課題か？",
          "関連する要素や側面は？",
          "対象と範囲は？"
        ]
      },
      why: {
        description: "なぜそれが重要か？",
        questions: [
          "根本的な原因や理由は？",
          "解決する必要がある理由は？",
          "影響と重要性は？"
        ]
      },
      who: {
        description: "誰が関係しているか？",
        questions: [
          "関係者や利害関係者は？",
          "影響を受ける人々は？",
          "責任者や意思決定者は？"
        ]
      },
      when: {
        description: "いつ発生するか？",
        questions: [
          "タイムラインと時間的文脈は？",
          "重要な期限や区切りは？",
          "時間的な変化や傾向は？"
        ]
      },
      where: {
        description: "どこで関連性があるか？",
        questions: [
          "地理的または概念的な場所は？",
          "環境や状況的文脈は？",
          "空間的な制約や機会は？"
        ]
      },
      how: {
        description: "どのように対処するか？",
        questions: [
          "可能なアプローチや方法は？",
          "必要なステップやプロセスは？",
          "リソースと実装戦略は？"
        ]
      }
    };
  },
  
  /**
   * 原因-結果分析（フィッシュボーン/特性要因図）
   * @param {string} problem - 分析する問題
   * @returns {Object} 原因-結果分析結果
   */
  applyCauseEffectAnalysis: (problem) => {
    return {
      problem: problem,
      categories: [
        {
          name: "人的要因",
          possibleCauses: [
            "知識やスキルの不足",
            "コミュニケーション上の問題",
            "意識や態度の課題"
          ]
        },
        {
          name: "方法・プロセス",
          possibleCauses: [
            "非効率な手順",
            "標準化の欠如",
            "プロセスの複雑さ"
          ]
        },
        {
          name: "環境要因",
          possibleCauses: [
            "物理的環境の制約",
            "文化的・社会的影響",
            "外部からの圧力"
          ]
        },
        {
          name: "技術・ツール",
          possibleCauses: [
            "技術的制約",
            "適切なツールの欠如",
            "システム間の互換性問題"
          ]
        },
        {
          name: "データ・情報",
          possibleCauses: [
            "情報の質や正確性の問題",
            "データの不足",
            "情報の非整合性"
          ]
        }
      ]
    };
  },
  
  /**
   * マインドマップ構造の生成
   * @param {string} centralTopic - マインドマップの中心トピック
   * @returns {Object} マインドマップ構造
   */
  generateMindMap: (centralTopic) => {
    return {
      centralTopic: centralTopic,
      mainBranches: [
        {
          name: "側面1",
          subBranches: ["要素1-1", "要素1-2", "要素1-3"]
        },
        {
          name: "側面2",
          subBranches: ["要素2-1", "要素2-2", "要素2-3"]
        },
        {
          name: "側面3",
          subBranches: ["要素3-1", "要素3-2", "要素3-3"]
        },
        {
          name: "側面4",
          subBranches: ["要素4-1", "要素4-2", "要素4-3"]
        }
      ],
      instructions: "この基本構造をベースに、各枝を展開し関連概念を追加してください。"
    };
  },
  
  /**
   * ソクラテス的問答法
   * @param {string} belief - 検証する信念や主張
   * @returns {Object} ソクラテス的問答法の質問プロセス
   */
  applySocraticQuestioning: (belief) => {
    return {
      belief: belief,
      questioningProcess: [
        {
          stage: "明確化",
          questions: [
            `「${belief}」とはどういう意味ですか？`,
            "もう少し詳しく説明できますか？",
            "具体例を挙げることはできますか？"
          ]
        },
        {
          stage: "前提の検証",
          questions: [
            "どのような前提に基づいていますか？",
            "別の前提から考えるとどうなりますか？",
            "この考えの根拠は何ですか？"
          ]
        },
        {
          stage: "証拠の検証",
          questions: [
            "どのような証拠がありますか？",
            "反対の証拠はありますか？",
            "どのようにしてその結論に至りましたか？"
          ]
        },
        {
          stage: "代替視点の探索",
          questions: [
            "別の見方はありますか？",
            "誰かが反論するとしたら、どのような反論が考えられますか？",
            "この問題を別の角度から見るとどうなりますか？"
          ]
        },
        {
          stage: "結果と影響の検討",
          questions: [
            "その考えを採用するとどのような結果になりますか？",
            "広い文脈ではどのような意味を持ちますか？",
            "この考えの限界は何でしょうか？"
          ]
        }
      ]
    };
  },
  
  /**
   * シックスシンキングハット法
   * @param {string} topic - 考察するトピック
   * @returns {Object} シックスシンキングハット法の結果
   */
  applySixThinkingHats: (topic) => {
    return {
      topic: topic,
      thinkingHats: [
        {
          color: "白（White）",
          focus: "情報と事実",
          approach: "客観的なデータと情報に焦点を当てる",
          questions: [
            "現在、どのような情報や事実がありますか？",
            "どのようなデータが不足していますか？",
            "関連する客観的な事実は何ですか？"
          ]
        },
        {
          color: "赤（Red）",
          focus: "感情と直感",
          approach: "感情、直感、第一印象に注目する",
          questions: [
            "この問題に対して直感的にどう感じますか？",
            "感情的な反応は何ですか？",
            "直感的な判断はどうですか？"
          ]
        },
        {
          color: "黒（Black）",
          focus: "慎重さと警告",
          approach: "論理的に否定的な面、リスク、問題点を特定する",
          questions: [
            "考えられるリスクや問題点は何ですか？",
            "どのような障害がありますか？",
            "なぜこれが機能しない可能性がありますか？"
          ]
        },
        {
          color: "黄（Yellow）",
          focus: "楽観的な見方",
          approach: "論理的に肯定的な面、利点、機会を特定する",
          questions: [
            "利点や価値は何ですか？",
            "これはどのように役立ちますか？",
            "最良のシナリオは何ですか？"
          ]
        },
        {
          color: "緑（Green）",
          focus: "創造性と新しいアイデア",
          approach: "新しい可能性、選択肢、アイデアを生み出す",
          questions: [
            "他にどのような可能性がありますか？",
            "これをどのように異なる方法で行えますか？",
            "新しいアプローチは何ですか？"
          ]
        },
        {
          color: "青（Blue）",
          focus: "思考の管理",
          approach: "思考プロセスを整理し、全体像を把握する",
          questions: [
            "ここまでの思考をまとめると何が分かりますか？",
            "次に何をすべきですか？",
            "全体として何を学びましたか？"
          ]
        }
      ]
    };
  }
};

module.exports = ThinkingTools;