import { describe, expect, it } from 'vitest'
import { diagramEdges, diagramNodes, NETWORK_NODE_ID } from '../content/diagram'
import { mixedDiagramEdges, mixedDiagramNodes } from '../content/diagram-mixed'
import {
  activeEdgeIds,
  flightWaypoints,
  NODE_HEIGHT,
  NODE_WIDTH,
  nodeCenter,
  nodePath,
} from './layout'

describe('ノードの中心', () => {
  it('箱の大きさの半分だけずらした点', () => {
    const spec = diagramNodes[0]
    expect(nodeCenter(spec)).toEqual({
      x: spec.position.x + NODE_WIDTH / 2,
      y: spec.position.y + NODE_HEIGHT / 2,
    })
  })
})

describe('パケットの経路', () => {
  it('機器どうしの通信はネットワークを経由する（3点）', () => {
    const points = flightWaypoints(
      diagramNodes,
      diagramEdges,
      'supervisor',
      'ahu',
      NETWORK_NODE_ID,
    )
    expect(points).toHaveLength(3)
    const net = diagramNodes.find((n) => n.id === NETWORK_NODE_ID)!
    expect(points[1]).toEqual(nodeCenter(net))
  })

  it('ネットワーク宛（ブロードキャスト）は中継しない（2点）', () => {
    expect(
      flightWaypoints(
        diagramNodes,
        diagramEdges,
        'supervisor',
        NETWORK_NODE_ID,
        NETWORK_NODE_ID,
      ),
    ).toHaveLength(2)
  })

  it('図に出ていないノードが端点なら描かない', () => {
    expect(
      flightWaypoints(
        diagramNodes,
        diagramEdges,
        'ghost',
        'ahu',
        NETWORK_NODE_ID,
      ),
    ).toEqual([])
  })
})

describe('光らせるエッジ', () => {
  it('送信元とネットワーク、ネットワークと宛先の2区間', () => {
    expect(
      activeEdgeIds(diagramEdges, 'attacker', 'ahu', NETWORK_NODE_ID).sort(),
    ).toEqual(['e-ahu-net', 'e-attacker-net'])
  })

  it('ブロードキャストは送信元とネットワークの1区間', () => {
    expect(
      activeEdgeIds(
        diagramEdges,
        'supervisor',
        NETWORK_NODE_ID,
        NETWORK_NODE_ID,
      ),
    ).toEqual(['e-supervisor-net'])
  })
})

describe('配線をたどる経路（多ホップ）', () => {
  it('スター型では、送信元 → ネットワーク → 宛先 の 1 中継', () => {
    expect(nodePath(diagramEdges, 'attacker', 'ahu')).toEqual([
      'attacker',
      NETWORK_NODE_ID,
      'ahu',
    ])
  })

  it('SC の限界の図では、PC から SC 側の機器まで配線を何段も通る', () => {
    const path = nodePath(mixedDiagramEdges, 'attacker', 'ahu')
    expect(path[0]).toBe('attacker')
    expect(path.at(-1)).toBe('ahu')
    // 旧来スイッチ → ルータ → ハブ を必ず通る
    expect(path).toContain('legacy-switch')
    expect(path).toContain('bacnet-router')
    expect(path).toContain('sc-hub')
    const points = flightWaypoints(
      mixedDiagramNodes,
      mixedDiagramEdges,
      'attacker',
      'ahu',
      'sc-hub',
    )
    expect(points).toHaveLength(path.length)
  })

  it('通る区間のエッジが、経路上のすべての段ぶん光る', () => {
    const ids = activeEdgeIds(mixedDiagramEdges, 'attacker', 'ahu', 'sc-hub')
    expect(ids).toContain('mx-attacker-switch')
    expect(ids).toContain('mx-router-switch')
    expect(ids).toContain('mx-hub-router')
    expect(ids).toContain('mx-ahu-hub')
  })

  it('繋がっていなければ経路は空', () => {
    expect(nodePath(diagramEdges, 'attacker', 'ghost')).toEqual([])
  })
})
