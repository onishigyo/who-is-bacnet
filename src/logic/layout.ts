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

/** 配線（エッジ）から、双方向の隣接リストを作る */
function neighborsOf(edges: DiagramEdgeSpec[]): Map<NodeId, NodeId[]> {
  const neighbors = new Map<NodeId, NodeId[]>()
  const link = (a: NodeId, b: NodeId) => {
    const list = neighbors.get(a) ?? []
    list.push(b)
    neighbors.set(a, list)
  }
  for (const edge of edges) {
    link(edge.source, edge.target)
    link(edge.target, edge.source)
  }
  return neighbors
}

/**
 * 配線（エッジ）をたどった、from → to の最短のノード列。
 * BFS なので経路は一意でなくてよい。繋がっていなければ空配列。
 */
export function nodePath(
  edges: DiagramEdgeSpec[],
  from: NodeId,
  to: NodeId,
): NodeId[] {
  if (from === to) return [from]
  const neighbors = neighborsOf(edges)

  const prev = new Map<NodeId, NodeId>()
  const seen = new Set<NodeId>([from])
  let frontier: NodeId[] = [from]
  while (frontier.length > 0) {
    const next: NodeId[] = []
    for (const node of frontier) {
      for (const neighbor of neighbors.get(node) ?? []) {
        if (seen.has(neighbor)) continue
        seen.add(neighbor)
        prev.set(neighbor, node)
        if (neighbor === to) {
          const path = [to]
          let step = to
          while (step !== from) {
            step = prev.get(step)!
            path.unshift(step)
          }
          return path
        }
        next.push(neighbor)
      }
    }
    frontier = next
  }
  return []
}

/**
 * パケットが図の上を飛ぶ経路。配線をたどって、送信元 → …中継… → 宛先 の
 * 各ノードの中心を返す。端点が図に出ていない、または繋がっていなければ空配列。
 */
export function flightWaypoints(
  nodes: DiagramNodeSpec[],
  edges: DiagramEdgeSpec[],
  from: NodeId,
  to: NodeId,
  networkId: NodeId,
): Point[] {
  if (!centerOf(nodes, from) || !centerOf(nodes, to)) return []

  const path = nodePath(edges, from, to)
  if (path.length === 0) {
    // 配線がたどれないときは、従来どおり中継点を挟む
    const start = centerOf(nodes, from)!
    const end = centerOf(nodes, to)!
    if (from === networkId || to === networkId) return [start, end]
    const via = centerOf(nodes, networkId)
    return via ? [start, via, end] : [start, end]
  }
  return path
    .map((id) => centerOf(nodes, id))
    .filter((point): point is Point => point !== null)
}

/**
 * 経路（2 点以上）を、CSS の offset-path で使える SVG パス文字列にする。
 * "M x0 y0 L x1 y1 L x2 y2 …" の形で、何ホップの経路でも折れ線をそのまま
 * なぞれる（3 点固定の keyframes では、中継点の一部が無視されてしまうため）。
 * 2 点未満は描けないので undefined。
 */
export function toOffsetPath(points: Point[]): string | undefined {
  if (points.length < 2) return undefined
  const [head, ...rest] = points
  const lineTo = rest.map((p) => `L ${p.x} ${p.y}`).join(' ')
  return `M ${head.x} ${head.y} ${lineTo}`
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
  const path = nodePath(edges, from, to)
  const legs: [NodeId, NodeId][] =
    path.length >= 2
      ? path.slice(1).map((node, i) => [path[i], node])
      : from === networkId || to === networkId
        ? [[from, to]]
        : [
            [from, networkId],
            [networkId, to],
          ]

  return edges
    .filter((edge) => legs.some(([a, b]) => connects(edge, a, b)))
    .map((edge) => edge.id)
}
