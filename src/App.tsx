import { useCallback, useEffect, useMemo, useState } from 'react'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { NetworkCanvas } from './components/NetworkCanvas'
import { StepNav } from './components/StepNav'
import { StepNotes } from './components/StepNotes'
import { StepPanel } from './components/StepPanel'
import { ipCapture } from './content/captures'
import {
  ATTACK_CONVERSATION_ID,
  conversations,
  NORMAL_CONVERSATION_ID,
} from './content/conversations'
import {
  AHU_ID,
  ATTACKER_ID,
  diagramEdges,
  diagramNodes,
} from './content/diagram'
import { steps } from './content/steps'
import type {
  ConversationMessage,
  DeviceState,
  NodeId,
  StepOrder,
} from './domain/types'
import { deviceFrom } from './logic/device'
import {
  advancePlayback,
  conversationById,
  currentGroup,
  groupOf,
  IDLE_PLAYBACK,
  inFlightMessages,
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
  /** トラックから選んで見直しているメッセージ */
  const [reviewId, setReviewId] = useState<string | null>(null)
  /** 着信済みのメッセージ。会話をまたいで積み上がる */
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])

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
    }, FLIGHT_MS)

    return () => clearTimeout(timer)
  }, [playback, activeConversation])

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
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
  }, [])

  /** その会話を最初から再生する（ステップ3・4 で共通） */
  const startConversation = useCallback((id: string) => {
    const conversation = conversationById(conversations, id)
    setReviewId(null)
    setTranscript([])
    setActiveConversationId(id)
    // 押したその場で 1 通目を送り出す
    setPlayback(advancePlayback(IDLE_PLAYBACK, conversation))
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
  const deviceReadouts = useMemo<Record<NodeId, DeviceState>>(() => {
    if (order < 3) return {}
    // 着信したやり取りから、機器のいまの状態を組み立てる
    return { [AHU_ID]: deviceFrom(transcript, ATTACKER_ID) }
  }, [order, transcript])

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
                <button
                  type="button"
                  className="play"
                  onClick={() =>
                    startConversation(
                      order === 3
                        ? NORMAL_CONVERSATION_ID
                        : ATTACK_CONVERSATION_ID,
                    )
                  }
                >
                  {activeConversation
                    ? 'もう一度、最初から'
                    : order === 3
                      ? '会話を始める'
                      : '持ち込まれた PC を操作する'}
                </button>
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
                  ? 'ここに、やり取りが積み上がります。押すと読み直せます。'
                  : 'ここに、攻撃者のやり取りが積み上がります。ステップ3と見比べてください。'
              }
            />
          )}

          <StepNav steps={steps} current={order} onChange={goToStep} />
        </div>

        <aside className="app__panel">
          <StepPanel step={step} />

          {order < 3 && <StepNotes notes={step.notes} />}

          {order === 4 && activeConversation && (
            // 攻撃を始めた時点から出し、いま図の上を飛んでいる行を光らせる
            <CaptureEvidenceCard
              capture={ipCapture}
              highlight={current.flatMap((message) =>
                message.frame === undefined ? [] : [message.frame],
              )}
            />
          )}

          {order >= 3 && <StepNotes notes={step.notes} />}
        </aside>
      </main>
    </div>
  )
}
