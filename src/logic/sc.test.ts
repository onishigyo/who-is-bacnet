import { describe, expect, it } from 'vitest'
import { scRejectedCapture } from '../content/captures'
import {
  scConversations,
  SC_ATTACK_CONVERSATION_ID,
  SC_NORMAL_CONVERSATION_ID,
} from '../content/conversations-sc'
import { ATTACKER_ID } from '../content/diagram'
import {
  LEGACY_SWITCH_ID,
  MIXED_ROUTER_ID,
  mixedDiagramEdges,
  mixedDiagramNodes,
} from '../content/diagram-mixed'
import {
  SC_HUB_ID,
  scDiagramEdges,
  scDiagramNodes,
} from '../content/diagram-sc'

describe('SC 図', () => {
  it('中央に専用ハブがあり、機器はすべてハブに繋がる', () => {
    const hub = scDiagramNodes.find((n) => n.id === SC_HUB_ID)
    expect(hub?.kind).toBe('hub')
    for (const edge of scDiagramEdges) {
      expect(edge.target).toBe(SC_HUB_ID)
    }
  })

  it('中央監視も証明書を持ち、ハブに繋がる 1 ノードとして描かれる', () => {
    const supervisor = scDiagramNodes.find((n) => n.kind === 'supervisor')
    expect(supervisor?.hasCertificate).toBe(true)
    expect(scDiagramEdges.some((e) => e.source === supervisor?.id)).toBe(true)
  })

  it('正規の機器は証明書を持ち、攻撃者は持たない', () => {
    const controllers = scDiagramNodes.filter(
      (n) => n.kind === 'controller' || n.kind === 'supervisor',
    )
    expect(controllers.length).toBeGreaterThan(0)
    for (const c of controllers) expect(c.hasCertificate).toBe(true)

    const attacker = scDiagramNodes.find((n) => n.kind === 'attacker')
    expect(attacker?.hasCertificate).toBe(false)
  })

  it('攻撃者は、機器より後のステップで現れる', () => {
    const attacker = scDiagramNodes.find((n) => n.kind === 'attacker')!
    const device = scDiagramNodes.find((n) => n.id === 'ahu')!
    expect(attacker.appearsAt).toBeGreaterThan(device.appearsAt)
  })
})

describe('SC 会話', () => {
  const normal = scConversations.find(
    (c) => c.id === SC_NORMAL_CONVERSATION_ID,
  )!
  const attack = scConversations.find(
    (c) => c.id === SC_ATTACK_CONVERSATION_ID,
  )!

  it('正規運用の Read/Write は暗号化フラグが立っている', () => {
    const payload = normal.messages.filter((m) =>
      /ReadProperty|WriteProperty|ComplexACK|Simple-?ACK/.test(m.protocol),
    )
    expect(payload.length).toBeGreaterThan(0)
    for (const m of payload) expect(m.encrypted).toBe(true)
  })

  it('ハブの断り（rejected）で終わり、BACnet の会話には進まない', () => {
    const rejection = attack.messages.find((m) => m.rejected)
    expect(rejection?.from).toBe(SC_HUB_ID)
    expect(attack.messages.at(-1)?.from).toBe(SC_HUB_ID)
    // BACnet の会話（Read や Write）には 1 通も進まない
    expect(
      attack.messages.some((m) =>
        /ReadProperty|WriteProperty/.test(m.protocol),
      ),
    ).toBe(false)
  })

  it('すべてのメッセージが意訳・実コマンド・解説・action を持つ', () => {
    for (const conv of scConversations) {
      for (const m of conv.messages) {
        expect(m.plain.length).toBeGreaterThan(0)
        expect(m.protocol.length).toBeGreaterThan(0)
        expect(m.explain.length).toBeGreaterThan(0)
        expect(m.action.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('SC の門前払いは、実験キャプチャと 1 対 1 で対応する', () => {
  const attack = scConversations.find(
    (c) => c.id === SC_ATTACK_CONVERSATION_ID,
  )!
  // 実験での役割：192.168.222.128 から、192.168.222.130 の SC ハブへ繋いだ
  const ipOf: Record<string, string> = {
    [ATTACKER_ID]: '192.168.222.128',
    [SC_HUB_ID]: '192.168.222.130',
  }

  it('会話はこのキャプチャを指している', () => {
    expect(attack.captureId).toBe(scRejectedCapture.id)
  })

  it('どのチップも番号を持ち、その行と Info 欄・値・送信元・宛先が一致する', () => {
    for (const message of attack.messages) {
      const row = scRejectedCapture.rows.find((r) => r.no === message.frame)
      expect(row, `${message.id} → No.${message.frame}`).toBeDefined()
      expect(message.protocol).toBe(row?.info)
      expect(message.value).toBe(row?.value)
      expect(ipOf[message.from]).toBe(row?.source)
      expect(ipOf[message.to]).toBe(row?.destination)
    }
  })

  it('チップの順番は、キャプチャの順番どおり', () => {
    const frames = attack.messages.map((m) => m.frame)
    expect(frames).toEqual([...frames].sort((a, b) => a! - b!))
  })

  it('キャプチャの全行が、どれか 1 つのチップで光る（左とつながらない行がない）', () => {
    const lit = attack.messages.flatMap((m) => [
      ...(m.frame === undefined ? [] : [m.frame]),
      ...(m.relatedFrames ?? []),
    ])
    expect([...lit].sort((a, b) => a - b)).toEqual(
      scRejectedCapture.rows.map((row) => row.no),
    )
  })
})

describe('SC の限界の図（SC と旧来の BACnet/IP が混ざる建物）', () => {
  const edge = (a: string, b: string) =>
    mixedDiagramEdges.find(
      (e) =>
        (e.source === a && e.target === b) ||
        (e.source === b && e.target === a),
    )

  it('BACnet ルータが、SC ハブと旧来の区画をつなぐ', () => {
    expect(edge(MIXED_ROUTER_ID, SC_HUB_ID)).toBeDefined()
    expect(edge(MIXED_ROUTER_ID, LEGACY_SWITCH_ID)).toBeDefined()
  })

  it('持ち込まれた PC は旧来の区画にいて、ハブには直接つながらない', () => {
    expect(edge(ATTACKER_ID, LEGACY_SWITCH_ID)?.tone).toBe('danger')
    expect(edge(ATTACKER_ID, SC_HUB_ID)).toBeUndefined()
  })

  it('ルータを越えて届くかは、要検証の線としてだけ描く', () => {
    const across = edge(ATTACKER_ID, MIXED_ROUTER_ID)
    expect(across?.tone).toBe('unverified')
    expect(across?.label).toContain('要検証')
    // 要検証の線のほかに、SC 側へ「届く」と断定する線はない
    const scSide = new Set([SC_HUB_ID, 'ahu', 'lighting', 'supervisor'])
    for (const e of mixedDiagramEdges.filter((e) => e.tone === 'danger')) {
      expect(scSide.has(e.source) || scSide.has(e.target)).toBe(false)
    }
  })

  it('証明書の期限切れの機器は、ハブと繋がれない線で描く', () => {
    const expired = mixedDiagramNodes.filter((n) => n.certificateExpired)
    expect(expired.length).toBeGreaterThan(0)
    for (const n of expired) expect(edge(n.id, SC_HUB_ID)?.tone).toBe('broken')
  })
})
