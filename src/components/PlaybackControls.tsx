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
  nextMessage,
  playbackProgress,
} from '../logic/conversation'

interface Props {
  conversation: Conversation
  playback: PlaybackState
  /** いま解説すべきメッセージ */
  current: ConversationMessage | null
  nodes: DiagramNodeSpec[]
  onSend: () => void
}

function nameOf(nodes: DiagramNodeSpec[], id: NodeId): string {
  return nodes.find((node) => node.id === id)?.label ?? id
}

/** 押すと何が起きるかを、押す前に見せる */
function nextLabel(
  nodes: DiagramNodeSpec[],
  playback: PlaybackState,
  conversation: Conversation,
): string {
  if (playback.inFlight !== null) return '通信中…'
  const next = nextMessage(playback, conversation)
  if (!next) return 'この会話はここまで'
  return `次へ ▸ ${nameOf(nodes, next.from)}が${next.action}`
}

/**
 * 会話を 1 通ずつ進めるためのコントロールと、いま何が起きているかの解説。
 * 自動では進まない。利用者が読み終えてから次を送る。
 */
export function PlaybackControls({
  conversation,
  playback,
  current,
  nodes,
  onSend,
}: Props) {
  const { sent, total } = playbackProgress(playback, conversation)
  const sendable = canSendNext(playback, conversation)
  const root = useRef<HTMLElement>(null)

  // 新しいメッセージのたびに、読む場所と次のボタンを視界に入れておく
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
        <p className="pacer__idle">
          ボタンには、押すと次に何が起きるかが書いてあります。1
          通ずつ進めてください。
        </p>
      )}

      <button
        type="button"
        className="pacer__next"
        onClick={onSend}
        disabled={!sendable}
      >
        <span className="pacer__next-label">
          {nextLabel(nodes, playback, conversation)}
        </span>
        {sendable && (
          <span className="pacer__next-count">
            {sent + 1} / {total}
          </span>
        )}
      </button>
    </section>
  )
}
