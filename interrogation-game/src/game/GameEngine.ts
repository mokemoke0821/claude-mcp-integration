import { SuspectAI } from './SuspectAI';
import { DamageCalculator } from './DamageCalculator';
import { PersonalityManager } from './PersonalityManager';
import { 
  GameSettings,
  GameResult,
  GameTurn,
  GameLog,
  DetectiveSkill,
  GameEvent,
  AnimationEffect,
  DifficultyModifiers,
  QuestionType
} from '../types/GameTypes';

export class GameEngine {
  private suspectAI: SuspectAI;
  private settings: GameSettings;
  private currentTurn: number;
  private gameActive: boolean;
  private interrogationPoints: number;
  private detectiveSkills: DetectiveSkill[];
  private gameLogs: GameLog[];
  private eventHandlers: Map<string, (event: GameEvent) => void>;
  private difficultyModifiers: DifficultyModifiers;

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.suspectAI = new SuspectAI(settings.ollamaModel);
    this.currentTurn = 0;
    this.gameActive = false;
    this.interrogationPoints = 100;
    this.detectiveSkills = this.initializeDetectiveSkills();
    this.gameLogs = [];
    this.eventHandlers = new Map();
    this.difficultyModifiers = this.getDifficultyModifiers(settings.difficulty);
  }

  /**
   * ゲーム開始
   */
  startGame(): void {
    this.gameActive = true;
    this.currentTurn = 1;
    this.interrogationPoints = 100;
    this.gameLogs = [];
    
    // 難易度による初期ステータス調整
    const initialStatus = this.suspectAI.getStatus();
    this.suspectAI.updateStatus({
      mentalLife: Math.round(initialStatus.mentalLife * this.difficultyModifiers.lifeMultiplier)
    });

    this.addLog('system', `取調開始: ${this.suspectAI.getBackground().name}を尋問します`);
    this.emitEvent({
      type: 'SPECIAL',
      data: { message: 'ゲーム開始！' }
    });
  }

  /**
   * プレイヤーの質問を処理
   */
  async processPlayerQuestion(question: string, skillId?: string): Promise<GameTurn> {
    if (!this.gameActive) {
      throw new Error('ゲームが開始されていません');
    }

    const turn: GameTurn = {
      turnNumber: this.currentTurn,
      phase: 'PLAYER_QUESTION',
      gameState: {
        turnNumber: this.currentTurn,
        timeRemaining: this.settings.turnLimit - this.currentTurn,
        victorConditionMet: false,
        defeatConditionMet: false
      }
    };

    // スキル使用チェック
    let usedSkill: DetectiveSkill | undefined;
    if (skillId) {
      usedSkill = this.useDetectiveSkill(skillId);
    }

    // 質問タイプ検出
    const questionType = this.suspectAI.detectQuestionType ? 
      this.suspectAI.detectQuestionType(question) :
      QuestionType.LOGICAL;

    turn.playerAction = {
      questionText: question,
      detectedType: questionType,
      skillUsed: usedSkill,
      timestamp: Date.now()
    };

    // AI応答生成
    const aiResponse = await this.suspectAI.generateResponse(question);

    // ダメージ計算
    const damageResult = DamageCalculator.calculateDamage(
      questionType,
      this.suspectAI.getStatus(),
      usedSkill,
      false // TODO: コンボ判定実装
    );

    // 難易度によるダメージ調整
    damageResult.finalDamage = Math.round(
      damageResult.finalDamage * (1 - this.difficultyModifiers.damageReduction)
    );

    // ステータス変化計算
    const statusChanges = DamageCalculator.calculateStatusChanges(
      questionType,
      this.suspectAI.getStatus(),
      damageResult.finalDamage,
      usedSkill
    );

    // ステータス更新
    this.suspectAI.updateStatus(statusChanges);

    // 反撃判定
    const counterAttack = DamageCalculator.generateCounterAttack(
      this.suspectAI.getCurrentPhase(),
      this.suspectAI.getStatus(),
      questionType
    );

    if (counterAttack) {
      this.interrogationPoints -= counterAttack.damage;
      this.addLog('counter', counterAttack.message);
      this.emitEvent({
        type: 'COUNTER',
        data: counterAttack
      });
    }

    // AI応答記録
    turn.aiResponse = {
      responseText: aiResponse.response,
      damageDealt: damageResult.finalDamage,
      statusChanges,
      specialAction: counterAttack || undefined,
      emotion: aiResponse.emotion
    };

    // ログ記録
    this.addLog('damage', damageResult.message);
    if (aiResponse.innerThought) {
      this.addLog('system', aiResponse.innerThought);
    }

    // エフェクト発生
    if (damageResult.criticalHit) {
      this.emitEvent({
        type: 'DAMAGE',
        data: { 
          damage: damageResult.finalDamage, 
          critical: true,
          animation: { type: 'shake', duration: 500, intensity: 2 } as AnimationEffect
        }
      });
    } else {
      this.emitEvent({
        type: 'DAMAGE',
        data: { 
          damage: damageResult.finalDamage,
          animation: { type: 'flash', duration: 300, color: '#ff0000' } as AnimationEffect
        }
      });
    }

    // フェーズ変更チェック
    const newPhase = DamageCalculator.determinePhase(this.suspectAI.getStatus().mentalLife);
    if (newPhase !== this.suspectAI.getCurrentPhase()) {
      const message = PersonalityManager.getPhaseTransitionMessage(newPhase);
      this.addLog('phase_change', message);
      this.emitEvent({
        type: 'PHASE_CHANGE',
        data: { newPhase, message }
      });
    }

    // 特殊アクション処理
    if (aiResponse.specialAction) {
      this.processSpecialAction(aiResponse.specialAction);
    }

    // 勝敗判定
    turn.gameState.victorConditionMet = DamageCalculator.checkVictoryCondition(this.suspectAI.getStatus());
    turn.gameState.defeatConditionMet = DamageCalculator.checkDefeatCondition(
      this.suspectAI.getStatus(),
      this.currentTurn,
      this.settings.turnLimit
    );

    if (turn.gameState.victorConditionMet || turn.gameState.defeatConditionMet) {
      this.endGame(turn.gameState.victorConditionMet ? GameResult.VICTORY : GameResult.DEFEAT);
    }

    this.currentTurn++;
    return turn;
  }

  /**
   * 刑事スキル使用
   */
  private useDetectiveSkill(skillId: string): DetectiveSkill | undefined {
    const skill = this.detectiveSkills.find(s => s.id === skillId);
    
    if (!skill) return undefined;
    
    if (skill.currentUses >= skill.maxUses) {
      this.addLog('system', `${skill.name}は使用回数上限に達しています`);
      return undefined;
    }
    
    if (skill.currentCooldown > 0) {
      this.addLog('system', `${skill.name}はクールダウン中です（${skill.currentCooldown}ターン）`);
      return undefined;
    }
    
    skill.currentUses++;
    skill.currentCooldown = skill.cooldown;
    
    this.addLog('skill', `スキル発動: ${skill.name} - ${skill.effect}`);
    this.emitEvent({
      type: 'SKILL_USE',
      data: { skill }
    });
    
    return skill;
  }

  /**
   * 特殊アクション処理
   */
  private processSpecialAction(action: any): void {
    this.addLog('system', `特殊アクション: ${action.name} - ${action.effect}`);
    this.emitEvent({
      type: 'SPECIAL',
      data: action
    });
  }

  /**
   * ゲーム終了
   */
  endGame(result: GameResult): void {
    this.gameActive = false;
    
    let message = '';
    switch (result) {
      case GameResult.PERFECT_VICTORY:
        message = '完全勝利！素晴らしい尋問でした！';
        break;
      case GameResult.VICTORY:
        message = '勝利！容疑者は自供しました！';
        break;
      case GameResult.DRAW:
        message = '引き分け...もう少しで自供させられました';
        break;
      case GameResult.DEFEAT:
        message = '敗北...容疑者は口を閉ざしました';
        break;
      case GameResult.SURRENDER:
        message = 'ゲームを降参しました';
        break;
    }
    
    this.addLog('system', message);
    this.emitEvent({
      type: 'SPECIAL',
      data: { gameResult: result, message }
    });
  }

  /**
   * 刑事スキル初期化
   */
  private initializeDetectiveSkills(): DetectiveSkill[] {
    return [
      {
        id: 'psycho_pressure',
        name: '心理的圧迫',
        description: '強力な心理的プレッシャーをかける',
        effect: 'ダメージ2倍、alertLevel+20',
        cooldown: 3,
        currentCooldown: 0,
        maxUses: 2,
        currentUses: 0,
        icon: '🧠'
      },
      {
        id: 'kind_approach',
        name: '優しいアプローチ',
        description: '優しく接して信頼を得る',
        effect: 'trustLevel+30、ダメージ無し',
        cooldown: 2,
        currentCooldown: 0,
        maxUses: 3,
        currentUses: 0,
        icon: '💝'
      },
      {
        id: 'evidence_slam',
        name: '証拠叩きつけ',
        description: '決定的な証拠を突きつける',
        effect: 'ダメージ50、必中',
        cooldown: 999,
        currentCooldown: 0,
        maxUses: 1,
        currentUses: 0,
        icon: '📋'
      },
      {
        id: 'read_mind',
        name: '心理読み取り',
        description: '容疑者の本心を読み取る',
        effect: '犯人の本心を一部表示',
        cooldown: 1,
        currentCooldown: 0,
        maxUses: 5,
        currentUses: 0,
        icon: '👁️'
      }
    ];
  }

  /**
   * 難易度設定取得
   */
  private getDifficultyModifiers(difficulty: GameSettings['difficulty']): DifficultyModifiers {
    const modifiers: Record<GameSettings['difficulty'], DifficultyModifiers> = {
      EASY: {
        lifeMultiplier: 0.7,
        damageReduction: 0,
        counterAttackBonus: 0,
        confessionThreshold: 70
      },
      NORMAL: {
        lifeMultiplier: 1.0,
        damageReduction: 0,
        counterAttackBonus: 0,
        confessionThreshold: 80
      },
      HARD: {
        lifeMultiplier: 1.3,
        damageReduction: 0.2,
        counterAttackBonus: 0.2,
        confessionThreshold: 90
      },
      EXTREME: {
        lifeMultiplier: 1.5,
        damageReduction: 0.4,
        counterAttackBonus: 0.5,
        confessionThreshold: 95
      }
    };
    
    return modifiers[difficulty];
  }

  /**
   * ログ追加
   */
  private addLog(type: GameLog['type'], message: string, details?: any): void {
    this.gameLogs.push({
      timestamp: Date.now(),
      type,
      message,
      details
    });
  }

  /**
   * イベント発生
   */
  private emitEvent(event: GameEvent): void {
    this.eventHandlers.forEach(handler => handler(event));
  }

  /**
   * イベントハンドラ登録
   */
  on(eventType: string, handler: (event: GameEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * ターンごとの処理（クールダウン減少など）
   */
  private processTurnEffects(): void {
    // スキルクールダウン減少
    this.detectiveSkills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    });
  }

  /**
   * ゲッター
   */
  getSuspectInfo() {
    return {
      background: this.suspectAI.getBackground(),
      status: this.suspectAI.getStatus(),
      phase: this.suspectAI.getCurrentPhase()
    };
  }

  getGameState() {
    return {
      active: this.gameActive,
      turn: this.currentTurn,
      maxTurns: this.settings.turnLimit,
      interrogationPoints: this.interrogationPoints,
      skills: this.detectiveSkills,
      logs: this.gameLogs
    };
  }
}