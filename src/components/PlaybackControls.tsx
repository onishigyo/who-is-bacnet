import { useEffect, useRef } from 'react'
import type {
  Conversation,
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
  PlaybackState,
} from '../domain/types'
import { BROADCAST } from '../domain/types'
import {
  canSendNext,
  isPlaybackFinished,
  nextMessage,
  playbackProgress,
} from '../logic/conversation'

interface Props {
  conversation: Conversation
  playback: PlaybackState
  /** いま解説すべきメッセージ */
  current: ConversationMessage | null
  nodes: DiagramNodeSpec[]
  /** 自動で次へ進む状態か */
  autoPlay: boolean
  onToggleAuto: () => void
  onSend: () => void
}

function nameOf(nodes: DiagramNodeSpec[], id: NodeId): string {
  return nodes.find((node) => node.id === id)?.label ?? id
}

/** 次に何が起きるかを、起きる前に読ませる */
function previewOf(
  nodes: DiagramNodeSpec[],
  playback: PlaybackState,
  conversation: Conversation,
): string | null {
  const next = nextMessage(playback, conversation)
  if (!next) return null
  return `${nameOf(nodes, next.from)}が${next.action}`
}

/**
 * 会話の進行と、いま何が起きているかの解説。
 * 既定では自動で進み、読みたいところで止めて 1 通ずつ進められる。
 */
export function PlaybackControls({
  conversation,
  playback,
  current,
  nodes,
  autoPlay,
  onToggleAuto,
  onSend,
}: Props) {
  const { sent, total } = playbackProgress(playback, conversation)
  const finished = isPlaybackFinished(playback, conversation)
  const sendable = canSendNext(playback, conversation)
  const preview = previewOf(nodes, playback, conversation)
  const root = useRef<HTMLElement>(null)

  // 新しいメッセージのたびに、読む場所を視界に入れておく
  useEffect(() => {
    root.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [current?.id, playback.inFlight])

  return (
    <section className="pacer" ref={root}>
      <div className="pacer__head">
        <h3 className="pacer__title">{conversation.title}</h3>
        <span className="pacer__progress">
          {sent} / {total}
        </span>
      </div>

      {current ? (
        <div className={`pacer__now pacer__now--${current.kind}`}>
          <p className="pacer__from">
            {nameOf(nodes, current.from)}
            <span aria-hidden="true"> → </span>
            {current.to === BROADCAST
              ? '全員（ブロードキャスト）'
              : nameOf(nodes, current.to)}
          </p>
          <p className="pacer__plain">{current.plain}</p>
          <code className="pacer__protocol">{current.protocol}</code>
          <code className="pacer__transport">{current.transport}</code>
          <p className="pacer__explain">{current.explain}</p>
        </div>
      ) : (
        <p className="pacer__idle">会話が自動で流れます。</p>
      )}

      {finished ? (
        <p className="pacer__done">この会話はここまで</p>
      ) : (
        <div className="pacer__controls">
          <button
            type="button"
            className="pacer__toggle"
            onClick={onToggleAuto}
          >
            {autoPlay ? '⏸ 止めて読む' : '▶ 自動で進む'}
          </button>

          {autoPlay ? (
            <p className="pacer__preview">
              {preview ? `次は ${preview}` : ' '}
            </p>
          ) : (
            <button
              type="button"
              className="pacer__next"
              onClick={onSend}
              disabled={!sendable}
            >
              <span className="pacer__next-label">
                {preview ? `次へ ▸ ${preview}` : '通信中…'}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
