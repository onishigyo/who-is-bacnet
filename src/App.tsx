import { useCallback, useEffect, useMemo, useState } from 'react'
import { AttackConsole } from './components/AttackConsole'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationLog } from './components/ConversationLog'
import { NetworkCanvas } from './components/NetworkCanvas'
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
  conversationById,
  deliveredMessages,
  flightPath,
  IDLE_PLAYBACK,
  inFlightMessage,
} from './logic/conversation'
import { buildDiagramState, stepByOrder } from './logic/steps'

/** パケットが図の上を飛ぶ時間 */
const FLIGHT_MS = 1400
/** 着信してから次のメッセージを送り出すまでの間 */
const PAUSE_MS = 500
/** 再生ボタンを押してから 1 通目が飛び出すまでの間 */
const START_MS = 250

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [activeActionId, setActiveActionId] = useState<AttackActionId | null>(
    null,
  )
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
  const [normalPlayed, setNormalPlayed] = useState(false)
  const [attack, setAttack] = useState(initialAttackState)

  const step = stepByOrder(steps, order)
  const diagram = useMemo(
    () => buildDiagramState(diagramNodes, diagramEdges, order),
    [order],
  )

  const activeConversation = activeConversationId
    ? conversationById(conversations, activeConversationId)
    : null

  // 会話が終わったときの後始末（結果を状態に反映して、再生を止める）
  const finishConversation = useCallback(() => {
    if (activeActionId) {
      setAttack((current) => runAction(attackActions, current, activeActionId))
    }
    if (activeConversationId === NORMAL_CONVERSATION_ID) {
      setNormalPlayed(true)
    }
    setActiveActionId(null)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
  }, [activeActionId, activeConversationId])

  // 会話を 1 コマずつ進める。進め方の判断はロジック層、ここは時間を与えるだけ
  useEffect(() => {
    if (!activeConversation || playback.status === 'finished') return
    const delay =
      playback.inFlight !== null
        ? FLIGHT_MS
        : playback.status === 'idle'
          ? START_MS
          : PAUSE_MS

    const timer = setTimeout(() => {
      const next = advancePlayback(playback, activeConversation)
      if (next.status === 'finished') {
        finishConversation()
      } else {
        setPlayback(next)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [playback, activeConversation, finishConversation])

  const goToStep = useCallback((next: StepOrder) => {
    setOrder(next)
    setActiveConversationId(null)
    setActiveActionId(null)
    setPlayback(IDLE_PLAYBACK)
  }, [])

  const playNormal = useCallback(() => {
    setNormalPlayed(false)
    setPlayback(IDLE_PLAYBACK)
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
  }, [])

  const inFlight = activeConversation
    ? inFlightMessage(playback, activeConversation)
    : null
  const flight = inFlight ? flightPath(inFlight, NETWORK_NODE_ID) : null
  const busy = activeConversationId !== null

  // ログに出す会話。済んだ会話はまるごと、再生中の会話は着信した分だけ
  const transcript = useMemo<ConversationMessage[]>(() => {
    const finishedIds =
      order === 4
        ? attack.completed.map(
            (id) =>
              attackActions.find((action) => action.id === id)!.conversationId,
          )
        : normalPlayed
          ? [NORMAL_CONVERSATION_ID]
          : []

    return [
      ...finishedIds.flatMap(
        (id) => conversationById(conversations, id).messages,
      ),
      ...(activeConversation
        ? deliveredMessages(playback, activeConversation)
        : []),
    ]
  }, [order, attack.completed, normalPlayed, activeConversation, playback])

  const deviceReadouts = useMemo<Record<NodeId, DeviceState>>(() => {
    if (order < 3) return {}
    return { [AHU_ID]: order === 4 ? attack.device : INITIAL_DEVICE }
  }, [order, attack.device])

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Who is BACnet?</h1>
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
              <button
                type="button"
                className="play"
                onClick={playNormal}
                disabled={busy}
              >
                {busy
                  ? '再生中…'
                  : normalPlayed
                    ? 'もう一度再生する'
                    : '会話を再生する'}
              </button>
              <ConversationLog
                title="流れている会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="「会話を再生する」を押すと、中央監視と機器のやり取りがここに並びます。"
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
              <ConversationLog
                title="流れている会話"
                messages={transcript}
                nodes={diagramNodes}
                emptyText="コンソールの操作を実行すると、やり取りがここに並びます。ステップ3の会話と見比べてください。"
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
