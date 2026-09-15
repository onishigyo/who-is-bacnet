import { useEffect, useRef } from 'react'
import type {
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
} from '../domain/types'

interface Props {
  /** 同時に飛ぶまとまり単位のやり取り。まとめて飛んだものは 1 チップ */
  groups: ConversationMessage[][]
  nodes: DiagramNodeSpec[]
  /** いま再生しているまとまりの index（なければ null） */
  activeIndex: number | null
  onSelect: (index: number) => void
  emptyText: string
}

function nameOf(nodes: DiagramNodeSpec[], id: NodeId): string {
  return nodes.find((node) => node.id === id)?.label ?? id
}

/**
 * ここまでのやり取りを、図の下に一列で積む。
 * 同時に飛ぶまとまり（Who-Is への返事など）は 1 チップにまとめる。
 * 押すと、そのまとまりを図で再生する。
 */
export function ConversationTrack({
  groups,
  nodes,
  activeIndex,
  onSelect,
  emptyText,
}: Props) {
  const active = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    active.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [groups.length, activeIndex])

  if (groups.length === 0) {
    return (
      <section className="track track--empty">
        <p className="track__empty">{emptyText}</p>
      </section>
    )
  }

  return (
    <section className="track" aria-label="ここまでのやり取り">
      <ol className="track__list">
        {groups.map((group, index) => {
          const first = group[0]
          const selected = index === activeIndex
          const together = group.length > 1
          const alert = group.some((m) => m.annotationTone === 'alert')
          return (
            <li key={first.id}>
              <button
                type="button"
                ref={selected ? active : null}
                className={`track__item track__item--${first.kind} ${
                  selected ? 'is-active' : ''
                } ${alert ? 'is-alert' : ''}`}
                onClick={() => onSelect(index)}
                aria-current={selected ? 'true' : undefined}
              >
                <span className="track__no">{index + 1}</span>
                <span className="track__body">
                  {together ? (
                    <>
                      <span className="track__from">
                        {group.length} 台が同時に
                      </span>
                      <span className="track__plain">名乗って返事する</span>
                    </>
                  ) : (
                    <>
                      <span className="track__from">
                        {nameOf(nodes, first.from)}
                      </span>
                      <span className="track__plain">{first.plain}</span>
                    </>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
