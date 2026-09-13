import { useCallback, useEffect, useMemo, useState } from 'react'
import { AttackConsole } from './components/AttackConsole'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationLog } from './components/ConversationLog'
import { NetworkCanvas } from './components/NetworkCanvas'
import { PlaybackControls } from './components/PlaybackControls'
import { StepNav } from './components/StepNav'
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
const FLIGHT_MS = 2200

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [activeActionId, setActiveActionId] = useState<AttackActionId | null>(
    null,
  )
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
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
   * 進むのは利用者がボタンを押したときだけ。
   * タイマーが面倒を見るのは「飛んでいるパケットを着信させる」ところだけで、
   * 着信したらそこで止まり、次は押されるまで送らない。
   */
  useEffect(() => {
    if (!activeConversation || playback.inFlight === null) return

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
  }, [playback, activeConversation, activeActionId])

  const sendNext = useCallback(() => {
    if (!activeConversation) return
    setPlayback((current) => advancePlayback(current, activeConversation))
  }, [activeConversation])

  const goToStep = useCallback((next: StepOrder) => {
    setOrder(next)
    setActiveConversationId(null)
    setActiveActionId(null)
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
  }, [])

  const startNormalConversation = useCallback(() => {
    setPlayback(IDLE_PLAYBACK)
    setTranscript([])
    setActiveActionId(null)
    setActiveConversationId(NORMAL_CONVERSATION_ID)
  }, [])

  const runAttack = useCallback((id: AttackActionId) => {
    const action = attackActions.find((a) => a.id === id)
    if (!action) return
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
                  onSend={sendNext}
                />
              )}
              <ConversationLog
                title="ここまでの会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="「会話を始める」を押すと、中央監視と機器のやり取りを 1 通ずつ送れます。"
              />
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
                  onSend={sendNext}
                />
              )}
              <ConversationLog
                title="ここまでの会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="コンソールの操作を選ぶと、やり取りを 1 通ずつ送れます。ステップ3の会話と見比べてください。"
              />
              {attack.completed.length > 0 &&
                captures.map((capture) => (
                  <CaptureEvidenceCard key={capture.id} capture={capture} />
                ))}
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
