import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { NetworkCanvas } from './components/NetworkCanvas'
import { StepNav } from './components/StepNav'
import { StepNotes } from './components/StepNotes'
import { StepPanel } from './components/StepPanel'
import { ipCapture, scRejectedCapture } from './content/captures'
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
  MIXED_ATTACK_CONVERSATION_ID,
  mixedConversations,
} from './content/conversations-mixed'
import {
  BBMD_AFTER_CONVERSATION_ID,
  BBMD_BEFORE_CONVERSATION_ID,
  bbmdConversations,
} from './content/conversations-bbmd'
import { AHU_ID, ATTACKER_ID } from './content/diagram'
import { BBMD_AFTER, BBMD_BEFORE } from './content/diagram-bbmd'
import { extras } from './content/extras'
import { steps } from './content/steps'
import { worlds } from './content/worlds'
import type { DeviceState, ExtraId, NodeId, StepOrder } from './domain/types'
import { deviceFrom } from './logic/device'
import {
  conversationById,
  flyingMessages,
  highlightedFrames,
  IDLE_PLAYBACK,
  landGroup,
  messageGroups,
  messagesUpToGroup,
  nextGroupIndex,
  playGroup,
  selectedMessages,
} from './logic/conversation'
import { buildDiagramState, extraContentById, stepByOrder } from './logic/steps'

/** パケットが図の上を飛ぶ時間。目で追える速さにしている */
const FLIGHT_MS = 1800

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeExtra, setActiveExtra] = useState<ExtraId | null>(null)
  /** BBMD 番外編だけが持つ、Before/After の内部段階（線の有無を切り替える） */
  const [bbmdStage, setBbmdStage] = useState<StepOrder>(BBMD_BEFORE)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
  const panelRef = useRef<HTMLElement>(null)

  const step = activeExtra
    ? extraContentById(extras, activeExtra)
    : stepByOrder(steps, order)
  // world ごとに、図と中継ノードを丸ごと切り替える
  const {
    nodes: worldNodes,
    edges: worldEdges,
    networkNodeId,
  } = worlds[step.world]
  const allConversations = useMemo(
    () => [
      ...conversations,
      ...scConversations,
      ...mixedConversations,
      ...bbmdConversations,
    ],
    [],
  )

  // 番外編（BBMD）だけ、本編の order の代わりに内部の Before/After 段階を使う
  const diagramOrder = activeExtra ? bbmdStage : order
  const diagram = useMemo(
    () => buildDiagramState(worldNodes, worldEdges, diagramOrder),
    [worldNodes, worldEdges, diagramOrder],
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
    setActiveExtra(null)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
    // 別のステップの解説は、先頭から読み始められるようにする
    panelRef.current?.scrollTo({ top: 0 })
  }, [])

  /** 番外編を選ぶ。まだどちらの会話も始めていない状態から見せる */
  const selectExtra = useCallback((id: ExtraId) => {
    setActiveExtra(id)
    setBbmdStage(BBMD_BEFORE)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
    panelRef.current?.scrollTo({ top: 0 })
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
    // 会話のあるステップ（IP 編 3/4・SC 編 5/6）で、機器の設定温度を出す。
    // 番外編（BBMD）は機器の状態を扱わないので、ここでは出さない
    if (activeExtra || order < 3 || order > 6) return {}
    // いま選んでいるまとまりまでの、その時点の機器状態を出す
    const upto =
      activeConversation && playback.selected !== null
        ? messagesUpToGroup(activeConversation, playback.selected)
        : []
    return { [AHU_ID]: deviceFrom(upto, ATTACKER_ID) }
  }, [activeExtra, order, activeConversation, playback.selected])

  /** その order に会話があるなら、その id を返す（本編のみ） */
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
      case 7:
        return MIXED_ATTACK_CONVERSATION_ID
      default:
        return null
    }
  }
  // 番外編（BBMD）は Before/After の 2 つの会話を常に持つ
  const hasConversation = activeExtra ? true : conversationIdFor(order) !== null

  /** 攻撃の会話が指す実験キャプチャ（答え合わせに出す） */
  const activeCaptureId = activeConversation?.captureId
  const activeCapture = [ipCapture, scRejectedCapture].find(
    (capture) => capture.id === activeCaptureId,
  )

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
              key={activeExtra ?? order}
              diagram={diagram}
              deviceReadouts={deviceReadouts}
              inFlight={inFlight}
              networkNodeId={networkNodeId}
              attackerId={ATTACKER_ID}
              flightKey={`${activeConversationId ?? 'none'}-${playback.nonce}`}
              durationMs={FLIGHT_MS}
            />
          </div>

          {hasConversation && (
            <ConversationBar
              current={current}
              nodes={worldNodes}
              attackerId={ATTACKER_ID}
              idle={
                activeExtra ? (
                  <div className="bbmd-choices">
                    <button
                      type="button"
                      className="play"
                      onClick={() => {
                        setBbmdStage(BBMD_BEFORE)
                        startConversation(BBMD_BEFORE_CONVERSATION_ID)
                      }}
                    >
                      ① BBMD なしで探す
                    </button>
                    <button
                      type="button"
                      className="play"
                      onClick={() => {
                        setBbmdStage(BBMD_AFTER)
                        startConversation(BBMD_AFTER_CONVERSATION_ID)
                      }}
                    >
                      ② BBMD を設置してから探す
                    </button>
                  </div>
                ) : (
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
                )
              }
            />
          )}

          {hasConversation && (
            <ConversationTrack
              groups={
                activeConversation ? messageGroups(activeConversation) : []
              }
              nodes={worldNodes}
              attackerId={ATTACKER_ID}
              activeIndex={playback.selected}
              nextIndex={
                activeConversation
                  ? nextGroupIndex(activeConversation, playback)
                  : null
              }
              onSelect={play}
              emptyText={
                activeExtra
                  ? '上のボタンを押すと、やり取りがここに並びます。'
                  : order === 3 || order === 5
                    ? '「会話を始める」を押すと、やり取りがここに並びます。チップを押すと図で再生されます。'
                    : '操作を始めると、やり取りがここに並びます。前のステップと見比べてください。'
              }
            />
          )}

          <StepNav
            steps={steps}
            current={order}
            onChange={goToStep}
            extras={extras}
            activeExtra={activeExtra}
            onSelectExtra={selectExtra}
          />
        </div>

        <aside className="app__panel" ref={panelRef}>
          <StepPanel step={step} />

          {!activeExtra && (order === 1 || order === 2 || order === 5) && (
            <StepNotes notes={step.notes} />
          )}

          {/* 攻撃（ステップ4・6）を始めた時点から、その会話の実験キャプチャを出し、選んでいる行を光らせる */}
          {activeCapture && (
            <CaptureEvidenceCard
              capture={activeCapture}
              highlight={highlightedFrames(
                activeConversation,
                current,
                activeCapture.id,
              )}
            />
          )}

          {(activeExtra || (order !== 1 && order !== 2 && order !== 5)) && (
            <StepNotes notes={step.notes} />
          )}
        </aside>
      </main>
    </div>
  )
}
