import type { ConversationMessage, DeviceState, NodeId } from '../domain/types'

/** 会話が始まる前の機器の状態（室温 22.0 ℃・設定温度 24.0 ℃） */
export const INITIAL_DEVICE: DeviceState = {
  presentValue: 22.0,
  setpoint: 24.0,
  compromised: false,
}

/** 攻撃者が書き込む設定温度 */
export const ATTACK_SETPOINT = 99.0

/** 'Present Value (real): 99' → 99。読めなければ undefined */
export function parseReal(value: string | undefined): number | undefined {
  const match = value?.match(/Present Value \(real\): (-?[\d.]+)/)
  return match ? Number(match[1]) : undefined
}

function isWriteRequest(message: ConversationMessage): boolean {
  return (
    message.kind === 'request' && message.protocol.includes('writeProperty')
  )
}

function isWriteAck(message: ConversationMessage): boolean {
  return message.kind === 'response' && message.protocol.includes('Simple-ACK')
}

/**
 * 着信済みのメッセージから、機器のいまの状態を組み立てる。
 *
 * 設定温度は、書き込み要求（WriteProperty）に対して SimpleACK が返った
 * ところで反映する（「了解しました」と返って初めて値が変わる、という順番）。
 * その書き込みが attacker から来ていれば、書き換えられた印を付ける。
 */
export function deviceFrom(
  messages: ConversationMessage[],
  attackerId: NodeId,
): DeviceState {
  let device = INITIAL_DEVICE

  messages.forEach((message, index) => {
    if (!isWriteRequest(message)) return
    const written = parseReal(message.value)
    if (written === undefined) return
    // この書き込みに対する SimpleACK が、あとに着いているか
    const acked = messages.slice(index + 1).some(isWriteAck)
    if (!acked) return
    device = {
      ...device,
      setpoint: written,
      compromised: message.from === attackerId,
    }
  })

  return device
}
