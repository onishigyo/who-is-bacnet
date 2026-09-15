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
import type {
  ConversationMessage,
  DeviceState,
  DiagramState,
  NodeId,
} from '../domain/types'
import {
  broadcastTargets,
  flightPath,
  involvesAttacker,
  isBroadcast,
} from '../logic/conversation'
import { activeEdgeIds, flightWaypoints, toOffsetPath } from '../logic/layout'
import { BacnetNode, type BacnetFlowNode } from './nodes/BacnetNode'

const nodeTypes: NodeTypes = { bacnet: BacnetNode }

// 自動フィットでは拡大しすぎない（機器が 1 台だけのステップ1 で巨大になるため）。
// 手動のホイール操作では maxZoom まで寄れる
const FIT_VIEW_OPTIONS = { padding: 0.18, maxZoom: 1.2 }

/**
 * 画面幅が変わっても図全体が見えるようにする（ReactFlow の内側でのみ使える）。
 * ウィンドウの resize だけでなく、下の帯（会話を始めると 88px → 156px に
 * 伸びる）でキャンバス自体の高さが変わったときも再フィットする。そうしないと、
 * 前のフィットのまま領域だけ縮み、図の上下が切れて見える。
 */
function FitViewOnResize() {
  const { fitView } = useReactFlow()

  useEffect(() => {
    const refit = () => void fitView(FIT_VIEW_OPTIONS)
    window.addEventListener('resize', refit)
    return () => window.removeEventListener('resize', refit)
  }, [fitView])

  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('.canvas')
    if (!pane) return
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS))
    })
    observer.observe(pane)
    return () => observer.disconnect()
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
  /** いま飛んでいるメッセージ。まとめて飛ぶものは複数通 */
  inFlight: ConversationMessage[]
  /** ブロードキャストやハブ経由の中継点（IP=スイッチ / SC=ハブ） */
  networkNodeId: NodeId
  /** 攻撃者のノード。これが関わる通信は危険として赤で見せる */
  attackerId: NodeId
  /** アニメーションをやり直すためのキー */
  flightKey: string
  durationMs: number
}

export function NetworkCanvas({
  diagram,
  deviceReadouts,
  inFlight,
  networkNodeId,
  attackerId,
  flightKey,
  durationMs,
}: Props) {
  const narrow = useNarrowScreen()

  /** 飛んでいる 1 通ごとの、経路と広がり先 */
  const flights = useMemo(
    () =>
      inFlight.map((message) => {
        const path = flightPath(message, networkNodeId)
        const fanOut = isBroadcast(message.to)
          ? broadcastTargets(
              diagram.nodes,
              diagram.edges,
              message.from,
              networkNodeId,
            )
          : []
        const broadcasting = fanOut.length > 0
        return {
          message,
          broadcasting,
          danger: involvesAttacker(message, attackerId),
          main: flightWaypoints(
            diagram.nodes,
            diagram.edges,
            path.from,
            path.to,
            networkNodeId,
          ),
          fans: fanOut.map((target) =>
            flightWaypoints(
              diagram.nodes,
              diagram.edges,
              networkNodeId,
              target,
              networkNodeId,
            ),
          ),
          legs: activeEdgeIds(
            diagram.edges,
            path.from,
            path.to,
            networkNodeId,
          ).concat(
            fanOut.flatMap((target) =>
              activeEdgeIds(
                diagram.edges,
                networkNodeId,
                target,
                networkNodeId,
              ),
            ),
          ),
        }
      }),
    [inFlight, diagram, networkNodeId, attackerId],
  )

  const speaking = useMemo(
    () => new Set(inFlight.map((message) => message.from)),
    [inFlight],
  )
  const dangerSpeakers = useMemo(
    () =>
      new Set(
        inFlight
          .filter((message) => involvesAttacker(message, attackerId))
          .map((message) => message.from),
      ),
    [inFlight, attackerId],
  )

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
          speaking: speaking.has(spec.id),
          speakingDanger: dangerSpeakers.has(spec.id),
          device: deviceReadouts[spec.id] ?? null,
        },
      })),
    [diagram, deviceReadouts, speaking, dangerSpeakers],
  )

  const litEdges = useMemo(
    () => new Set(flights.flatMap((flight) => flight.legs)),
    [flights],
  )
  const dangerEdges = useMemo(
    () =>
      new Set(flights.filter((flight) => flight.danger).flatMap((f) => f.legs)),
    [flights],
  )

  const edges: Edge[] = useMemo(
    () =>
      diagram.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'straight',
        animated: litEdges.has(edge.id),
        className: litEdges.has(edge.id)
          ? `link is-active ${dangerEdges.has(edge.id) ? 'is-danger' : ''}`
          : `link ${edge.tone ? `tone-${edge.tone}` : ''}`,
        label: edge.label,
        labelShowBg: Boolean(edge.label),
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      })),
    [diagram.edges, litEdges, dangerEdges],
  )

  /** まとめて飛ぶときは、少しずつずらして出す（重なって読めなくなるため） */
  const stagger =
    flights.length > 1 ? Math.min(160, durationMs / (flights.length * 3)) : 0
  const mainDuration = durationMs - stagger * Math.max(0, flights.length - 1)

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
      minZoom={0.35}
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

      <ViewportPortal>
        {flights.map((flight, index) => {
          const compact = flights.length > 1
          const delay = stagger * index
          const duration = flight.broadcasting
            ? mainDuration * FAN_SPLIT
            : mainDuration

          const mainPath = toOffsetPath(flight.main)

          return (
            <div key={`${flightKey}-${flight.message.id}`}>
              {mainPath && (
                <div
                  className={`packet ${
                    flight.broadcasting ? 'packet--parked' : ''
                  } ${compact ? 'packet--compact' : ''} ${
                    flight.danger ? 'packet--danger' : ''
                  }`}
                  style={
                    {
                      offsetPath: `path('${mainPath}')`,
                      offsetRotate: '0deg',
                      animationDuration: `${duration}ms`,
                      animationDelay: `${delay}ms`,
                    } as CSSProperties
                  }
                >
                  <div className="packet__bubble">
                    {!compact && (
                      <span className="packet__plain">
                        {flight.message.plain}
                      </span>
                    )}
                    <code className="packet__protocol">
                      {flight.message.protocol}
                    </code>
                  </div>
                </div>
              )}

              {flight.fans.map((points, fanIndex) => {
                const fanPath = toOffsetPath(points)
                if (!fanPath) return null
                return (
                  <div
                    key={`fan-${fanIndex}`}
                    className={`packet packet--fan ${
                      flight.danger ? 'packet--danger' : ''
                    }`}
                    style={
                      {
                        offsetPath: `path('${fanPath}')`,
                        offsetRotate: '0deg',
                        animationDuration: `${mainDuration * (1 - FAN_SPLIT)}ms`,
                        animationDelay: `${delay + mainDuration * FAN_SPLIT}ms`,
                      } as CSSProperties
                    }
                  >
                    <div className="packet__bubble packet__bubble--fan">
                      <code className="packet__protocol">
                        {flight.message.protocol}
                      </code>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </ViewportPortal>
    </ReactFlow>
  )
}
