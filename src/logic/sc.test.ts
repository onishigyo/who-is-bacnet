import { describe, expect, it } from 'vitest'
import {
  scConversations,
  SC_ATTACK_CONVERSATION_ID,
  SC_NORMAL_CONVERSATION_ID,
} from '../content/conversations-sc'
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
      /ReadProperty|WriteProperty|ComplexACK|SimpleACK/.test(m.protocol),
    )
    expect(payload.length).toBeGreaterThan(0)
    for (const m of payload) expect(m.encrypted).toBe(true)
  })

  it('攻撃は、ハブの拒否で終わる（rejected で止まる）', () => {
    const last = attack.messages.at(-1)!
    expect(last.rejected).toBe(true)
    expect(last.from).toBe(SC_HUB_ID)
    // 拒否より後に、Read や Write は 1 通も無い
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
