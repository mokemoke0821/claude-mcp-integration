// ===== ゲームコア型定義 =====

export enum QuestionType {
  DIRECT_ATTACK = 25,     // 直接的な糾弾
  PSYCHOLOGICAL = 20,     // 心理的圧迫
  LOGICAL = 15,           // 論理的追求
  EMOTIONAL = 18,         // 感情的訴求
  EVIDENCE = 30,          // 証拠提示
  GENTLE = 5              // 優しい質問
}

export interface SuspectStatus {
  mentalLife: number;        // 0-100% 心理的耐久力
  alertLevel: number;        // 0-100% 警戒度
  trustLevel: number;        // 0-100% 刑事への信頼度
  confessionRate: number;    // 0-100% 自供意欲
}

export enum GamePhase {
  PHASE1_CONFIDENT = 1,    // 余裕期 (100-70%)
  PHASE2_NERVOUS = 2,      // 動揺期 (69-40%)
  PHASE3_CONFUSED = 3,     // 混乱期 (39-20%)
  PHASE4_BREAKDOWN = 4     // 崩壊期 (20-0%)
}

export interface PersonalityPhase {
  phase: GamePhase;
  tone: string;
  responses: string[];
  counterAttackRate: number;
  cooperationLevel: number;
  emotionalReactions?: boolean;
  truthSlipping?: boolean;
  confessionMode?: boolean;
}

// ===== 戦闘システム型定義 =====

export interface CounterAttack {
  type: 'SILENCE' | 'DEFLECTION' | 'LAWYER_THREAT' | 'BREAKDOWN';
  damage: number;
  effect: string;
  message: string;
}

export interface DetectiveSkill {
  id: string;
  name: string;
  description: string;
  effect: string;
  cooldown: number;
  currentCooldown: number;
  maxUses: number;
  currentUses: number;
  icon?: string;
}

export interface DamageResult {
  finalDamage: number;
  baseDamage: number;
  multipliers: {
    life: number;
    trust: number;
    alert: number;
  };
  criticalHit: boolean;
  message: string;
}

// ===== ゲーム進行型定義 =====

export interface GameTurn {
  turnNumber: number;
  phase: 'PLAYER_QUESTION' | 'AI_RESPONSE' | 'STATUS_UPDATE' | 'SPECIAL_EVENT';
  
  playerAction?: {
    questionText: string;
    detectedType: QuestionType;
    skillUsed?: DetectiveSkill;
    timestamp: number;
  };
  
  aiResponse?: {
    responseText: string;
    damageDealt: number;
    statusChanges: Partial<SuspectStatus>;
    specialAction?: CounterAttack;
    emotion?: string;
  };
  
  gameState: {
    turnNumber: number;
    timeRemaining: number;
    victorConditionMet: boolean;
    defeatConditionMet: boolean;
  };
}

export interface GameLog {
  timestamp: number;
  type: 'damage' | 'status' | 'skill' | 'counter' | 'phase_change' | 'system';
  message: string;
  details?: any;
}

export enum GameResult {
  PERFECT_VICTORY = 'PERFECT_VICTORY',  // 15ターン以内
  VICTORY = 'VICTORY',                  // 30ターン以内
  DRAW = 'DRAW',                        // 時間切れ (Life 20-40%)
  DEFEAT = 'DEFEAT',                    // 時間切れ or 弁護士
  SURRENDER = 'SURRENDER'               // プレイヤー降参
}

// ===== AI犯人型定義 =====

export interface SuspectBackground {
  name: string;
  age: number;
  occupation: string;
  crime: string;
  motive: string;
  personality: string;
  secretWeakness: string;
  hiddenTruths: string[];
}

export interface SuspectSpecialAction {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  probability: number;
}

// ===== ゲーム設定型定義 =====

export interface GameSettings {
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';
  turnLimit: number;
  suspectType: 'CALM' | 'EMOTIONAL' | 'STUBBORN' | 'CUNNING';
  ollamaModel: string;
  enableEffects: boolean;
  autoSave: boolean;
}

export interface DifficultyModifiers {
  lifeMultiplier: number;
  damageReduction: number;
  counterAttackBonus: number;
  confessionThreshold: number;
}

// ===== UIイベント型定義 =====

export interface GameEvent {
  type: 'DAMAGE' | 'HEAL' | 'STATUS_CHANGE' | 'PHASE_CHANGE' | 'SKILL_USE' | 'COUNTER' | 'SPECIAL';
  data: any;
}

export interface AnimationEffect {
  type: 'shake' | 'flash' | 'pulse' | 'fade';
  duration: number;
  intensity?: number;
  color?: string;
}

// ===== Ollama統合型定義 =====

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    seed?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  eval_count?: number;
}

export interface GameContext {
  suspect: SuspectBackground;
  currentStatus: SuspectStatus;
  currentPhase: GamePhase;
  conversationHistory: Array<{
    role: 'player' | 'suspect';
    message: string;
    questionType?: QuestionType;
  }>;
  turnNumber: number;
  secretsRevealed: string[];
}

// ===== ストア型定義 =====

export interface GameStore {
  // ゲーム状態
  gameActive: boolean;
  currentTurn: number;
  maxTurns: number;
  
  // 犯人情報
  suspect: SuspectBackground | null;
  suspectStatus: SuspectStatus;
  currentPhase: GamePhase;
  
  // プレイヤー情報
  interrogationPoints: number;
  availableSkills: DetectiveSkill[];
  
  // ゲームログ
  logs: GameLog[];
  conversationHistory: GameContext['conversationHistory'];
  
  // アクション
  startGame: (settings: GameSettings) => void;
  askQuestion: (question: string) => Promise<void>;
  useSkill: (skillId: string) => void;
  endGame: (result: GameResult) => void;
  
  // UI状態
  isProcessing: boolean;
  currentAnimation: AnimationEffect | null;
}