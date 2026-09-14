import type { ReactNode } from 'react'
import type {
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
} from '../domain/types'
import { BROADCAST } from '../domain/types'

interface Props {
  /** いま図で再生しているまとまり（まとめて飛んだものは複数通） */
  current: ConversationMessage[]
  nodes: DiagramNodeSpec[]
  /** 会話が始まっていないときに出すもの（開始ボタン） */
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
        {message.frame !== undefined && (
          <span className="stagebar__frame">No.{message.frame}</span>
        )}
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
 * 図のすぐ下に固定する、いま再生しているやり取りの実況。
 * 進める操作はしない（トラックのチップを押して再生する）。表示専用。
 */
export function ConversationBar({ current, nodes, idle }: Props) {
  const [first] = current
  if (!first) {
    return (
      <section className="stagebar stagebar--idle">
        <div className="stagebar__idle">{idle}</div>
      </section>
    )
  }

  const together = current.length > 1

  return (
    <section className="stagebar" aria-live="polite">
      <div className={`stagebar__message stagebar__message--${first.kind}`}>
        {together && (
          <p className="stagebar__head">
            <span className="stagebar__together">
              {current.length} 台が同時に返事 → {targetName(nodes, first)}
            </span>
          </p>
        )}

        <div className={`stagebar__lines ${together ? 'is-together' : ''}`}>
          {current.map((message) => (
            <MessageLine
              key={message.id}
              message={message}
              nodes={nodes}
              compact={together}
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

      <div className="stagebar__controls">{idle}</div>
    </section>
  )
}
