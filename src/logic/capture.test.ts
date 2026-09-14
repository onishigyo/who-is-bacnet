import { describe, expect, it } from 'vitest'
import { ipCapture, scCapture } from '../content/captures'
import { ATTACK_CONVERSATION_ID, conversations } from '../content/conversations'
import { AHU_ID, diagramNodes } from '../content/diagram'
import { ATTACK_SETPOINT } from './device'

const valueOf = (info: RegExp) => {
  const row = ipCapture.rows.find((r) => info.test(r.info))
  const match = row?.value?.match(/Present Value \(real\): ([\d.]+)/)
  return match ? Number(match[1]) : undefined
}

// 撮り直し待ち：ipCapture を差し替えたら復活させる
describe.skip('教材の数字は、実験キャプチャと一致する', () => {
  it('I-Am で名乗ったデバイスインスタンスが、図の空調コントローラと同じ', () => {
    const iAm = ipCapture.rows.find((row) => /i-Am device,\d+/.test(row.info))
    const instance = Number(iAm?.info.match(/i-Am device,(\d+)/)?.[1])
    const ahu = diagramNodes.find((node) => node.id === AHU_ID)
    expect(instance).toBe(ahu?.deviceInstance)
  })

  it('書き込んだ設定値（analog-value,0）が、教材で攻撃者が書く値と同じ', () => {
    expect(valueOf(/writeProperty\[\s*\d+\] analog-value,0/)).toBe(
      ATTACK_SETPOINT,
    )
  })
})

describe('公開する範囲の点検', () => {
  it('IP 版は BACnet の行だけ（SSH・DHCP などが紛れ込んでいない）', () => {
    for (const row of ipCapture.rows) {
      expect(row.protocol).toBe('BACnet-APDU')
    }
  })

  it('SC 版はハブ（TCP 47900）とのやり取りだけ', () => {
    for (const row of scCapture.rows) {
      expect(['TCP', 'TLSv1.3']).toContain(row.protocol)
    }
  })

  it('載せるアドレスは実験の閉域網（192.168.222.0/24）のものだけ', () => {
    for (const row of [...ipCapture.rows, ...scCapture.rows]) {
      expect(row.source).toMatch(/^192\.168\.222\.\d+$/)
      expect(row.destination).toMatch(/^192\.168\.222\.\d+$/)
    }
  })
})

// 撮り直し待ち：会話に frame を付け直したら復活させる
describe.skip('デモの攻撃は、実験キャプチャと 1 対 1 で対応する', () => {
  // 攻撃の会話の全メッセージ（1 本に繋がっている）
  const attackMessages =
    conversations.find((c) => c.id === ATTACK_CONVERSATION_ID)?.messages ?? []

  it('番号を持つメッセージは、その番号の行と Info 欄・値が一字一句同じ', () => {
    for (const message of attackMessages.filter((m) => m.frame !== undefined)) {
      const row = ipCapture.rows.find((r) => r.no === message.frame)
      expect(row, `No.${message.frame}`).toBeDefined()
      expect(message.protocol).toBe(row?.info)
      expect(message.value).toBe(row?.value)
    }
  })

  it('キャプチャの全行が、デモのどこかに同じ順番で出てくる', () => {
    const frames = attackMessages.flatMap((m) =>
      m.frame === undefined ? [] : [m.frame],
    )
    expect(frames).toEqual(ipCapture.rows.map((row) => row.no))
  })

  it('送信元と宛先も実験と同じ（図のアドレスは実験に合わせてある）', () => {
    const ipOf = Object.fromEntries(
      diagramNodes.map((node) => [node.id, node.ip]),
    )
    for (const message of attackMessages.filter((m) => m.frame !== undefined)) {
      const row = ipCapture.rows.find((r) => r.no === message.frame)
      expect(ipOf[message.from]).toBe(row?.source)
      const destination =
        message.to === 'broadcast' ? '192.168.222.255' : ipOf[message.to]
      expect(destination).toBe(row?.destination)
    }
  })
})
