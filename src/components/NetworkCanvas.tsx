import {
  Background,
  Controls,
  ReactFlow,
  useReactFlow,
  ViewportPortal,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo, type CSSProperties } from 'react'
import { NETWORK_NODE_ID } from '../content/diagram'
import type {
  ConversationMessage,
  DeviceState,
  DiagramState,
  NodeId,
} from '../domain/types'
import { activeEdgeIds, flightWaypoints, type Point } from '../logic/layout'
import { BacnetNode, type BacnetFlowNode } from './nodes/BacnetNode'

const nodeTypes: NodeTypes = { bacnet: BacnetNode }

const FIT_VIEW_OPTIONS = { padding: 0.18 }

/** 画面幅が変わっても図全体が見えるようにする（ReactFlow の内側でのみ使える） */
function FitViewOnResize() {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const refit = () => void fitView(FIT_VIEW_OPTIONS)
    window.addEventListener('resize', refit)
    return () => window.removeEventListener('resize', refit)
  }, [fitView])
  return null
}

interface Props {
  diagram: DiagramState
  /** 値を表示させたい機器の id → 状態 */
  deviceReadouts: Record<NodeId, DeviceState>
  /** いま飛んでいるメッセージ（なければ null） */
  inFlight: ConversationMessage | null
  /** 飛ぶ区間 */
  flight: { from: NodeId; to: NodeId } | null
  /** アニメーションをやり直すためのキー */
  flightKey: string
  durationMs: number
}

/** 2点しかない経路でも同じ keyframes を使えるよう、中継点を補う */
function withMidpoint(points: Point[]): [Point, Point, Point] | null {
  if (points.length >= 3)
    return [points[0], points[1], points[points.length - 1]]
  if (points.length === 2) {
    const [a, b] = points
    return [a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, b]
  }
  return null
}

export function NetworkCanvas({
  diagram,
  deviceReadouts,
  inFlight,
  flight,
  flightKey,
  durationMs,
}: Props) {
  const nodes: BacnetFlowNode[] = useMemo(
    () =>
      diagram.nodes.map((spec) => ({
        id: spec.id,
        type: 'bacnet' as const,
        position: spec.position,
        draggable: false,
        data: {
          spec,
          showIp: diagram.showIp,
          speaking: inFlight?.from === spec.id,
          device: deviceReadouts[spec.id] ?? null,
        },
      })),
    [diagram, deviceReadouts, inFlight],
  )

  const litEdges = useMemo(
    () =>
      flight
        ? activeEdgeIds(diagram.edges, flight.from, flight.to, NETWORK_NODE_ID)
        : [],
    [diagram.edges, flight],
  )

  const edges: Edge[] = useMemo(
    () =>
      diagram.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'straight',
        animated: litEdges.includes(edge.id),
        className: litEdges.includes(edge.id) ? 'link is-active' : 'link',
      })),
    [diagram.edges, litEdges],
  )

  const path = flight
    ? withMidpoint(
        flightWaypoints(diagram.nodes, flight.from, flight.to, NETWORK_NODE_ID),
      )
    : null

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesFocusable={false}
      minZoom={0.6}
      maxZoom={1.4}
      /* 狭い画面では図を縮めきらず、指でスクロール・移動できるようにする */
      preventScrolling={false}
      className="canvas"
    >
      <FitViewOnResize />
      <Background gap={28} size={1} />
      <Controls showInteractive={false} />

      {inFlight && path && (
        <ViewportPortal>
          <div
            key={flightKey}
            className={`packet packet--${inFlight.kind}`}
            style={
              {
                '--x0': `${path[0].x}px`,
                '--y0': `${path[0].y}px`,
                '--x1': `${path[1].x}px`,
                '--y1': `${path[1].y}px`,
                '--x2': `${path[2].x}px`,
                '--y2': `${path[2].y}px`,
                animationDuration: `${durationMs}ms`,
              } as CSSProperties
            }
          >
            <div className="packet__bubble">
              <span className="packet__plain">{inFlight.plain}</span>
              <code className="packet__protocol">{inFlight.protocol}</code>
            </div>
          </div>
        </ViewportPortal>
      )}
    </ReactFlow>
  )
}
