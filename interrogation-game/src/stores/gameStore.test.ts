import { beforeEach, describe, expect, it } from 'vitest'
import { AnimationEffect, GamePhase } from '../types/GameTypes'
import useGameStore from './gameStore'

// 🧪 GameStore テスト
describe('GameStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useGameStore.getState().resetGame()
  })

  it('initializes with correct default state', () => {
    const state = useGameStore.getState()

    expect(state.gameActive).toBe(false)
    expect(state.currentTurn).toBe(0)
    expect(state.interrogationPoints).toBe(100)
    expect(state.currentPhase).toBe(GamePhase.PHASE1_CONFIDENT)
    expect(state.conversationHistory).toHaveLength(0)
    expect(state.showSettings).toBe(true)
  })

  it('resets game state correctly', () => {
    const store = useGameStore.getState()

    // 状態を変更
    const testAnimation: AnimationEffect = { type: 'pulse', duration: 1000, color: '#ff0000' }
    store.setAnimation(testAnimation)
    store.addDamageNumber(50)

    // リセット実行
    store.resetGame()

    // リセット後の状態確認
    const newState = useGameStore.getState()
    expect(newState.gameActive).toBe(false)
    expect(newState.currentAnimation).toBe(null)
    expect(newState.damageNumbers).toHaveLength(0)
    expect(newState.conversationHistory).toHaveLength(0)
  })

  it('toggles settings correctly', () => {
    const store = useGameStore.getState()
    const initialShowSettings = store.showSettings

    store.toggleSettings()
    expect(useGameStore.getState().showSettings).toBe(!initialShowSettings)

    store.toggleSettings()
    expect(useGameStore.getState().showSettings).toBe(initialShowSettings)
  })

  it('manages damage numbers correctly', () => {
    const store = useGameStore.getState()

    // ダメージ数値追加
    store.addDamageNumber(25)

    const state = useGameStore.getState()
    expect(state.damageNumbers).toHaveLength(1)

    // 🔒 型安全性確保: 配列の存在確認
    const firstDamage = state.damageNumbers[0]
    expect(firstDamage).toBeDefined()
    expect(firstDamage?.value).toBe(25)
    expect(typeof firstDamage?.id).toBe('string')
    expect(typeof firstDamage?.x).toBe('number')
    expect(typeof firstDamage?.y).toBe('number')
  })

  it('sets animation correctly', () => {
    const store = useGameStore.getState()
    const testAnimation: AnimationEffect = { type: 'shake', duration: 500, color: '#00ff00' }

    store.setAnimation(testAnimation)
    expect(useGameStore.getState().currentAnimation).toEqual(testAnimation)

    store.setAnimation(null)
    expect(useGameStore.getState().currentAnimation).toBe(null)
  })
}) 