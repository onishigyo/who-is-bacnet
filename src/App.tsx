import { useCallback, useEffect, useMemo, useState } from 'react'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { NetworkCanvas } from './components/NetworkCanvas'
import { StepNav } from './components/StepNav'
import { StepNotes } from './components/StepNotes'
import { StepPanel } from './components/StepPanel'
import { ipCapture, scCapture } from './content/captures'
import {
  ATTACK_CONVERSATION_ID,
  conversations,
  NORMAL_CONVERSATION_ID,
} from './content/conversations'
import {
  SC_ATTACK_CONVERSATION_ID,
  SC_NORMAL_CONVERSATION_ID,
  scConversations,
} from './content/conversations-sc'
import {
  AHU_ID,
  ATTACKER_ID,
  diagramEdges,
  diagramNodes,
  NETWORK_NODE_ID,
} from './content/diagram'
import { SC_HUB_ID, scDiagramEdges, scDiagramNodes } from './content/diagram-sc'
import { steps } from './content/steps'
import type { DeviceState, NodeId, StepOrder } from './domain/types'
import { deviceFrom } from './logic/device'
import {
  conversationById,
  flyingMessages,
  IDLE_PLAYBACK,
  landGroup,
  messageGroups,
  messagesUpToGroup,
  playGroup,
  selectedMessages,
} from './logic/conversation'
import { buildDiagramState, stepByOrder } from './logic/steps'

/** パケットが図の上を飛ぶ時間。目で追える速さにしている */
const FLIGHT_MS = 1800

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)

  const step = stepByOrder(steps, order)
  const isSc = step.world === 'sc'

  // world ごとに、図・会話・中継ノードを丸ごと切り替える
  const worldNodes = isSc ? scDiagramNodes : diagramNodes
  const worldEdges = isSc ? scDiagramEdges : diagramEdges
  const networkNodeId = isSc ? SC_HUB_ID : NETWORK_NODE_ID
  const allConversations = useMemo(
    () => [...conversations, ...scConversations],
    [],
  )

  const diagram = useMemo(
    () => buildDiagramState(worldNodes, worldEdges, order),
    [worldNodes, worldEdges, order],
  )

  const activeConversation = activeConversationId
    ? conversationById(allConversations, activeConversationId)
    : null

  // 飛行中のまとまりは、一定時間で着地させる（アニメの終わり）
  useEffect(() => {
    if (playback.phase !== 'flying') return
    const timer = setTimeout(() => setPlayback(landGroup), FLIGHT_MS)
    return () => clearTimeout(timer)
  }, [playback])

  /** そのまとまりを図で再生する */
  const play = useCallback((index: number) => {
    setPlayback((current) => playGroup(current, index))
  }, [])

  const goToStep = useCallback((next: StepOrder) => {
    setOrder(next)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
  }, [])

  /** その会話を開始し、先頭のまとまりを再生する */
  const startConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    // 全やり取りはトラックに並ぶ。まず先頭を再生してきっかけにする
    setPlayback(playGroup(IDLE_PLAYBACK, 0))
  }, [])

  const inFlight = activeConversation
    ? flyingMessages(activeConversation, playback)
    : []
  const current = activeConversation
    ? selectedMessages(activeConversation, playback)
    : []
  const deviceReadouts = useMemo<Record<NodeId, DeviceState>>(() => {
    // 会話のあるステップ（IP 編 3/4・SC 編 5/6）で、機器の設定温度を出す
    if (order < 3 || order > 6) return {}
    // いま選んでいるまとまりまでの、その時点の機器状態を出す
    const upto =
      activeConversation && playback.selected !== null
        ? messagesUpToGroup(activeConversation, playback.selected)
        : []
    return { [AHU_ID]: deviceFrom(upto, ATTACKER_ID) }
  }, [order, activeConversation, playback.selected])

  /** その order に会話があるなら、その id を返す */
  const conversationIdFor = (o: StepOrder): string | null => {
    switch (o) {
      case 3:
        return NORMAL_CONVERSATION_ID
      case 4:
        return ATTACK_CONVERSATION_ID
      case 5:
        return SC_NORMAL_CONVERSATION_ID
      case 6:
        return SC_ATTACK_CONVERSATION_ID
      default:
        return null
    }
  }
  const hasConversation = conversationIdFor(order) !== null

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">Who-Is BACnet?</h1>
          <p className="app__subtitle">
            ビル設備のプロトコル BACnet を、1 枚のネットワーク図の上で理解する
          </p>
        </div>

        <p className="app__disclaimer">
          ブラウザ内だけで動く再現です。実際の BACnet 通信は発生しません。
          防御を学ぶための教材であり、許可のないシステムへの操作を推奨するものではありません。
        </p>
      </header>

      <main className="app__main">
        <div className="app__stage">
          <div className="app__canvas">
            <NetworkCanvas
              key={order}
              diagram={diagram}
              deviceReadouts={deviceReadouts}
              inFlight={inFlight}
              networkNodeId={networkNodeId}
              flightKey={`${activeConversationId ?? 'none'}-${playback.nonce}`}
              durationMs={FLIGHT_MS}
            />
          </div>

          {hasConversation && (
            <ConversationBar
              current={current}
              nodes={worldNodes}
              idle={
                <button
                  type="button"
                  className="play"
                  onClick={() => {
                    const id = conversationIdFor(order)
                    if (id) startConversation(id)
                  }}
                >
                  {order === 3 || order === 5
                    ? '会話を始める'
                    : '持ち込まれた PC を操作する'}
                </button>
              }
            />
          )}

          {hasConversation && (
            <ConversationTrack
              groups={
                activeConversation ? messageGroups(activeConversation) : []
              }
              nodes={worldNodes}
              activeIndex={playback.selected}
              onSelect={play}
              emptyText={
                order === 3 || order === 5
                  ? '「会話を始める」を押すと、やり取りがここに並びます。チップを押すと図で再生されます。'
                  : '操作を始めると、やり取りがここに並びます。前のステップと見比べてください。'
              }
            />
          )}

          <StepNav steps={steps} current={order} onChange={goToStep} />
        </div>

        <aside className="app__panel">
          <StepPanel step={step} />

          {(order === 1 || order === 2 || order === 5) && (
            <StepNotes notes={step.notes} />
          )}

          {/* IP 編ステップ4：攻撃を始めた時点から、飛んでいる行を光らせる */}
          {order === 4 && activeConversation && (
            <CaptureEvidenceCard
              capture={ipCapture}
              highlight={current.flatMap((message) =>
                message.frame === undefined ? [] : [message.frame],
              )}
            />
          )}

          {/* SC 編ステップ6：IP（読める）と SC（読めない）を並べる Before/After */}
          {order === 6 && (
            <div className="beforeafter">
              <CaptureEvidenceCard capture={ipCapture} />
              <CaptureEvidenceCard capture={scCapture} />
            </div>
          )}

          {order !== 1 && order !== 2 && order !== 5 && (
            <StepNotes notes={step.notes} />
          )}
        </aside>
      </main>
    </div>
  )
}
