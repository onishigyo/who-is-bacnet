import { useCallback, useEffect, useMemo, useState } from 'react'
import { AttackConsole } from './components/AttackConsole'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationLog } from './components/ConversationLog'
import { NetworkCanvas } from './components/NetworkCanvas'
import { PlaybackControls } from './components/PlaybackControls'
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
        if (landing) setTranscript((current) => [...current, landing])
        if (next.status === 'finished' && activeActionId) {
          setAttack((current) =>
            runAction(attackActions, current, activeActionId),
          )
        }
      }, FLIGHT_MS)
      return () => clearTimeout(timer)
    }

    if (!autoPlay || !canSendNext(playback, activeConversation)) return

    const timer = setTimeout(() => {
      setPlayback((current) => advancePlayback(current, activeConversation))
    }, DWELL_MS)
    return () => clearTimeout(timer)
  }, [playback, activeConversation, activeActionId, autoPlay])

  const sendNext = useCallback(() => {
    if (!activeConversation) return
    // 手動で送ったら、そこからは止めたままにする
    setAutoPlay(false)
    setPlayback((current) => advancePlayback(current, activeConversation))
  }, [activeConversation])

  const toggleAuto = useCallback(() => setAutoPlay((current) => !current), [])

  const goToStep = useCallback((next: StepOrder) => {
    setOrder(next)
    setActiveConversationId(null)
    setActiveActionId(null)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
  }, [])

  const startNormalConversation = useCallback(() => {
    setAutoPlay(true)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
    setActiveActionId(null)
    setActiveConversationId(NORMAL_CONVERSATION_ID)
  }, [])

  const runAttack = useCallback((id: AttackActionId) => {
    const action = attackActions.find((a) => a.id === id)
    if (!action) return
    setAutoPlay(true)
    setPlayback(IDLE_PLAYBACK)
    setActiveActionId(id)
    setActiveConversationId(action.conversationId)
  }, [])

  const resetAttack = useCallback(() => {
    setAttack(initialAttackState())
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
  const current = activeConversation
    ? currentMessage(playback, activeConversation)
    : null
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
        <h1 className="app__title">Who-Is BACnet?</h1>
        <p className="app__subtitle">
          ビル設備のプロトコル BACnet を、1 枚のネットワーク図の上で理解する
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
          <StepNav steps={steps} current={order} onChange={goToStep} />
        </div>

        <aside className="app__panel">
          <StepPanel step={step} />

          {order < 3 && <StepNotes notes={step.notes} />}

          {order === 3 && (
            <>
              {(!activeConversation || !busy) && (
                <button
                  type="button"
                  className="play"
                  onClick={startNormalConversation}
                >
                  {activeConversation ? 'もう一度、最初から' : '会話を始める'}
                </button>
              )}
              {activeConversation && (
                <PlaybackControls
                  conversation={activeConversation}
                  playback={playback}
                  current={current}
                  nodes={diagramNodes}
                  autoPlay={autoPlay}
                  onToggleAuto={toggleAuto}
                  onSend={sendNext}
                />
              )}
              <ConversationLog
                title="ここまでの会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="「会話を始める」を押すと、中央監視と機器のやり取りが流れます。"
              />
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
              {activeConversation && (
                <PlaybackControls
                  conversation={activeConversation}
                  playback={playback}
                  current={current}
                  nodes={diagramNodes}
                  autoPlay={autoPlay}
                  onToggleAuto={toggleAuto}
                  onSend={sendNext}
                />
              )}
              <ConversationLog
                title="ここまでの会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="コンソールの操作を選ぶと、やり取りが流れます。ステップ3の会話と見比べてください。"
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

      <footer className="app__footer">
        <p>
          このアプリはブラウザ内だけで動く再現です。実際の BACnet
          通信は発生しません。
          防御を学ぶための教材であり、許可のないシステムへの操作を推奨するものではありません。
        </p>
      </footer>
    </div>
  )
}
