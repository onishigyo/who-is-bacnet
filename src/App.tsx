import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CaptureEvidenceCard } from './components/CaptureEvidenceCard'
import { ConversationBar } from './components/ConversationBar'
import { ConversationTrack } from './components/ConversationTrack'
import { SectionMenu } from './components/SectionMenu'
import { StageNav } from './components/StageNav'
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
import { bbmdConversations } from './content/conversations-bbmd'
import { AHU_ID, ATTACKER_ID } from './content/diagram'
import { extras } from './content/extras'
import { MAIN_SECTION } from './content/sections'
import { steps } from './content/steps'
import { worlds } from './content/worlds'
import type {
  DeviceState,
  ExtraId,
  NodeId,
  PanelContent,
  StepOrder,
} from './domain/types'
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
import { planFlights, totalFlightMs } from './logic/flight'
import { buildDiagramState, extraContentById, stepByOrder } from './logic/steps'

export default function App() {
  const [order, setOrder] = useState<StepOrder>(1)
  const [activeExtra, setActiveExtra] = useState<ExtraId | null>(null)
  /** 読み物を開いているとき、その中の何枚目を見ているか */
  const [stageIndex, setStageIndex] = useState(0)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [playback, setPlayback] = useState(IDLE_PLAYBACK)
  const panelRef = useRef<HTMLElement>(null)

  const extra = activeExtra ? extraContentById(extras, activeExtra) : null
  const stage = extra ? (extra.stages[stageIndex] ?? extra.stages[0]) : null
  const mainStep = stepByOrder(steps, order)
  const step: PanelContent = stage ?? mainStep
  // world ごとに、図と中継ノードを丸ごと切り替える。読み物では
  // 場面ごとに world そのものが変わる（BBMD あり → BACnet/SC）
  const {
    nodes: worldNodes,
    edges: worldEdges,
    networkNodeId,
    zones: worldZones,
  } = worlds[stage ? stage.world : mainStep.world]
  const allConversations = useMemo(
    () => [
      ...conversations,
      ...scConversations,
      ...mixedConversations,
      ...bbmdConversations,
    ],
    [],
  )

  // 読み物では、ステップの order の代わりに、その場面の段階を使う
  const diagramOrder = stage ? stage.order : order
  const diagram = useMemo(
    () => buildDiagramState(worldNodes, worldEdges, diagramOrder, worldZones),
    [worldNodes, worldEdges, diagramOrder, worldZones],
  )

  const activeConversation = activeConversationId
    ? conversationById(allConversations, activeConversationId)
    : null

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

  /** 読み物を開く。まだどの会話も始めていない状態から見せる */
  const selectExtra = useCallback((id: ExtraId) => {
    setActiveExtra(id)
    setStageIndex(0)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
    panelRef.current?.scrollTo({ top: 0 })
  }, [])

  /** ステップ 1〜7 の側へ戻る（いま見ていたステップのまま） */
  const selectMain = useCallback(() => {
    setActiveExtra(null)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
    panelRef.current?.scrollTo({ top: 0 })
  }, [])

  /** 読み物の中で、見比べる場面を変える */
  const selectStage = useCallback((index: number) => {
    setStageIndex(index)
    setActiveConversationId(null)
    setPlayback(IDLE_PLAYBACK)
  }, [])

  /** その会話を開始し、先頭のまとまりを再生する */
  const startConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    // 全やり取りはトラックに並ぶ。まず先頭を再生してきっかけにする
    setPlayback(playGroup(IDLE_PLAYBACK, 0))
  }, [])

  const inFlight = useMemo(
    () =>
      activeConversation ? flyingMessages(activeConversation, playback) : [],
    [activeConversation, playback],
  )
  /**
   * いま飛んでいるまとまりが飛び終わるまでの時間。区間の数で決まるので、
   * 1 区間だけの返事は短く、何度も中継する転送は長くなる
   */
  const flightMs = useMemo(
    () =>
      totalFlightMs(planFlights(diagram, inFlight, networkNodeId, ATTACKER_ID)),
    [diagram, inFlight, networkNodeId],
  )
  const current = activeConversation
    ? selectedMessages(activeConversation, playback)
    : []
  // 飛行中のまとまりは、飛び終わったところで着地させる（アニメの終わり）
  useEffect(() => {
    if (playback.phase !== 'flying') return
    const timer = setTimeout(() => setPlayback(landGroup), flightMs)
    return () => clearTimeout(timer)
  }, [playback, flightMs])

  const deviceReadouts = useMemo<Record<NodeId, DeviceState>>(() => {
    // 会話のあるステップ（3/4・5/6）で、機器の設定温度を出す。
    // 読み物（BBMD）は機器の状態を扱わないので、ここでは出さない
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
  // 読み物の各場面は、必ず自分の会話を持つ
  const hasConversation = stage ? true : conversationIdFor(order) !== null

  /** 攻撃の会話が指す実験キャプチャ（答え合わせに出す） */
  const activeCaptureId = activeConversation?.captureId
  const activeCapture = [ipCapture, scRejectedCapture].find(
    (capture) => capture.id === activeCaptureId,
  )

  return (
    <div className="app">
      <header className="app__header">
        <SectionMenu
          extras={extras}
          activeExtra={activeExtra}
          onSelectMain={selectMain}
          onSelectExtra={selectExtra}
        />

        <div className="app__brand">
          <h1 className="app__title">Who-Is BACnet?</h1>
          <p className="app__subtitle">
            ビル設備のプロトコル BACnet を、1 枚のネットワーク図の上で理解する
          </p>
        </div>

        {/* いまどの画面にいるかを、常に同じ場所に出す */}
        <div className="app__section">
          <p className="app__section-caption">いま見ている画面</p>
          <p className="app__section-name">
            {extra ? extra.navLabel : MAIN_SECTION.navLabel}
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
              key={stage ? `${activeExtra}-${stage.id}` : `step-${order}`}
              diagram={diagram}
              deviceReadouts={deviceReadouts}
              inFlight={inFlight}
              networkNodeId={networkNodeId}
              attackerId={ATTACKER_ID}
              flightKey={`${activeConversationId ?? 'none'}-${playback.nonce}`}
            />
          </div>

          {hasConversation && (
            <ConversationBar
              current={current}
              nodes={worldNodes}
              attackerId={ATTACKER_ID}
              idle={
                <button
                  type="button"
                  className="play"
                  onClick={() => {
                    const id = stage
                      ? stage.conversationId
                      : conversationIdFor(order)
                    if (id) startConversation(id)
                  }}
                >
                  {stage || order === 3 || order === 5
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
              attackerId={ATTACKER_ID}
              activeIndex={playback.selected}
              nextIndex={
                activeConversation
                  ? nextGroupIndex(activeConversation, playback)
                  : null
              }
              onSelect={play}
              emptyText={
                stage
                  ? '「会話を始める」を押すと、やり取りがここに並びます。下の帯で条件を変えて見比べてください。'
                  : order === 3 || order === 5
                    ? '「会話を始める」を押すと、やり取りがここに並びます。チップを押すと図で再生されます。'
                    : '操作を始めると、やり取りがここに並びます。前のステップと見比べてください。'
              }
            />
          )}

          {extra ? (
            <StageNav
              stages={extra.stages}
              current={stageIndex}
              onChange={selectStage}
            />
          ) : (
            <StepNav steps={steps} current={order} onChange={goToStep} />
          )}
        </div>

        <aside className="app__panel" ref={panelRef}>
          <StepPanel
            step={step}
            eyebrow={stage ? stage.navLabel : `ステップ ${order}`}
          />

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
