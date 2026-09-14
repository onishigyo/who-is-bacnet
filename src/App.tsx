import { useCallback, useEffect, useMemo, useState } from 'react'
import { AttackConsole } from './components/AttackConsole'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { NetworkCanvas } from './components/NetworkCanvas'
import { StepNav } from './components/StepNav'
import { StepNotes } from './components/StepNotes'
import { StepPanel } from './components/StepPanel'
import { ipCapture } from './content/captures'
import {
  attackActions,
  conversations,
  NORMAL_CONVERSATION_ID,
} from './content/conversations'
import { AHU_ID, diagramEdges, diagramNodes } from './content/diagram'
import { steps } from './content/steps'
import type {
  AttackActionId,
  ConversationMessage,
  DeviceState,
  NodeId,
  StepOrder,
} from './domain/types'
import { INITIAL_DEVICE, initialAttackState, runAction } from './logic/attack'
import {
  advancePlayback,
  conversationById,
  currentGroup,
  groupOf,
  IDLE_PLAYBACK,
  inFlightMessages,
  isPlaybackFinished,
} from './logic/conversation'
import { buildDiagramState, stepByOrder } from './logic/steps'

/** パケットが図の上を飛ぶ時間。目で追える速さにしている */
const FLIGHT_MS = 1800

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [activeActionId, setActiveActionId] = useState<AttackActionId | null>(
    null,
  )
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
  /** トラックから選んで見直しているメッセージ */
  const [reviewId, setReviewId] = useState<string | null>(null)
  /** 着信済みのメッセージ。会話をまたいで積み上がる */
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])
  const [attack, setAttack] = useState(initialAttackState)

  const step = stepByOrder(steps, order)
  const diagram = useMemo(
    () => buildDiagramState(diagramNodes, diagramEdges, order),
    [order],
  )

  const activeConversation = activeConversationId
    ? conversationById(conversations, activeConversationId)
    : null

  /**
   * 時間の面倒を見るだけの層。進むのは利用者が押したときだけで、
   * タイマーは「飛んでいるパケットを着信させる」ところだけを受け持つ。
   */
  useEffect(() => {
    if (!activeConversation) return

    if (playback.inFlightGroup === null) return

    const landing = inFlightMessages(playback, activeConversation)
    const timer = setTimeout(() => {
      const next = advancePlayback(playback, activeConversation)
      setPlayback(next)
      if (landing.length > 0) {
        setTranscript((current) => [...current, ...landing])
        setReviewId(null)
      }
      if (next.status === 'finished' && activeActionId) {
        setAttack((current) =>
          runAction(attackActions, current, activeActionId),
        )
      }
    }, FLIGHT_MS)

    return () => clearTimeout(timer)
  }, [playback, activeConversation, activeActionId])

  const sendNext = useCallback(() => {
    if (!activeConversation) return
    setReviewId(null)
    setPlayback((current) => advancePlayback(current, activeConversation))
  }, [activeConversation])

  /** 過去のやり取りを選んで読み直す */
  const reviewMessage = useCallback((id: string) => setReviewId(id), [])

  const exitReview = useCallback(() => setReviewId(null), [])

  const goToStep = useCallback((next: StepOrder) => {
    setOrder(next)
    setReviewId(null)
    setActiveConversationId(null)
    setActiveActionId(null)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
  }, [])

  const startNormalConversation = useCallback(() => {
    const conversation = conversationById(conversations, NORMAL_CONVERSATION_ID)
    setReviewId(null)
    setTranscript([])
    setActiveActionId(null)
    setActiveConversationId(NORMAL_CONVERSATION_ID)
    // 押したその場で 1 通目を送り出す
    setPlayback(advancePlayback(IDLE_PLAYBACK, conversation))
  }, [])

  const runAttack = useCallback((id: AttackActionId) => {
    const action = attackActions.find((a) => a.id === id)
    if (!action) return
    const conversation = conversationById(conversations, action.conversationId)
    setReviewId(null)
    setActiveActionId(id)
    setActiveConversationId(action.conversationId)
    setPlayback(advancePlayback(IDLE_PLAYBACK, conversation))
  }, [])

  const resetAttack = useCallback(() => {
    setAttack(initialAttackState())
    setReviewId(null)
    setActiveConversationId(null)
    setActiveActionId(null)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
  }, [])

  const inFlight = activeConversation
    ? inFlightMessages(playback, activeConversation)
    : []
  const liveGroup = activeConversation
    ? currentGroup(playback, activeConversation)
    : []
  // トラックから選んでいるときは、そのまとまりを帯に出す。
  // まとめて送ったものは、読み直すときもまとめて見せる
  const reviewed = reviewId ? groupOf(transcript, reviewId) : []
  const current = reviewed.length > 0 ? reviewed : liveGroup
  const reviewing = reviewed.length > 0
  /** 会話が途中（送り終えていない）なら、ほかの操作は止めておく */
  const busy = activeConversation
    ? !isPlaybackFinished(playback, activeConversation)
    : false

  const deviceReadouts = useMemo<Record<NodeId, DeviceState>>(() => {
    if (order < 3) return {}
    return { [AHU_ID]: order === 4 ? attack.device : INITIAL_DEVICE }
  }, [order, attack.device])

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
              flightKey={`${activeConversationId ?? 'none'}-${playback.inFlightGroup ?? -1}`}
              durationMs={FLIGHT_MS}
            />
          </div>

          {order >= 3 && (
            <ConversationBar
              conversation={activeConversation}
              playback={playback}
              current={current}
              nodes={diagramNodes}
              onSend={sendNext}
              reviewing={reviewing}
              onExitReview={exitReview}
              idle={
                order === 3 ? (
                  <button
                    type="button"
                    className="play"
                    onClick={startNormalConversation}
                  >
                    {activeConversation ? 'もう一度、最初から' : '会話を始める'}
                  </button>
                ) : (
                  <p className="stagebar__hint">
                    右の「持ち込まれた PC
                    のコンソール」で操作を選ぶと、ここに流れます。
                  </p>
                )
              }
            />
          )}

          {order >= 3 && (
            <ConversationTrack
              messages={transcript}
              nodes={diagramNodes}
              activeIds={current.map((message) => message.id)}
              onSelect={reviewMessage}
              emptyText={
                order === 3
                  ? 'ここに、やり取りが 1 通ずつ積み上がります。押すと読み直せます。'
                  : 'ここに、攻撃者のやり取りが積み上がります。ステップ3と見比べてください。'
              }
            />
          )}

          <StepNav steps={steps} current={order} onChange={goToStep} />
        </div>

        <aside className="app__panel">
          <StepPanel step={step} />

          {order < 3 && <StepNotes notes={step.notes} />}

          {order === 3 && (
            <>
              <StepNotes notes={step.notes} />
            </>
          )}

          {order === 4 && (
            <>
              <AttackConsole
                actions={attackActions}
                state={attack}
                busy={busy}
                onRun={runAttack}
                onReset={resetAttack}
              />
              {/* 最初の 1 通を送った時点から出し、いま飛んでいる行を光らせる */}
              {activeConversation && (
                <CaptureEvidenceCard
                  capture={ipCapture}
                  highlight={current.flatMap((message) =>
                    message.frame === undefined ? [] : [message.frame],
                  )}
                />
              )}
              <StepNotes notes={step.notes} />
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
