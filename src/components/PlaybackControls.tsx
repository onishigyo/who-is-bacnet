import { useEffect, useRef } from 'react'
import type {
  Conversation,
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
  PlaybackState,
} from '../domain/types'
import { BROADCAST } from '../domain/types'
import { canSendNext, playbackProgress } from '../logic/conversation'

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

function buttonLabel(
  playback: PlaybackState,
  sent: number,
  total: number,
): string {
  if (playback.inFlight !== null) return '送信中…'
  if (sent >= total) return 'この会話はここまで'
  return sent === 0
    ? '1 通目を送る'
    : `次の 1 通を送る（${sent + 1} / ${total}）`
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
          ボタンを押すと 1 通だけ飛びます。読み終えてから次を送ってください。
        </p>
      )}

      <button
        type="button"
        className="pacer__next"
        onClick={onSend}
        disabled={!sendable}
      >
        {buttonLabel(playback, sent, total)}
      </button>
    </section>
  )
}
