import { useEffect, useRef } from 'react'
import type {
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
} from '../domain/types'

interface Props {
  /** 着信済みのメッセージ。会話をまたいで積み上がる */
  messages: ConversationMessage[]
  nodes: DiagramNodeSpec[]
  /** いま帯に出しているメッセージ（まとめて飛んだものは複数） */
  activeIds: string[]
  /** 過去のやり取りを見直す */
  onSelect: (id: string) => void
  emptyText: string
}

function nameOf(nodes: DiagramNodeSpec[], id: NodeId): string {
  return nodes.find((node) => node.id === id)?.label ?? id
}

/**
 * ここまでのやり取りを、図の下に一列で積む。
 * 押すとその 1 通を帯に出して読み直せる。
 */
export function ConversationTrack({
  messages,
  nodes,
  activeIds,
  onSelect,
  emptyText,
}: Props) {
  const active = useRef<HTMLButtonElement>(null)

  // 新しいやり取りが増えたら、その位置まで横スクロールする
  useEffect(() => {
    active.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [messages.length, activeIds])

  if (messages.length === 0) {
    return (
      <section className="track track--empty">
        <p className="track__empty">{emptyText}</p>
      </section>
    )
  }

  return (
    <section className="track" aria-label="ここまでのやり取り">
      <ol className="track__list">
        {messages.map((message, index) => {
          const selected = activeIds.includes(message.id)
          return (
            <li key={message.id}>
              <button
                type="button"
                ref={
                  message.id === activeIds[activeIds.length - 1] ? active : null
                }
                className={`track__item track__item--${message.kind} ${
                  selected ? 'is-active' : ''
                } ${message.annotationTone === 'alert' ? 'is-alert' : ''}`}
                onClick={() => onSelect(message.id)}
                aria-current={selected ? 'true' : undefined}
              >
                <span className="track__no">{index + 1}</span>
                <span className="track__body">
                  <span className="track__from">
                    {nameOf(nodes, message.from)}
                  </span>
                  <span className="track__plain">{message.plain}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
