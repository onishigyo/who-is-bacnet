import { describe, expect, it } from 'vitest'
import { scRejectedCapture } from '../content/captures'
import {
  scConversations,
  SC_ATTACK_CONVERSATION_ID,
  SC_NORMAL_CONVERSATION_ID,
} from '../content/conversations-sc'
import { AHU_ID, ATTACKER_ID } from '../content/diagram'
import {
  MIXED_ATTACK_CONVERSATION_ID,
  mixedConversations,
} from '../content/conversations-mixed'
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

  it('持ち込まれた PC は旧来スイッチにだけ物理接続し、ルータや SC 側へ直接の線はない', () => {
    // ルータ越えは論理経路なので図に線を引かず、会話（多ホップ飛行）で見せる
    for (const id of [
      MIXED_ROUTER_ID,
      SC_HUB_ID,
      'ahu',
      'lighting',
      'supervisor',
    ]) {
      expect(edge(ATTACKER_ID, id)).toBeUndefined()
    }
    expect(edge(ATTACKER_ID, LEGACY_SWITCH_ID)?.tone).toBe('danger')
  })

  it('証明書の期限切れの機器は、ハブと繋がれない線で描く', () => {
    const expired = mixedDiagramNodes.filter((n) => n.certificateExpired)
    expect(expired.length).toBeGreaterThan(0)
    for (const n of expired) expect(edge(n.id, SC_HUB_ID)?.tone).toBe('broken')
  })
})

describe('SC の限界の会話（ルータ越え・要検証）', () => {
  const attack = mixedConversations.find(
    (c) => c.id === MIXED_ATTACK_CONVERSATION_ID,
  )!

  it('実験キャプチャは持たない（frame も captureId もない）', () => {
    expect(attack.captureId).toBeUndefined()
    for (const m of attack.messages) expect(m.frame).toBeUndefined()
  })

  it('まず、SC 非対応の電力計を同じ区画から読む（BACnet/IP と同じ手口）', () => {
    const read = attack.messages.find((m) => m.to === 'meter')
    expect(read?.from).toBe(ATTACKER_ID)
    expect(/readProperty/i.test(read?.protocol ?? '')).toBe(true)
    const reply = attack.messages.find((m) => m.from === 'meter')
    expect(reply?.to).toBe(ATTACKER_ID)
  })

  it('続けて、PC から SC 側の空調コントローラへの書き込みで、要検証を明示する', () => {
    const write = attack.messages.find(
      (m) => m.from === ATTACKER_ID && m.to === AHU_ID,
    )
    expect(write).toBeDefined()
    expect(/writeProperty/i.test(write!.protocol)).toBe(true)
    expect(write!.annotation).toContain('未確認')
    expect(write!.annotationTone).toBe('alert')
  })
})
