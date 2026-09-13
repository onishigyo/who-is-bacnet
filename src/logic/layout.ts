import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'

/** ノードの箱の大きさ（CSS と一致させる） */
export const NODE_WIDTH = 224
export const NODE_HEIGHT = 96

export interface Point {
  x: number
  y: number
}

export function nodeCenter(spec: DiagramNodeSpec): Point {
  return {
    x: spec.position.x + NODE_WIDTH / 2,
    y: spec.position.y + NODE_HEIGHT / 2,
  }
}

function centerOf(nodes: DiagramNodeSpec[], id: NodeId): Point | null {
  const spec = nodes.find((node) => node.id === id)
  return spec ? nodeCenter(spec) : null
}

/**
 * パケットが図の上を飛ぶ経路。BACnet/IP の通信は同じネットワークを通るので、
 * 送信元 → ネットワーク → 宛先 の順に中継点を挟む。
 * 端点が図に出ていない場合は空配列（＝描かない）。
 */
export function flightWaypoints(
  nodes: DiagramNodeSpec[],
  from: NodeId,
  to: NodeId,
  networkId: NodeId,
): Point[] {
  const start = centerOf(nodes, from)
  const end = centerOf(nodes, to)
  if (!start || !end) return []
  if (from === networkId || to === networkId) return [start, end]

  const via = centerOf(nodes, networkId)
  return via ? [start, via, end] : [start, end]
}

function connects(edge: DiagramEdgeSpec, a: NodeId, b: NodeId): boolean {
  return (
    (edge.source === a && edge.target === b) ||
    (edge.source === b && edge.target === a)
  )
}

/** パケットが通る区間のエッジ id（線を光らせるために使う） */
export function activeEdgeIds(
  edges: DiagramEdgeSpec[],
  from: NodeId,
  to: NodeId,
  networkId: NodeId,
): string[] {
  const legs: [NodeId, NodeId][] =
    from === networkId || to === networkId
      ? [[from, to]]
      : [
          [from, networkId],
          [networkId, to],
        ]

  return edges
    .filter((edge) => legs.some(([a, b]) => connects(edge, a, b)))
    .map((edge) => edge.id)
}
