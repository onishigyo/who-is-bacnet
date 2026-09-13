import { describe, expect, it } from 'vitest'
import { diagramEdges, diagramNodes, NETWORK_NODE_ID } from '../content/diagram'
import {
  activeEdgeIds,
  flightWaypoints,
  NODE_HEIGHT,
  NODE_WIDTH,
  nodeCenter,
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
        'supervisor',
        NETWORK_NODE_ID,
        NETWORK_NODE_ID,
      ),
    ).toHaveLength(2)
  })

  it('図に出ていないノードが端点なら描かない', () => {
    expect(
      flightWaypoints(diagramNodes, 'ghost', 'ahu', NETWORK_NODE_ID),
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
