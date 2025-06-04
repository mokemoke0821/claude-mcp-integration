import { OllamaClient } from '../ollama/OllamaClient';
import { PersonalityManager } from './PersonalityManager';
import { 
  SuspectBackground, 
  SuspectStatus, 
  GamePhase,
  GameContext,
  QuestionType,
  SuspectSpecialAction
} from '../types/GameTypes';

export class SuspectAI {
  private background: SuspectBackground;
  private status: SuspectStatus;
  private currentPhase: GamePhase;
  private ollamaClient: OllamaClient;
  private conversationHistory: GameContext['conversationHistory'];
  private secretsRevealed: string[];
  private specialActions: SuspectSpecialAction[];

  constructor(ollamaModel: string = 'qwen2.5:7b') {
    this.background = this.generateRandomSuspect();
    this.status = this.initializeStatus();
    this.currentPhase = GamePhase.PHASE1_CONFIDENT;
    this.ollamaClient = new OllamaClient(ollamaModel);
    this.conversationHistory = [];
    this.secretsRevealed = [];
    this.specialActions = PersonalityManager.generateSpecialActions(this.background);
  }

  /**
   * ランダムな容疑者を生成
   */
  private generateRandomSuspect(): SuspectBackground {
    const names = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '渡辺健二'];
    const occupations = ['会社員', '教師', '医師', '店員', 'フリーランス'];
    const crimes = ['窃盗', '詐欺', '横領', '暴行', '器物損壊'];
    const motives = [
      '借金返済のため',
      '家族を守るため',
      '復讐のため',
      '金銭的な困窮',
      '衝動的な行動'
    ];
    const personalities = ['冷静', '感情的', '頑固', '狡猾', '臆病'];
    const weaknesses = [
      '家族への愛情',
      '罪悪感',
      '証拠の存在',
      '共犯者の裏切り',
      '過去のトラウマ'
    ];

    const suspect: SuspectBackground = {
      name: names[Math.floor(Math.random() * names.length)] || '名無し',
      age: 25 + Math.floor(Math.random() * 30),
      occupation: occupations[Math.floor(Math.random() * occupations.length)] || '無職',
      crime: crimes[Math.floor(Math.random() * crimes.length)] || '不明',
      motive: motives[Math.floor(Math.random() * motives.length)] || '不明',
      personality: personalities[Math.floor(Math.random() * personalities.length)] || '冷静',
      secretWeakness: weaknesses[Math.floor(Math.random() * weaknesses.length)] || '不明',
      hiddenTruths: this.generateHiddenTruths()
    };

    return suspect;
  }

  /**
   * 隠された真実を生成
   */
  private generateHiddenTruths(): string[] {
    return [
      'アリバイは嘘だった',
      '共犯者がいる',
      '証拠を隠している場所がある',
      '本当の動機は別にある',
      '被害者との関係を隠している'
    ].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  /**
   * 初期ステータス設定
   */
  private initializeStatus(): SuspectStatus {
    return {
      mentalLife: 100,
      alertLevel: 10,
      trustLevel: 20,
      confessionRate: 0
    };
  }

  /**
   * 質問タイプを検出
   */
  detectQuestionType(question: string): QuestionType {
    return this.ollamaClient.detectQuestionType(question);
  }

  /**
   * 質問に対する応答を生成
   */
  async generateResponse(playerQuestion: string): Promise<{
    response: string;
    emotion: string;
    innerThought?: string;
    specialAction?: SuspectSpecialAction;
  }> {
    // 質問タイプ検出
    const questionType = this.ollamaClient.detectQuestionType(playerQuestion);
    
    // 会話履歴に追加
    this.conversationHistory.push({
      role: 'player',
      message: playerQuestion,
      questionType
    });

    // ゲームコンテキスト作成
    const gameContext: GameContext = {
      suspect: this.background,
      currentStatus: this.status,
      currentPhase: this.currentPhase,
      conversationHistory: this.conversationHistory,
      turnNumber: this.conversationHistory.length,
      secretsRevealed: this.secretsRevealed
    };

    // AI応答生成
    let response = await this.ollamaClient.generateResponse(
      gameContext,
      playerQuestion,
      questionType
    );

    // 真実の漏洩チェック
    if (PersonalityManager.shouldRevealTruth(this.currentPhase, this.status.mentalLife)) {
      const partialTruth = PersonalityManager.generatePartialTruth(
        this.background.hiddenTruths.filter(t => !this.secretsRevealed.includes(t))
      );
      if (partialTruth) {
        response += ` ${partialTruth}`;
      }
    }

    // 自供モードチェック
    if (this.currentPhase === GamePhase.PHASE4_BREAKDOWN && this.status.confessionRate > 80) {
      if (Math.random() < 0.3) {
        response = PersonalityManager.generateConfessionLine(this.background);
      }
    }

    // 感情生成
    const emotion = PersonalityManager.generateEmotion(this.currentPhase, this.status.mentalLife);

    // 内部思考（デバッグ/演出用）
    const innerThought = PersonalityManager.generateInnerThought(this.currentPhase, this.status);

    // 特殊アクション判定
    const specialAction = this.checkSpecialAction();

    // 会話履歴に追加
    this.conversationHistory.push({
      role: 'suspect',
      message: response
    });

    return {
      response,
      emotion,
      innerThought,
      specialAction
    };
  }

  /**
   * 特殊アクション判定
   */
  private checkSpecialAction(): SuspectSpecialAction | undefined {
    for (const action of this.specialActions) {
      if (Math.random() < action.probability) {
        // トリガー条件チェック（簡易実装）
        if (this.evaluateTrigger(action.trigger)) {
          return action;
        }
      }
    }
    return undefined;
  }

  /**
   * トリガー条件評価
   */
  private evaluateTrigger(trigger: string): boolean {
    // 簡易的なトリガー評価
    if (trigger.includes('alertLevel > 60')) {
      return this.status.alertLevel > 60;
    }
    if (trigger.includes('Life < 30%')) {
      return this.status.mentalLife < 30;
    }
    if (trigger.includes('Life < 20%')) {
      return this.status.mentalLife < 20;
    }
    if (trigger === 'いつでも') {
      return true;
    }
    return false;
  }

  /**
   * ステータス更新
   */
  updateStatus(changes: Partial<SuspectStatus>): void {
    this.status = {
      ...this.status,
      ...changes
    };

    // フェーズ更新チェック
    const newPhase = this.determinePhase();
    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
    }
  }

  /**
   * フェーズ判定
   */
  private determinePhase(): GamePhase {
    if (this.status.mentalLife >= 70) return GamePhase.PHASE1_CONFIDENT;
    if (this.status.mentalLife >= 40) return GamePhase.PHASE2_NERVOUS;
    if (this.status.mentalLife >= 20) return GamePhase.PHASE3_CONFUSED;
    return GamePhase.PHASE4_BREAKDOWN;
  }

  /**
   * 秘密を暴露
   */
  revealSecret(): string | null {
    const unrevealed = this.background.hiddenTruths.filter(
      t => !this.secretsRevealed.includes(t)
    );
    
    if (unrevealed.length === 0) return null;
    
    const secret = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    if (secret) {
      this.secretsRevealed.push(secret);
    }
    return secret ?? null;
  }

  /**
   * ゲッター
   */
  getBackground(): SuspectBackground {
    return this.background;
  }

  getStatus(): SuspectStatus {
    return this.status;
  }

  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  getConversationHistory(): GameContext['conversationHistory'] {
    return this.conversationHistory;
  }

  getSecretsRevealed(): string[] {
    return this.secretsRevealed;
  }

  /**
   * リセット
   */
  reset(): void {
    this.background = this.generateRandomSuspect();
    this.status = this.initializeStatus();
    this.currentPhase = GamePhase.PHASE1_CONFIDENT;
    this.conversationHistory = [];
    this.secretsRevealed = [];
    this.specialActions = PersonalityManager.generateSpecialActions(this.background);
    this.ollamaClient.resetContext();
  }
}