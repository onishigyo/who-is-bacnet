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
  nextGroup,
  playbackProgress,
  previewOf,
} from '../logic/conversation'

interface Props {
  /** 再生中の会話。なければ待機表示 */
  conversation: Conversation | null
  playback: PlaybackState
  /** いま解説すべきまとまり（まとめて飛んだものは複数通） */
  current: ConversationMessage[]
  nodes: DiagramNodeSpec[]
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

function targetName(
  nodes: DiagramNodeSpec[],
  message: ConversationMessage,
): string {
  return message.to === BROADCAST
    ? '全員（ブロードキャスト）'
    : nameOf(nodes, message.to)
}

/**
 * まとめて飛んだ分は、1 通 1 行の一覧にする。
 * 意訳はどれも似た文になるので、ここでは誰が何を返したかだけを見せ、
 * 1 通ぶんの詳細はトラックから選んで読み直せるようにしている。
 */
function MessageLine({
  message,
  nodes,
  compact,
}: {
  message: ConversationMessage
  nodes: DiagramNodeSpec[]
  compact: boolean
}) {
  if (compact) {
    return (
      <div className="stagebar__row">
        <span className="stagebar__who">{nameOf(nodes, message.from)}</span>
        <code className="stagebar__protocol">{message.protocol}</code>
        {/* 実験に出てくる 1 通だけ番号を出す。ほかは物語上の機器 */}
        <span className="stagebar__frame">
          {message.frame !== undefined ? `No.${message.frame}` : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="stagebar__line">
      <p className="stagebar__meta">
        {nameOf(nodes, message.from)}
        <span aria-hidden="true"> → </span>
        {targetName(nodes, message)}
        {message.frame !== undefined && (
          <span className="stagebar__frame">Wireshark No.{message.frame}</span>
        )}
      </p>
      <p className="stagebar__plain">{message.plain}</p>
      <code className="stagebar__protocol">{message.protocol}</code>
      {message.value && (
        <code className="stagebar__value">{message.value}</code>
      )}
      <code className="stagebar__transport">{message.transport}</code>
    </div>
  )
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
  onSend,
  reviewing,
  onExitReview,
  idle,
}: Props) {
  const [first] = current
  if (!conversation || !first) {
    return (
      <section className="stagebar stagebar--idle">
        <div className="stagebar__idle">{idle}</div>
      </section>
    )
  }

  const { sent, total } = playbackProgress(playback, conversation)
  const finished = isPlaybackFinished(playback, conversation)
  const preview = previewOf(nextGroup(playback, conversation), (id) =>
    nameOf(nodes, id),
  )
  const together = current.length > 1
  // 読み直しのときは、まとめて飛んだ分も 1 通ずつ詳しく出す
  const compact = together && !reviewing

  return (
    <section className="stagebar" aria-live="polite">
      <div className={`stagebar__message stagebar__message--${first.kind}`}>
        <p className="stagebar__head">
          <span className={`stagebar__count ${reviewing ? 'is-review' : ''}`}>
            {reviewing ? '見直し中' : `${sent} / ${total}`}
          </span>
          {together && (
            <span className="stagebar__together">
              {current.length} 台が同時に返事 → {targetName(nodes, first)}
            </span>
          )}
        </p>

        <div
          className={`stagebar__lines ${compact ? 'is-together' : ''} ${
            reviewing ? 'is-review' : ''
          }`}
        >
          {current.map((message) => (
            <MessageLine
              key={message.id}
              message={message}
              nodes={nodes}
              compact={compact}
            />
          ))}
        </div>
      </div>

      <div className="stagebar__explain">
        <p>{first.explain}</p>
        {first.annotation && (
          <p
            className={`stagebar__annotation ${
              first.annotationTone === 'alert' ? 'is-alert' : ''
            }`}
          >
            {first.annotation}
          </p>
        )}
      </div>

      <div className="stagebar__controls">
        {reviewing && (
          <button
            type="button"
            className="stagebar__toggle"
            onClick={onExitReview}
          >
            ↩ 実況に戻る
          </button>
        )}

        {finished ? (
          idle
        ) : (
          <button
            type="button"
            className="stagebar__next"
            onClick={onSend}
            disabled={!canSendNext(playback, conversation)}
          >
            {preview ? `▸ ${preview}` : '通信中…'}
          </button>
        )}
      </div>
    </section>
  )
}
