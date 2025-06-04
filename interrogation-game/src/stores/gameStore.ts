import { create } from 'zustand';
import { GameEngine } from '../game/GameEngine';
import {
  AnimationEffect,
  GameEvent,
  GamePhase,
  GameResult,
  GameSettings,
  GameStore
} from '../types/GameTypes';

interface GameStoreState extends GameStore {
  gameEngine: GameEngine | null;
  currentAnimation: AnimationEffect | null;
  damageNumbers: Array<{ id: string; value: number; x: number; y: number }>;

  // UI状態
  showSettings: boolean;
  showResults: boolean;
  gameResult: GameResult | null;

  // アクション
  initGame: (settings: GameSettings) => void;
  resetGame: () => void;
  setAnimation: (animation: AnimationEffect | null) => void;
  addDamageNumber: (damage: number) => void;
  removeDamageNumber: (id: string) => void;
  toggleSettings: () => void;
}

const useGameStore = create<GameStoreState>((set, get) => ({
  // 初期状態
  gameEngine: null,
  gameActive: false,
  currentTurn: 0,
  maxTurns: 30,

  // 犯人情報
  suspect: null,
  suspectStatus: {
    mentalLife: 100,
    alertLevel: 10,
    trustLevel: 20,
    confessionRate: 0
  },
  currentPhase: GamePhase.PHASE1_CONFIDENT,

  // プレイヤー情報
  interrogationPoints: 100,
  availableSkills: [],

  // ゲームログ
  logs: [],
  conversationHistory: [],

  // UI状態
  isProcessing: false,
  currentAnimation: null,
  damageNumbers: [],
  showSettings: false,
  showResults: false,
  gameResult: null,

  // ゲーム初期化
  initGame: (settings: GameSettings) => {
    const engine = new GameEngine(settings);

    // イベントハンドラ設定
    engine.on('DAMAGE', (event: GameEvent) => {
      if (event.type === 'DAMAGE') {
        const { damage, animation } = event.data;
        get().addDamageNumber(damage);
        if (animation) {
          set({ currentAnimation: animation });
          setTimeout(() => set({ currentAnimation: null }), animation.duration);
        }
      }
    });

    engine.on('PHASE_CHANGE', (event: GameEvent) => {
      if (event.type === 'PHASE_CHANGE') {
        const { newPhase } = event.data;
        set({ currentPhase: newPhase });
      }
    });

    engine.on('SPECIAL', (event: GameEvent) => {
      if (event.type === 'SPECIAL' && event.data.gameResult) {
        set({
          gameResult: event.data.gameResult,
          showResults: true,
          gameActive: false
        });
      }
    });

    engine.startGame();
    const gameState = engine.getGameState();
    const suspectInfo = engine.getSuspectInfo();

    set({
      gameEngine: engine,
      gameActive: gameState.active,
      currentTurn: gameState.turn,
      maxTurns: settings.turnLimit,
      interrogationPoints: gameState.interrogationPoints,
      availableSkills: gameState.skills,
      suspect: suspectInfo.background,
      suspectStatus: suspectInfo.status,
      currentPhase: suspectInfo.phase,
      logs: gameState.logs,
      showSettings: false,
      showResults: false,
      gameResult: null
    });
  },

  // ゲーム開始
  startGame: (settings: GameSettings) => {
    get().initGame(settings);
  },

  // 質問送信
  askQuestion: async (question: string) => {
    const { gameEngine, gameActive } = get();
    if (!gameEngine || !gameActive || get().isProcessing) return;

    set({ isProcessing: true });

    try {
      // 会話履歴に追加
      const currentHistory = get().conversationHistory;
      set({
        conversationHistory: [...currentHistory, {
          role: 'player',
          message: question
        }]
      });

      // ゲームエンジンで処理
      const turn = await gameEngine.processPlayerQuestion(question);

      // 状態更新
      const gameState = gameEngine.getGameState();
      const suspectInfo = gameEngine.getSuspectInfo();

      set({
        currentTurn: gameState.turn,
        interrogationPoints: gameState.interrogationPoints,
        availableSkills: gameState.skills,
        suspectStatus: suspectInfo.status,
        currentPhase: suspectInfo.phase,
        logs: gameState.logs,
        conversationHistory: [...get().conversationHistory, {
          role: 'suspect',
          message: turn.aiResponse?.responseText || ''
        }]
      });

    } catch (error) {
      // 🔒 セキュリティリスク除去: 詳細なエラー情報を隠蔽
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';

      // 開発環境でのみデバッグ情報を出力
      if (process.env.NODE_ENV === 'development') {
        console.warn('質問処理エラー:', errorMessage);
      }

      // ユーザーフレンドリーなエラーメッセージを会話履歴に追加
      set(state => ({
        conversationHistory: [...state.conversationHistory, {
          role: 'suspect' as const,
          message: '（システムエラー：一時的な問題が発生しました。もう一度お試しください。）'
        }]
      }));
    } finally {
      set({ isProcessing: false });
    }
  },

  // スキル使用
  useSkill: (skillId: string) => {
    const { gameEngine, availableSkills } = get();
    if (!gameEngine) return;

    const skill = availableSkills.find(s => s.id === skillId);
    if (!skill || skill.currentUses >= skill.maxUses || skill.currentCooldown > 0) {
      return;
    }

    // スキルIDを保存して次の質問で使用
    set({ currentAnimation: { type: 'pulse', duration: 1000, color: '#4ade80' } as AnimationEffect });
  },

  // ゲーム終了
  endGame: (result: GameResult) => {
    set({
      gameActive: false,
      gameResult: result,
      showResults: true
    });
  },

  // ゲームリセット
  resetGame: () => {
    set({
      gameEngine: null,
      gameActive: false,
      currentTurn: 0,
      suspect: null,
      suspectStatus: {
        mentalLife: 100,
        alertLevel: 10,
        trustLevel: 20,
        confessionRate: 0
      },
      currentPhase: GamePhase.PHASE1_CONFIDENT,
      interrogationPoints: 100,
      availableSkills: [],
      logs: [],
      conversationHistory: [],
      isProcessing: false,
      currentAnimation: null,
      damageNumbers: [],
      showSettings: true,
      showResults: false,
      gameResult: null
    });
  },

  // アニメーション設定
  setAnimation: (animation: AnimationEffect | null) => {
    set({ currentAnimation: animation });
  },

  // ダメージ数値追加
  addDamageNumber: (damage: number) => {
    const id = Date.now().toString();
    const x = 50 + Math.random() * 20 - 10;
    const y = 50 + Math.random() * 20 - 10;

    set(state => ({
      damageNumbers: [...state.damageNumbers, { id, value: damage, x, y }]
    }));

    setTimeout(() => {
      get().removeDamageNumber(id);
    }, 2000);
  },

  // ダメージ数値削除
  removeDamageNumber: (id: string) => {
    set(state => ({
      damageNumbers: state.damageNumbers.filter(d => d.id !== id)
    }));
  },

  // 設定画面トグル
  toggleSettings: () => {
    set(state => ({ showSettings: !state.showSettings }));
  }
}));

export default useGameStore;