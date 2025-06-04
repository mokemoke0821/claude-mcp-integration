import {
  GamePhase,
  PersonalityPhase,
  SuspectBackground,
  SuspectSpecialAction
} from '../types/GameTypes';

export class PersonalityManager {
  private static personalities: Record<GamePhase, PersonalityPhase> = {
    [GamePhase.PHASE1_CONFIDENT]: {
      phase: GamePhase.PHASE1_CONFIDENT,
      tone: "冷静で否認的",
      responses: [
        "私はやっていません",
        "証拠があるなら見せてください",
        "弁護士を呼びたいです",
        "なぜ私が疑われるんですか？",
        "その時間は別の場所にいました"
      ],
      counterAttackRate: 10,
      cooperationLevel: 0
    },

    [GamePhase.PHASE2_NERVOUS]: {
      phase: GamePhase.PHASE2_NERVOUS,
      tone: "動揺し始める",
      responses: [
        "...そんなことは...",
        "記憶が曖昧で...",
        "何で僕がそんなことを...",
        "ちょっと待ってください、それは...",
        "違います！そうじゃないんです！"
      ],
      counterAttackRate: 20,
      cooperationLevel: 30,
      emotionalReactions: true
    },

    [GamePhase.PHASE3_CONFUSED]: {
      phase: GamePhase.PHASE3_CONFUSED,
      tone: "感情的で不安定",
      responses: [
        "わからない...わからないんです！",
        "本当に...でも僕は...",
        "助けて...どうすれば...",
        "もう何も考えられない...",
        "やめて...お願いします..."
      ],
      counterAttackRate: 5,
      cooperationLevel: 70,
      truthSlipping: true
    },

    [GamePhase.PHASE4_BREAKDOWN]: {
      phase: GamePhase.PHASE4_BREAKDOWN,
      tone: "絶望的で諦め",
      responses: [
        "もうダメだ...",
        "...やりました",
        "すべて話します...",
        "ごめんなさい...本当に...",
        "もう隠せない..."
      ],
      counterAttackRate: 0,
      cooperationLevel: 95,
      confessionMode: true
    }
  };

  /**
   * 現在のフェーズ性格を取得
   */
  static getPersonality(phase: GamePhase): PersonalityPhase {
    return this.personalities[phase];
  }

  /**
   * 感情表現を生成
   */
  static generateEmotion(phase: GamePhase, _mentalLife: number): string {
    const emotions: Record<GamePhase, string[]> = {
      [GamePhase.PHASE1_CONFIDENT]: ['😐', '🤨', '😤', '😒'],
      [GamePhase.PHASE2_NERVOUS]: ['😰', '😟', '😣', '😖'],
      [GamePhase.PHASE3_CONFUSED]: ['😭', '😱', '😵', '🥺'],
      [GamePhase.PHASE4_BREAKDOWN]: ['😢', '😔', '😞', '💔']
    };

    const phaseEmotions = emotions[phase];
    return phaseEmotions[Math.floor(Math.random() * phaseEmotions.length)] || '😐';
  }

  /**
   * 特殊アクションを生成
   */
  static generateSpecialActions(suspect: SuspectBackground): SuspectSpecialAction[] {
    const actions: SuspectSpecialAction[] = [
      {
        id: 'mental_block',
        name: '心理的防御',
        trigger: 'alertLevel > 60',
        effect: '次の攻撃ダメージ半減',
        probability: 0.3
      },
      {
        id: 'emotional_breakdown',
        name: '感情的崩壊',
        trigger: 'Life < 30% && 連続攻撃',
        effect: 'Life-15、ランダムで真実を暴露',
        probability: 0.4
      },
      {
        id: 'desperate_defense',
        name: '必死の否認',
        trigger: 'Life < 20%',
        effect: 'Life回復+10、alertLevel+30',
        probability: 0.2
      }
    ];

    // 犯人タイプによる特殊アクション追加
    if (suspect.personality.includes('頑固')) {
      actions.push({
        id: 'stubborn_resistance',
        name: '頑固な抵抗',
        trigger: 'いつでも',
        effect: 'ダメージ-5、警戒度+10',
        probability: 0.5
      });
    }

    if (suspect.personality.includes('狡猾')) {
      actions.push({
        id: 'cunning_deflection',
        name: '狡猾な話術',
        trigger: 'trustLevel < 40',
        effect: '話題逸らし、ダメージ無効化',
        probability: 0.35
      });
    }

    return actions;
  }

  /**
   * 真実の漏洩判定
   */
  static shouldRevealTruth(phase: GamePhase, mentalLife: number): boolean {
    if (phase < GamePhase.PHASE3_CONFUSED) return false;

    const baseProbability = phase === GamePhase.PHASE3_CONFUSED ? 0.2 : 0.5;
    const lifePenalty = (100 - mentalLife) / 200; // 最大0.5

    return Math.random() < (baseProbability + lifePenalty);
  }

  /**
   * 部分的な真実を生成
   */
  static generatePartialTruth(hiddenTruths: string[]): string {
    if (hiddenTruths.length === 0) return '';

    const truth = hiddenTruths[Math.floor(Math.random() * hiddenTruths.length)]!;
    const partialReveals = [
      `実は...${truth.substring(0, truth.length / 2)}...いや、なんでもない`,
      `そういえば${truth.substring(0, 10)}...って、違う！`,
      `本当は${truth.substring(0, 15)}...あ、いや...`,
      `...${truth.substring(0, 20)}...忘れてください`
    ];

    return partialReveals[Math.floor(Math.random() * partialReveals.length)] || '';
  }

  /**
   * フェーズ移行メッセージ
   */
  static getPhaseTransitionMessage(newPhase: GamePhase): string {
    const messages: Record<GamePhase, string> = {
      [GamePhase.PHASE1_CONFIDENT]: '容疑者は冷静さを保っている',
      [GamePhase.PHASE2_NERVOUS]: '容疑者に動揺の色が見え始めた！',
      [GamePhase.PHASE3_CONFUSED]: '容疑者は明らかに混乱している！真実が近い！',
      [GamePhase.PHASE4_BREAKDOWN]: '容疑者は完全に崩壊寸前だ！もう少しだ！'
    };

    return messages[newPhase];
  }

  /**
   * 自供の決め台詞を生成
   */
  static generateConfessionLine(suspect: SuspectBackground): string {
    const templates = [
      `はい...私が${suspect.crime}をやりました...`,
      `もう隠せません...すべて私がやったことです...`,
      `ごめんなさい...${suspect.motive}で...つい...`,
      `認めます...私が犯人です...`,
      `すみません...本当にすみません...私がやりました...`
    ];

    return templates[Math.floor(Math.random() * templates.length)] || '';
  }

  /**
   * 状況に応じた内部モノローグ生成（デバッグ/演出用）
   */
  static generateInnerThought(phase: GamePhase, _status: { mentalLife: number, alertLevel: number }): string {
    const thoughts: Record<GamePhase, string[]> = {
      [GamePhase.PHASE1_CONFIDENT]: [
        '（まだ大丈夫...証拠はないはず...）',
        '（落ち着け...何も知らないふりをするんだ...）',
        '（この刑事、何を知っているんだ...？）'
      ],
      [GamePhase.PHASE2_NERVOUS]: [
        '（やばい...バレそう...）',
        '（どうしよう...このままじゃ...）',
        '（なんでこんなに詳しく知ってるんだ...）'
      ],
      [GamePhase.PHASE3_CONFUSED]: [
        '（もうダメだ...全部バレてる...）',
        '（頭が真っ白...何も考えられない...）',
        '（助けて...誰か助けて...）'
      ],
      [GamePhase.PHASE4_BREAKDOWN]: [
        '（もう終わりだ...）',
        '（楽になりたい...）',
        '（全部話してしまおうか...）'
      ]
    };

    const phaseThoughts = thoughts[phase];
    return phaseThoughts[Math.floor(Math.random() * phaseThoughts.length)] || '';
  }
}