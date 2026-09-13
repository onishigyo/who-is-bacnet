import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useReactFlow,
  ViewportPortal,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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

// 自動フィットでは拡大しすぎない（機器が 1 台だけのステップ1 で巨大になるため）。
// 手動のホイール操作では maxZoom まで寄れる
const FIT_VIEW_OPTIONS = { padding: 0.18, maxZoom: 1.2 }

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

/** ブロードキャストで、ネットワークに着いてから広がり始めるまでの割合 */
const FAN_SPLIT = 0.45

/** 縦積みレイアウトになる幅。ここではページのスクロールを優先する */
const NARROW = '(max-width: 1080px)'

/** 画面幅が狭いかどうか（狭いときはホイールでページを送りたい） */
function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(NARROW)
    const update = (event: MediaQueryListEvent) => setNarrow(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return narrow
}

interface Props {
  diagram: DiagramState
  /** 値を表示させたい機器の id → 状態 */
  deviceReadouts: Record<NodeId, DeviceState>
  /** いま飛んでいるメッセージ（なければ null） */
  inFlight: ConversationMessage | null
  /** 飛ぶ区間 */
  flight: { from: NodeId; to: NodeId } | null
  /** ブロードキャストのとき、ネットワークから先に広がる宛先 */
  fanOut: NodeId[]
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
  fanOut,
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

  const litEdges = useMemo(() => {
    if (!flight) return []
    const ids = activeEdgeIds(
      diagram.edges,
      flight.from,
      flight.to,
      NETWORK_NODE_ID,
    )
    const fanned = fanOut.flatMap((target) =>
      activeEdgeIds(diagram.edges, NETWORK_NODE_ID, target, NETWORK_NODE_ID),
    )
    return [...new Set([...ids, ...fanned])]
  }, [diagram.edges, flight, fanOut])

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

  const narrow = useNarrowScreen()
  const broadcasting = fanOut.length > 0
  const path = flight
    ? withMidpoint(
        flightWaypoints(diagram.nodes, flight.from, flight.to, NETWORK_NODE_ID),
      )
    : null

  // ネットワークから各機器へ広がる分。本体が着いてから動き出す
  const fanPaths = broadcasting
    ? fanOut
        .map((target) => ({
          target,
          path: withMidpoint(
            flightWaypoints(
              diagram.nodes,
              NETWORK_NODE_ID,
              target,
              NETWORK_NODE_ID,
            ),
          ),
        }))
        .filter((fan): fan is { target: NodeId; path: [Point, Point, Point] } =>
          Boolean(fan.path),
        )
    : []

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
      maxZoom={2}
      zoomOnScroll={!narrow}
      /* 広い画面ではホイールで拡大縮小、狭い画面ではページのスクロールを優先する */
      preventScrolling={!narrow}
      className="canvas"
    >
      <FitViewOnResize />
      {/* 方眼紙のように、細かい格子の上に太い格子を重ねる */}
      <Background
        id="fine"
        variant={BackgroundVariant.Lines}
        gap={14}
        lineWidth={1}
        color="#e6ecf2"
      />
      <Background
        id="coarse"
        variant={BackgroundVariant.Lines}
        gap={70}
        lineWidth={1}
        color="#d3dde7"
      />
      <Controls showInteractive={false} />

      {inFlight && path && (
        <ViewportPortal>
          <div
            key={flightKey}
            className={`packet packet--${inFlight.kind} ${
              broadcasting ? 'packet--parked' : ''
            }`}
            style={
              {
                '--x0': `${path[0].x}px`,
                '--y0': `${path[0].y}px`,
                '--x1': `${path[1].x}px`,
                '--y1': `${path[1].y}px`,
                '--x2': `${path[2].x}px`,
                '--y2': `${path[2].y}px`,
                animationDuration: `${broadcasting ? durationMs * FAN_SPLIT : durationMs}ms`,
              } as CSSProperties
            }
          >
            <div className="packet__bubble">
              <span className="packet__plain">{inFlight.plain}</span>
              <code className="packet__protocol">{inFlight.protocol}</code>
            </div>
          </div>

          {fanPaths.map((fan) => (
            <div
              key={`${flightKey}-${fan.target}`}
              className="packet packet--fan"
              style={
                {
                  '--x0': `${fan.path[0].x}px`,
                  '--y0': `${fan.path[0].y}px`,
                  '--x1': `${fan.path[1].x}px`,
                  '--y1': `${fan.path[1].y}px`,
                  '--x2': `${fan.path[2].x}px`,
                  '--y2': `${fan.path[2].y}px`,
                  animationDuration: `${durationMs * (1 - FAN_SPLIT)}ms`,
                  animationDelay: `${durationMs * FAN_SPLIT}ms`,
                } as CSSProperties
              }
            >
              <div className="packet__bubble packet__bubble--fan">
                <code className="packet__protocol">{inFlight.protocol}</code>
              </div>
            </div>
          ))}
        </ViewportPortal>
      )}
    </ReactFlow>
  )
}
