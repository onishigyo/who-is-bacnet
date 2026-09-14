import { describe, expect, it } from 'vitest'
import { ATTACK_CONVERSATION_ID, conversations } from '../content/conversations'
import { ATTACKER_ID } from '../content/diagram'
import { conversationById } from './conversation'
import {
  ATTACK_SETPOINT,
  deviceFrom,
  INITIAL_DEVICE,
  parseReal,
} from './device'

const attack = conversationById(conversations, ATTACK_CONVERSATION_ID)

describe('present-value の読み取り', () => {
  it('Wireshark の表記から数値を取り出す', () => {
    expect(parseReal('Present Value (real): 99')).toBe(99)
    expect(parseReal('Present Value (real): 22')).toBe(22)
    expect(parseReal(undefined)).toBeUndefined()
    expect(parseReal('Simple-ACK')).toBeUndefined()
  })
})

describe('会話から組み立てる機器の状態', () => {
  it('何も着信していなければ初期状態（室温 22・設定 24・未改ざん）', () => {
    expect(deviceFrom([], ATTACKER_ID)).toEqual(INITIAL_DEVICE)
  })

  it('書き込み要求だけでは、まだ変わらない（SimpleACK を待つ）', () => {
    const writeReq = attack.messages.find(
      (m) => m.kind === 'request' && m.protocol.includes('writeProperty'),
    )!
    const device = deviceFrom([writeReq], ATTACKER_ID)
    expect(device.setpoint).toBe(INITIAL_DEVICE.setpoint)
    expect(device.compromised).toBe(false)
  })

  it('攻撃を最後まで着信させると、設定温度が 99 で書き換え済みになる', () => {
    const device = deviceFrom(attack.messages, ATTACKER_ID)
    expect(device.setpoint).toBe(ATTACK_SETPOINT)
    expect(device.compromised).toBe(true)
    // 室温は書き換えていないので初期のまま
    expect(device.presentValue).toBe(INITIAL_DEVICE.presentValue)
  })

  it('同じ書き込みでも、話し手が攻撃者でなければ改ざん印は付かない', () => {
    const device = deviceFrom(attack.messages, 'someone-else')
    expect(device.setpoint).toBe(ATTACK_SETPOINT)
    expect(device.compromised).toBe(false)
  })

  it('正常運用（中央監視の 26 ℃）でも、設定温度は追従する', () => {
    const normal = conversationById(conversations, 'normal-operation')
    const device = deviceFrom(normal.messages, ATTACKER_ID)
    expect(device.setpoint).toBe(26)
    expect(device.compromised).toBe(false)
  })
})
