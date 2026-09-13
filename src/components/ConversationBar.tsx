import type { ReactNode } from 'react'
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
  /** 再生中の会話。なければ待機表示 */
  conversation: Conversation | null
  playback: PlaybackState
  /** いま解説すべきメッセージ */
  current: ConversationMessage | null
  nodes: DiagramNodeSpec[]
  autoPlay: boolean
  onToggleAuto: () => void
  onSend: () => void
  /** トラックから選んで過去のやり取りを読み直している最中か */
  reviewing: boolean
  onExitReview: () => void
  /** 会話が動いていないときに操作欄へ出すもの（開始ボタンや案内） */
  idle: ReactNode
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
 * 図のすぐ下に固定する、会話の実況と操作。
 * 位置を動かさないことがこの帯の役目なので、中身の量で高さを変えない。
 */
export function ConversationBar({
  conversation,
  playback,
  current,
  nodes,
  autoPlay,
  onToggleAuto,
  onSend,
  reviewing,
  onExitReview,
  idle,
}: Props) {
  if (!conversation || !current) {
    return (
      <section className="stagebar stagebar--idle">
        <div className="stagebar__idle">{idle}</div>
      </section>
    )
  }

  const { sent, total } = playbackProgress(playback, conversation)
  const finished = isPlaybackFinished(playback, conversation)
  const preview = previewOf(nodes, playback, conversation)

  return (
    <section className="stagebar" aria-live="polite">
      <div className={`stagebar__message stagebar__message--${current.kind}`}>
        <p className="stagebar__meta">
          <span className={`stagebar__count ${reviewing ? 'is-review' : ''}`}>
            {reviewing ? '見直し中' : `${sent} / ${total}`}
          </span>
          {nameOf(nodes, current.from)}
          <span aria-hidden="true"> → </span>
          {current.to === BROADCAST
            ? '全員（ブロードキャスト）'
            : nameOf(nodes, current.to)}
        </p>
        <p className="stagebar__plain">{current.plain}</p>
        <code className="stagebar__protocol">{current.protocol}</code>
        <code className="stagebar__transport">{current.transport}</code>
      </div>

      <div className="stagebar__explain">
        <p>{current.explain}</p>
        {current.annotation && (
          <p
            className={`stagebar__annotation ${
              current.annotationTone === 'alert' ? 'is-alert' : ''
            }`}
          >
            {current.annotation}
          </p>
        )}
      </div>

      <div className="stagebar__controls">
        {reviewing && (
          <button
            type="button"
            className="stagebar__next"
            onClick={onExitReview}
          >
            ↩ 実況に戻る
          </button>
        )}

        {finished ? (
          idle
        ) : (
          <>
            <button
              type="button"
              className="stagebar__toggle"
              onClick={onToggleAuto}
            >
              {autoPlay ? '⏸ 止めて読む' : '▶ 自動で進む'}
            </button>

            {autoPlay ? (
              <p className="stagebar__preview">
                {preview ? `次は ${preview}` : ' '}
              </p>
            ) : (
              <button
                type="button"
                className="stagebar__next"
                onClick={onSend}
                disabled={!canSendNext(playback, conversation)}
              >
                {preview ? `次へ ▸ ${preview}` : '通信中…'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
