import { useCallback, useEffect, useMemo, useState } from 'react'
import { AttackConsole } from './components/AttackConsole'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { NetworkCanvas } from './components/NetworkCanvas'
import { StepNav } from './components/StepNav'
import { StepNotes } from './components/StepNotes'
import { StepPanel } from './components/StepPanel'
import { captures } from './content/captures'
import {
  attackActions,
  conversations,
  NORMAL_CONVERSATION_ID,
} from './content/conversations'
import {
  AHU_ID,
  diagramEdges,
  diagramNodes,
  NETWORK_NODE_ID,
} from './content/diagram'
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
  broadcastTargets,
  canSendNext,
  conversationById,
  currentMessage,
  flightPath,
  IDLE_PLAYBACK,
  inFlightMessage,
  isBroadcast,
  isPlaybackFinished,
} from './logic/conversation'
import { buildDiagramState, stepByOrder } from './logic/steps'

/** パケットが図の上を飛ぶ時間。目で追える速さにしている */
const FLIGHT_MS = 1800
/** 着信してから次を送り出すまでの間。解説を読む時間 */
const DWELL_MS = 2400
/** 会話を始めてから 1 通目が出るまでの間。待たせない */
const START_MS = 500

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [activeActionId, setActiveActionId] = useState<AttackActionId | null>(
    null,
  )
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
  /** 既定は自動で進む。読みたいところで止められる */
  const [autoPlay, setAutoPlay] = useState(true)
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
   * 時間の面倒を見るだけの層。進め方の判断はロジック側にある。
   * 飛んでいるパケットは必ず着信させ、そのあと自動で進む設定なら
   * 解説を読む間をおいて次を送り出す。止めていれば、そこで待つ。
   */
  useEffect(() => {
    if (!activeConversation) return

    if (playback.inFlight !== null) {
      const landing = inFlightMessage(playback, activeConversation)
      const timer = setTimeout(() => {
        const next = advancePlayback(playback, activeConversation)
        setPlayback(next)
        if (landing) {
          setTranscript((current) => [...current, landing])
          setReviewId(null)
        }
        if (next.status === 'finished' && activeActionId) {
          setAttack((current) =>
            runAction(attackActions, current, activeActionId),
          )
        }
      }, FLIGHT_MS)
      return () => clearTimeout(timer)
    }

    if (!autoPlay || !canSendNext(playback, activeConversation)) return

    const timer = setTimeout(
      () => {
        setPlayback((current) => advancePlayback(current, activeConversation))
      },
      playback.delivered === 0 ? START_MS : DWELL_MS,
    )
    return () => clearTimeout(timer)
  }, [playback, activeConversation, activeActionId, autoPlay])

  const sendNext = useCallback(() => {
    if (!activeConversation) return
    // 手動で送ったら、そこからは止めたままにする
    setAutoPlay(false)
    setReviewId(null)
    setPlayback((current) => advancePlayback(current, activeConversation))
  }, [activeConversation])

  const toggleAuto = useCallback(() => {
    setReviewId(null)
    setAutoPlay((current) => !current)
  }, [])

  /** 過去のやり取りを選んだら、そこで止めて読み直す */
  const reviewMessage = useCallback((id: string) => {
    setAutoPlay(false)
    setReviewId(id)
  }, [])

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
    setAutoPlay(true)
    setReviewId(null)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
    setActiveActionId(null)
    setActiveConversationId(NORMAL_CONVERSATION_ID)
  }, [])

  const runAttack = useCallback((id: AttackActionId) => {
    const action = attackActions.find((a) => a.id === id)
    if (!action) return
    setAutoPlay(true)
    setReviewId(null)
    setPlayback(IDLE_PLAYBACK)
    setActiveActionId(id)
    setActiveConversationId(action.conversationId)
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
    ? inFlightMessage(playback, activeConversation)
    : null
  const flight = inFlight ? flightPath(inFlight, NETWORK_NODE_ID) : null
  // ブロードキャストは、ネットワークに着いてから図にいる全員へ広がる
  const fanOut =
    inFlight && isBroadcast(inFlight.to)
      ? broadcastTargets(diagram.nodes, inFlight.from, NETWORK_NODE_ID)
      : []
  const liveMessage = activeConversation
    ? currentMessage(playback, activeConversation)
    : null
  // トラックから選んでいるときは、そのメッセージを帯に出す
  const reviewed = reviewId
    ? (transcript.find((message) => message.id === reviewId) ?? null)
    : null
  const current = reviewed ?? liveMessage
  const reviewing = reviewed !== null
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
              flight={flight}
              fanOut={fanOut}
              flightKey={`${activeConversationId ?? 'none'}-${playback.inFlight ?? -1}`}
              durationMs={FLIGHT_MS}
            />
          </div>

          {order >= 3 && (
            <ConversationBar
              conversation={activeConversation}
              playback={playback}
              current={current}
              nodes={diagramNodes}
              autoPlay={autoPlay}
              onToggleAuto={toggleAuto}
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
              activeId={current?.id ?? null}
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
              {attack.completed.length > 0 &&
                captures.map((capture) => (
                  <CaptureEvidenceCard key={capture.id} capture={capture} />
                ))}
              <StepNotes notes={step.notes} />
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
