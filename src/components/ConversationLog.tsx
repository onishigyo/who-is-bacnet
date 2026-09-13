import type {
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
} from '../domain/types'
import { BROADCAST } from '../domain/types'

interface Props {
  title: string
  messages: ConversationMessage[]
  nodes: DiagramNodeSpec[]
  emptyText: string
}

function nameOf(nodes: DiagramNodeSpec[], id: NodeId): string {
  return nodes.find((node) => node.id === id)?.label ?? id
}

/** 意訳と実コマンドの二層で会話を見せる。判定はせず、渡されたものを描くだけ */
export function ConversationLog({ title, messages, nodes, emptyText }: Props) {
  return (
    <section className="log">
      <h3 className="log__title">{title}</h3>

      {messages.length === 0 ? (
        <p className="log__empty">{emptyText}</p>
      ) : (
        <ol className="log__list">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`log__item log__item--${message.kind}`}
            >
              <p className="log__from">
                {nameOf(nodes, message.from)}
                <span aria-hidden="true"> → </span>
                {message.to === BROADCAST
                  ? '全員（ブロードキャスト）'
                  : nameOf(nodes, message.to)}
              </p>
              <p className="log__plain">{message.plain}</p>
              <code className="log__protocol">{message.protocol}</code>
              {message.annotation && (
                <p
                  className={`log__annotation ${
                    message.annotationTone === 'alert' ? 'is-alert' : ''
                  }`}
                >
                  {message.annotation}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
