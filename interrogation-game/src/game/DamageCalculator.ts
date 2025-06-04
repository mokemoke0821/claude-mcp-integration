import {
  CounterAttack,
  DamageResult,
  DetectiveSkill,
  GamePhase,
  QuestionType,
  SuspectStatus
} from '../types/GameTypes';

export class DamageCalculator {
  /**
   * メインダメージ計算
   */
  static calculateDamage(
    questionType: QuestionType,
    suspect: SuspectStatus,
    skill?: DetectiveSkill,
    isCombo: boolean = false
  ): DamageResult {
    // 基礎ダメージ
    let baseDamage = questionType;

    // スキルによるダメージ修正
    if (skill?.id === 'psycho_pressure') {
      baseDamage *= 2;
    } else if (skill?.id === 'evidence_slam') {
      baseDamage = QuestionType.EVIDENCE * 1.7; // 固定ダメージ
    }

    // 各種倍率計算
    const lifeMultiplier = this.calculateLifeMultiplier(suspect.mentalLife);
    const trustMultiplier = this.calculateTrustMultiplier(suspect.trustLevel);
    const alertMultiplier = this.calculateAlertMultiplier(suspect.alertLevel);

    // コンボボーナス
    const comboMultiplier = isCombo ? 1.2 : 1.0;

    // クリティカル判定（10%の確率）
    const criticalHit = Math.random() < 0.1;
    const criticalMultiplier = criticalHit ? 1.5 : 1.0;

    // 最終ダメージ計算
    const finalDamage = Math.round(
      baseDamage *
      lifeMultiplier *
      trustMultiplier *
      alertMultiplier *
      comboMultiplier *
      criticalMultiplier
    );

    // 最小ダメージ保証
    const guaranteedDamage = Math.max(finalDamage, 1);

    return {
      finalDamage: guaranteedDamage,
      baseDamage,
      multipliers: {
        life: lifeMultiplier,
        trust: trustMultiplier,
        alert: alertMultiplier,
      },
      criticalHit,
      message: this.generateDamageMessage(guaranteedDamage, criticalHit, questionType)
    };
  }

  /**
   * 精神力による倍率計算
   */
  private static calculateLifeMultiplier(mentalLife: number): number {
    if (mentalLife < 20) return 2.0;  // 瀕死状態は大ダメージ
    if (mentalLife < 40) return 1.5;  // 混乱期
    if (mentalLife < 70) return 1.2;  // 動揺期
    return 1.0;  // 余裕期
  }

  /**
   * 信頼度による倍率計算
   */
  private static calculateTrustMultiplier(trustLevel: number): number {
    if (trustLevel > 80) return 1.5;   // 高信頼
    if (trustLevel > 60) return 1.3;   // 中信頼
    if (trustLevel > 40) return 1.1;   // 低信頼
    if (trustLevel > 20) return 0.9;   // 不信
    return 0.7;  // 完全不信
  }

  /**
   * 警戒度による倍率計算（防御）
   */
  private static calculateAlertMultiplier(alertLevel: number): number {
    if (alertLevel > 80) return 0.4;   // 超警戒
    if (alertLevel > 60) return 0.6;   // 高警戒
    if (alertLevel > 40) return 0.8;   // 中警戒
    return 1.0;  // 低警戒
  }

  /**
   * ダメージメッセージ生成
   */
  private static generateDamageMessage(
    damage: number,
    critical: boolean,
    _questionType: QuestionType
  ): string {
    let message = '';

    if (critical) {
      message = '💥 クリティカルヒット！ ';
    }

    if (damage >= 30) {
      message += `強烈な一撃！ ${damage}ダメージ！`;
    } else if (damage >= 20) {
      message += `効果的な質問！ ${damage}ダメージ！`;
    } else if (damage >= 10) {
      message += `${damage}ダメージを与えた！`;
    } else if (damage >= 5) {
      message += `わずかに動揺... ${damage}ダメージ`;
    } else {
      message += `ほとんど効果なし... ${damage}ダメージ`;
    }

    return message;
  }

  /**
   * ステータス変化計算
   */
  static calculateStatusChanges(
    questionType: QuestionType,
    currentStatus: SuspectStatus,
    damage: number,
    skill?: DetectiveSkill
  ): Partial<SuspectStatus> {
    const changes: Partial<SuspectStatus> = {};

    // 精神力減少
    changes.mentalLife = Math.max(0, currentStatus.mentalLife - damage);

    // 質問タイプによる変化
    switch (questionType) {
      case QuestionType.DIRECT_ATTACK:
        changes.alertLevel = Math.min(100, currentStatus.alertLevel + 15);
        changes.trustLevel = Math.max(0, currentStatus.trustLevel - 10);
        break;

      case QuestionType.PSYCHOLOGICAL:
        changes.alertLevel = Math.min(100, currentStatus.alertLevel + 10);
        changes.confessionRate = Math.min(100, currentStatus.confessionRate + damage * 0.5);
        break;

      case QuestionType.LOGICAL:
        changes.alertLevel = Math.min(100, currentStatus.alertLevel + 5);
        changes.confessionRate = Math.min(100, currentStatus.confessionRate + damage * 0.3);
        break;

      case QuestionType.EMOTIONAL:
        changes.trustLevel = Math.min(100, currentStatus.trustLevel + 5);
        changes.confessionRate = Math.min(100, currentStatus.confessionRate + damage * 0.4);
        break;

      case QuestionType.EVIDENCE:
        changes.alertLevel = Math.min(100, currentStatus.alertLevel + 20);
        changes.confessionRate = Math.min(100, currentStatus.confessionRate + damage * 0.8);
        break;

      case QuestionType.GENTLE:
        changes.alertLevel = Math.max(0, currentStatus.alertLevel - 10);
        changes.trustLevel = Math.min(100, currentStatus.trustLevel + 15);
        break;
    }

    // スキル効果の適用
    if (skill?.id === 'kind_approach') {
      changes.trustLevel = Math.min(100, (changes.trustLevel || currentStatus.trustLevel) + 30);
      changes.alertLevel = Math.max(0, (changes.alertLevel || currentStatus.alertLevel) - 20);
    } else if (skill?.id === 'psycho_pressure') {
      changes.alertLevel = Math.min(100, (changes.alertLevel || currentStatus.alertLevel) + 20);
    }

    // 自供率の自然上昇（精神力が低い場合）
    if (changes.mentalLife && changes.mentalLife < 30) {
      changes.confessionRate = Math.min(100,
        (changes.confessionRate || currentStatus.confessionRate) + (30 - changes.mentalLife) * 0.5
      );
    }

    return changes;
  }

  /**
   * 反撃判定と生成
   */
  static generateCounterAttack(
    currentPhase: GamePhase,
    suspectStatus: SuspectStatus,
    _questionType: QuestionType
  ): CounterAttack | null {
    // フェーズ別の反撃率
    const baseCounterRate = {
      [GamePhase.PHASE1_CONFIDENT]: 0.1,
      [GamePhase.PHASE2_NERVOUS]: 0.2,
      [GamePhase.PHASE3_CONFUSED]: 0.05,
      [GamePhase.PHASE4_BREAKDOWN]: 0,
    }[currentPhase];

    // 警戒度による修正
    const alertModifier = suspectStatus.alertLevel > 70 ? 0.2 : 0;
    const finalRate = baseCounterRate + alertModifier;

    if (Math.random() > finalRate) {
      return null;
    }

    // 反撃タイプ決定
    const counterTypes = this.getAvailableCounters(currentPhase, suspectStatus);
    if (counterTypes.length === 0) {
      return null;
    }
    const selectedType = counterTypes[Math.floor(Math.random() * counterTypes.length)]!;

    return this.createCounterAttack(selectedType, currentPhase);
  }

  /**
   * 利用可能な反撃タイプ取得
   */
  private static getAvailableCounters(
    phase: GamePhase,
    status: SuspectStatus
  ): CounterAttack['type'][] {
    const counters: CounterAttack['type'][] = [];

    if (phase === GamePhase.PHASE1_CONFIDENT || phase === GamePhase.PHASE2_NERVOUS) {
      counters.push('SILENCE', 'DEFLECTION');
      if (status.alertLevel > 60) {
        counters.push('LAWYER_THREAT');
      }
    }

    if (phase === GamePhase.PHASE3_CONFUSED && status.mentalLife < 30) {
      counters.push('BREAKDOWN');
    }

    return counters.length > 0 ? counters : ['SILENCE'];
  }

  /**
   * 反撃作成
   */
  private static createCounterAttack(
    type: CounterAttack['type'],
    _phase: GamePhase
  ): CounterAttack {
    switch (type) {
      case 'SILENCE':
        return {
          type: 'SILENCE',
          damage: 5,
          effect: '沈黙の圧力',
          message: '容疑者は黙り込んで、重い沈黙が部屋を包んだ...'
        };

      case 'DEFLECTION':
        return {
          type: 'DEFLECTION',
          damage: 10,
          effect: '話題逸らし',
          message: '容疑者は巧みに話を逸らし、あなたの追求をかわした！'
        };

      case 'LAWYER_THREAT':
        return {
          type: 'LAWYER_THREAT',
          damage: 15,
          effect: '弁護士要求',
          message: '「もう話しません！弁護士を呼んでください！」'
        };

      case 'BREAKDOWN':
        return {
          type: 'BREAKDOWN',
          damage: 0,
          effect: '感情的崩壊',
          message: '容疑者は泣き崩れた... しかし、何か重要なことを口走りそうだ...'
        };

      default:
        return {
          type: 'SILENCE',
          damage: 5,
          effect: '沈黙',
          message: '...'
        };
    }
  }

  /**
   * フェーズ判定
   */
  static determinePhase(mentalLife: number): GamePhase {
    if (mentalLife >= 70) return GamePhase.PHASE1_CONFIDENT;
    if (mentalLife >= 40) return GamePhase.PHASE2_NERVOUS;
    if (mentalLife >= 20) return GamePhase.PHASE3_CONFUSED;
    return GamePhase.PHASE4_BREAKDOWN;
  }

  /**
   * 勝利条件チェック
   */
  static checkVictoryCondition(status: SuspectStatus): boolean {
    return status.mentalLife <= 20 || status.confessionRate >= 90;
  }

  /**
   * 敗北条件チェック
   */
  static checkDefeatCondition(status: SuspectStatus, turnNumber: number, maxTurns: number): boolean {
    return turnNumber >= maxTurns || status.alertLevel >= 90;
  }
}