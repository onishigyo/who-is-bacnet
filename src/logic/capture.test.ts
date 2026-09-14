import { describe, expect, it } from 'vitest'
import { ipCapture, scCapture } from '../content/captures'
import { AHU_ID, diagramNodes } from '../content/diagram'
import { ATTACK_SETPOINT, INITIAL_DEVICE } from './attack'

const valueOf = (info: RegExp) => {
  const row = ipCapture.rows.find((r) => info.test(r.info))
  const match = row?.value?.match(/Present Value \(real\): ([\d.]+)/)
  return match ? Number(match[1]) : undefined
}

describe('教材の数字は、実験キャプチャと一致する', () => {
  it('I-Am で名乗ったデバイスインスタンスが、図の空調コントローラと同じ', () => {
    const iAm = ipCapture.rows.find((row) => /i-Am device,\d+/.test(row.info))
    const instance = Number(iAm?.info.match(/i-Am device,(\d+)/)?.[1])
    const ahu = diagramNodes.find((node) => node.id === AHU_ID)
    expect(instance).toBe(ahu?.deviceInstance)
  })

  it('読んだ室温（analog-input,0）が、教材の室温と同じ', () => {
    expect(valueOf(/Complex-ACK\s+readProperty\[\s*\d+\] analog-input,0/)).toBe(
      INITIAL_DEVICE.presentValue,
    )
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
