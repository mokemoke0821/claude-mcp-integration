/**
 * 高度な思考ツールと手法
 */

const AdvancedThinking = {
  /**
   * 弁証法的思考法 - テーゼ、アンチテーゼ、シンテーゼのプロセスを適用
   * @param {string} topic - 分析対象のトピック
   * @returns {Object} 弁証法的思考プロセスの結果
   */
  applyDialecticalThinking: (topic) => {
    return {
      topic: topic,
      dialecticalProcess: {
        thesis: {
          description: "最初の立場または主張（テーゼ）",
          structure: [
            "中心的主張",
            "主要な前提と根拠",
            "強みと重要性"
          ],
          examples: [
            `「${topic}」に関する一般的な見解として...`,
            `「${topic}」の主流派の立場では...`
          ]
        },
        antithesis: {
          description: "対立する立場または反論（アンチテーゼ）",
          structure: [
            "反対の主張",
            "テーゼへの具体的な批判点",
            "代替的な前提と根拠"
          ],
          examples: [
            `「${topic}」に対する批判的見解として...`,
            `反対の立場からは...`
          ]
        },
        synthesis: {
          description: "対立を統合する新たな理解（シンテーゼ）",
          structure: [
            "統合的な視点",
            "両方の視点から保持される要素",
            "より高次の理解と解決策"
          ],
          examples: [
            `両方の視点を考慮すると...`,
            `より包括的な理解としては...`
          ]
        }
      },
      applications: [
        "複雑な問題の多面的理解",
        "対立する見解の建設的な統合",
        "より高次の視点の発見"
      ],
      guidingQuestions: [
        "この問題に関する主要な対立軸は何か？",
        "それぞれの立場の強みと限界は何か？",
        "両者の真実を保持しながら新しい理解を構築するには？"
      ]
    };
  },
  
  /**
   * 認知バイアス検出ツール - 思考プロセスのバイアスを特定
   * @param {string} thinkingProcess - 分析する思考プロセス
   * @returns {Object} バイアス検出結果
   */
  detectCognitiveBiases: (thinkingProcess) => {
    return {
      thinkingProcess: thinkingProcess,
      potentialBiases: [
        {
          name: "確証バイアス",
          description: "既存の信念を支持する情報を優先し、矛盾する情報を無視する傾向",
          detectionQuestions: [
            "反対の証拠や視点を十分に考慮しているか？",
            "自分の信念に挑戦する情報を積極的に探しているか？",
            "初期の仮説に固執していないか？"
          ],
          mitigationStrategies: [
            "意識的に反対の証拠を探す",
            "複数の代替仮説を同時に検討する",
            "他者に批判的フィードバックを求める"
          ]
        },
        {
          name: "利用可能性ヒューリスティック",
          description: "すぐに思い浮かぶ例や事例に基づいて判断する傾向",
          detectionQuestions: [
            "特定の事例や例が思考を過度に支配していないか？",
            "より広範な事例や統計的証拠を考慮しているか？",
            "感情的に印象的な事例に影響されていないか？"
          ],
          mitigationStrategies: [
            "より広範なデータセットを参照する",
            "直感的な判断を統計的事実と照合する",
            "系統的にサンプルを収集する"
          ]
        },
        {
          name: "アンカリング効果",
          description: "最初に得た情報や数値に過度に影響される傾向",
          detectionQuestions: [
            "初期の数値や基準点が判断を支配していないか？",
            "別の出発点から考え直すとどうなるか？",
            "独立した複数の評価アプローチを使用しているか？"
          ],
          mitigationStrategies: [
            "意識的に複数の異なる出発点から考える",
            "初期の基準点を疑問視する習慣をつける",
            "複数の独立した評価を行う"
          ]
        },
        {
          name: "集団思考",
          description: "グループの調和を維持するために批判的思考を抑制する傾向",
          detectionQuestions: [
            "異論や批判が十分に検討されているか？",
            "グループの合意を過度に重視していないか？",
            "すべてのメンバーが自由に意見を表明できているか？"
          ],
          mitigationStrategies: [
            "意図的に「悪魔の代弁者」の役割を導入する",
            "匿名でのフィードバックを奨励する",
            "異なる意見を積極的に評価する文化を育てる"
          ]
        },
        {
          name: "ヒンドサイトバイアス",
          description: "結果を知った後に、その結果が予測可能だったと考える傾向",
          detectionQuestions: [
            "過去の判断を現在の知識で評価していないか？",
            "当時利用可能だった情報のみに基づいて判断を再評価できるか？",
            "不確実性と複数の可能性を適切に認識しているか？"
          ],
          mitigationStrategies: [
            "決定時に複数の可能な結果を文書化する",
            "当時の情報状態を正確に再構築する",
            "過去の判断を評価する際は思考プロセスに焦点を当てる"
          ]
        }
      ],
      analysisProcess: [
        "思考プロセスにおける判断や推論の各ステップを特定",
        "各ステップに影響を与えている可能性のあるバイアスを識別",
        "バイアスの影響を軽減するための具体的な戦略を適用"
      ]
    };
  },

  /**
   * 決断マトリックス - 複数の選択肢を多基準で評価
   * @param {string} decisionContext - 決断の文脈
   * @returns {Object} 決断マトリックスフレームワーク
   */
  createDecisionMatrix: (decisionContext) => {
    return {
      decisionContext: decisionContext,
      matrixStructure: {
        options: {
          description: "検討する選択肢のリスト",
          example: [`「${decisionContext}」に関するオプションA`, `オプションB`, `オプションC`]
        },
        criteria: {
          description: "評価基準のリスト",
          example: [
            {
              name: "効果性",
              description: "目標達成にどれだけ効果的か",
              weight: "高"
            },
            {
              name: "実現可能性",
              description: "現在のリソースと制約内で実行可能か",
              weight: "中"
            },
            {
              name: "持続可能性",
              description: "長期的に維持可能か",
              weight: "中"
            },
            {
              name: "リスク",
              description: "潜在的な負の結果の可能性と影響",
              weight: "高"
            },
            {
              name: "コスト",
              description: "必要なリソースと投資",
              weight: "中"
            }
          ]
        },
        scoring: {
          description: "各オプションを各基準に対して評価",
          method: "1-5のスケール（1=非常に低い、5=非常に高い）",
          consideration: "基準の重み付けを考慮した総合スコアの計算"
        }
      },
      analysisProcess: [
        "すべての実行可能な選択肢を特定する",
        "関連する評価基準を確立し、重み付けを決定する",
        "各選択肢を各基準に対して客観的に評価する",
        "重み付けスコアに基づいて選択肢をランク付けする",
        "定量的評価と定性的考慮事項を統合する"
      ],
      applicationTips: [
        "評価基準は意思決定の目的と文脈に合わせてカスタマイズする",
        "可能な限り客観的なデータと根拠に基づいてスコアリングを行う",
        "スコアだけでなく、定性的な考慮事項も含めて最終判断を行う",
        "異なる視点からの評価を統合するためにチームでの評価を検討する"
      ]
    };
  },

  /**
   * シナリオプランニング - 複数の将来シナリオを検討
   * @param {string} topic - シナリオプランニングのトピック
   * @returns {Object} シナリオプランニングフレームワーク
   */
  applyScenarioPlanning: (topic) => {
    return {
      topic: topic,
      scenarioStructure: {
        drivingForces: {
          description: "将来に影響を与える主要な要因",
          categories: [
            "確実な傾向（ほぼ確実に発生する変化）",
            "重要な不確実性（予測困難だが重大な影響を持つ要因）",
            "弱いシグナル（現在は小さいが将来重要になる可能性のある兆候）"
          ]
        },
        scenarioAxes: {
          description: "シナリオ構築の基礎となる2つの重要な不確実性",
          example: `「${topic}」に関連する重要な不確実性A（高/低）と不確実性B（増加/減少）`
        },
        scenarios: {
          description: "2つの軸から生成される4つの異なるシナリオ",
          examples: [
            "シナリオ1: A高 & B増加の世界",
            "シナリオ2: A高 & B減少の世界",
            "シナリオ3: A低 & B増加の世界",
            "シナリオ4: A低 & B減少の世界"
          ]
        }
      },
      developmentProcess: [
        "各シナリオのストーリーラインを作成（論理的に一貫した物語）",
        "各シナリオの兆候と早期警戒サインを特定",
        "各シナリオに対する戦略的対応を開発",
        "共通する要素と堅牢な戦略を特定"
      ],
      applicationValue: [
        "複数の可能な将来に対する準備",
        "単一予測への過度の依存の回避",
        "戦略的柔軟性と適応性の向上",
        "思考の幅を広げ、固定観念を超える"
      ]
    };
  },

  /**
   * モデル思考 - 複数の概念モデルを適用
   * @param {string} problem - 分析する問題
   * @returns {Object} モデル思考フレームワーク
   */
  applyMentalModels: (problem) => {
    return {
      problem: problem,
      mentalModels: [
        {
          name: "第一原理思考",
          description: "問題を基本的な要素に分解し、ゼロから再構築する",
          applicationProcess: [
            "問題を基本的な真実や要素に分解する",
            "前提や慣例を疑問視する",
            "根本的な事実から新しいソリューションを構築する"
          ],
          problemApplication: `「${problem}」の最も基本的な要素や原理は何か？`
        },
        {
          name: "インバージョン思考",
          description: "問題を逆から考える - 成功ではなく失敗の回避に焦点を当てる",
          applicationProcess: [
            "「どうすれば成功するか」ではなく「どうすれば失敗するか」を考える",
            "回避すべき結果や行動を特定する",
            "最悪のシナリオを回避するための戦略を立てる"
          ],
          problemApplication: `「${problem}」に関して、絶対に避けるべき結果は何か？`
        },
        {
          name: "確率的思考",
          description: "決定論的ではなく確率的に考える",
          applicationProcess: [
            "単一の結果ではなく可能性の分布を考える",
            "不確実性と複数の結果の可能性を認識する",
            "期待値と確率加重決定を使用する"
          ],
          problemApplication: `「${problem}」に関連する不確実性と確率はどのように分布しているか？`
        },
        {
          name: "システム思考",
          description: "個別の要素よりも相互関係とフィードバックループに注目",
          applicationProcess: [
            "要素間の関係と相互作用を特定する",
            "フィードバックループとその効果を分析する",
            "システム全体の振る舞いを考慮する"
          ],
          problemApplication: `「${problem}」はどのようなシステムの一部であり、どのようなフィードバックループが存在するか？`
        },
        {
          name: "機会費用",
          description: "選択肢を選ぶことで失われる次善の選択肢の価値を考慮",
          applicationProcess: [
            "すべての選択肢と代替案を特定する",
            "各選択肢の真のコストを評価する（直接コスト + 機会費用）",
            "比較優位に基づいて決定を下す"
          ],
          problemApplication: `「${problem}」に関する決定を下す際、どのような機会を犠牲にしているか？`
        }
      ],
      integrationProcess: [
        "複数のモデルを並行して適用し、各視点からの洞察を収集",
        "矛盾する結論を特定し、その理由を探求",
        "さまざまなモデルからの洞察を統合した総合的な理解を形成"
      ]
    };
  }
};

module.exports = AdvancedThinking;