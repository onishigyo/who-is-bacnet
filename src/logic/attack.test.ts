import { describe, expect, it } from 'vitest'
import { attackActions, conversations } from '../content/conversations'
import {
  ATTACK_SETPOINT,
  INITIAL_DEVICE,
  initialAttackState,
  isAttackComplete,
  isUnlocked,
  nextActionId,
  runAction,
} from './attack'

describe('ガイド付きの攻撃操作', () => {
  it('最初は Who-Is だけが開いている', () => {
    const state = initialAttackState()
    expect(nextActionId(attackActions, state)).toBe('discover')
    expect(isUnlocked(attackActions[0], state)).toBe(true)
    expect(isUnlocked(attackActions[1], state)).toBe(false)
  })

  it('順に実行すると、次の操作が開く', () => {
    let state = initialAttackState()
    state = runAction(attackActions, state, 'discover')
    expect(state.device.discovered).toBe(true)
    expect(nextActionId(attackActions, state)).toBe('read')

    state = runAction(attackActions, state, 'read')
    expect(nextActionId(attackActions, state)).toBe('write')
    expect(state.device.compromised).toBe(false)

    state = runAction(attackActions, state, 'write')
    expect(state.device.setpoint).toBe(ATTACK_SETPOINT)
    expect(state.device.compromised).toBe(true)
    expect(nextActionId(attackActions, state)).toBe('verify')
    expect(isAttackComplete(attackActions, state)).toBe(false)

    // 読み直しても状態は変わらない（確かめるだけ）
    const verified = runAction(attackActions, state, 'verify')
    expect(verified.device).toEqual(state.device)
    expect(nextActionId(attackActions, verified)).toBeNull()
    expect(isAttackComplete(attackActions, verified)).toBe(true)
  })

  it('前提を満たさない操作は何も起こさない', () => {
    const state = initialAttackState()
    expect(runAction(attackActions, state, 'write')).toEqual(state)
    expect(runAction(attackActions, state, 'read')).toEqual(state)
  })

  it('同じ操作を2回実行しても状態は増えない', () => {
    const once = runAction(attackActions, initialAttackState(), 'discover')
    expect(runAction(attackActions, once, 'discover')).toEqual(once)
  })

  it('読むだけでは機器の状態は変わらない', () => {
    let state = runAction(attackActions, initialAttackState(), 'discover')
    state = runAction(attackActions, state, 'read')
    expect(state.device.setpoint).toBe(INITIAL_DEVICE.setpoint)
    expect(state.device.compromised).toBe(false)
  })

  it('初期状態は不変（呼び出しごとに新しい状態）', () => {
    const state = initialAttackState()
    runAction(attackActions, state, 'discover')
    expect(state.completed).toEqual([])
    expect(initialAttackState().device).toEqual(INITIAL_DEVICE)
  })

  it('各操作に対応する会話が存在する', () => {
    for (const action of attackActions) {
      expect(conversations.some((c) => c.id === action.conversationId)).toBe(
        true,
      )
    }
  })
})
