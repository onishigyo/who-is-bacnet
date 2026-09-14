import type {
  AttackAction,
  AttackActionId,
  AttackState,
  DeviceState,
} from '../domain/types'

/** 攻撃前の機器の状態 */
export const INITIAL_DEVICE: DeviceState = {
  discovered: false,
  presentValue: 22.0,
  setpoint: 24.0,
  compromised: false,
}

/** 攻撃者が書き込む設定温度 */
export const ATTACK_SETPOINT = 99.0

export function initialAttackState(): AttackState {
  return { completed: [], device: INITIAL_DEVICE }
}

export function isCompleted(state: AttackState, id: AttackActionId): boolean {
  return state.completed.includes(id)
}

/** 前提となる操作が済んでいるか（ガイド付き進行） */
export function isUnlocked(action: AttackAction, state: AttackState): boolean {
  if (action.requires === null) return true
  return isCompleted(state, action.requires)
}

/** 次にやるべき操作。全部終わっていれば null */
export function nextActionId(
  actions: AttackAction[],
  state: AttackState,
): AttackActionId | null {
  const next = actions.find(
    (action) => isUnlocked(action, state) && !isCompleted(state, action.id),
  )
  return next ? next.id : null
}

function applyOutcome(device: DeviceState, id: AttackActionId): DeviceState {
  switch (id) {
    case 'discover':
      return { ...device, discovered: true }
    case 'read':
    case 'readSetpoint':
      // 読むだけでは機器の状態は変わらない（が、値は攻撃者に渡っている）
      return device
    case 'write':
      return { ...device, setpoint: ATTACK_SETPOINT, compromised: true }
    case 'verify':
      // 読み直すだけ。書き換えが効いていることを攻撃者が確かめる
      return device
  }
}

/**
 * 操作を実行する。前提を満たしていない操作、すでに済んだ操作は状態を変えない。
 */
export function runAction(
  actions: AttackAction[],
  state: AttackState,
  id: AttackActionId,
): AttackState {
  const action = actions.find((a) => a.id === id)
  if (!action) return state
  if (!isUnlocked(action, state)) return state
  if (isCompleted(state, id)) return state

  return {
    completed: [...state.completed, id],
    device: applyOutcome(state.device, id),
  }
}

export function isAttackComplete(
  actions: AttackAction[],
  state: AttackState,
): boolean {
  return actions.every((action) => isCompleted(state, action.id))
}
