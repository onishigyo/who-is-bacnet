import { useEffect, useRef } from 'react'
import type {
  ConversationMessage,
  DiagramNodeSpec,
  NodeId,
} from '../domain/types'
import { involvesAttacker } from '../logic/conversation'

interface Props {
  /** 同時に飛ぶまとまり単位のやり取り。まとめて飛んだものは 1 チップ */
  groups: ConversationMessage[][]
  nodes: DiagramNodeSpec[]
  /** 攻撃者のノード。これが関わる場面では、チップの強調も赤にそろえる */
  attackerId: NodeId
  /** いま再生しているまとまりの index（なければ null） */
  activeIndex: number | null
  /** 次に押してほしいまとまりの index（なければ null）。光らせて誘導する */
  nextIndex: number | null
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
  attackerId,
  activeIndex,
  nextIndex,
  onSelect,
  emptyText,
}: Props) {
  const active = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)

  // 次に押すチップがあればそれを、なければ再生中のチップを見える位置に出す
  useEffect(() => {
    ;(next.current ?? active.current)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [groups.length, activeIndex, nextIndex])

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
          const upNext = index === nextIndex
          // まだ見ていない先のチップは薄くする（済み／これからの区別）
          const ahead =
            !selected &&
            !upNext &&
            (activeIndex === null || index > activeIndex)
          const danger = group.some((m) => involvesAttacker(m, attackerId))
          const together = group.length > 1
          return (
            <li key={first.id}>
              <button
                type="button"
                ref={selected ? active : upNext ? next : null}
                className={`track__item ${
                  selected ? 'is-active' : ''
                } ${upNext ? 'is-next' : ''} ${ahead ? 'is-ahead' : ''} ${
                  danger ? 'is-danger' : ''
                }`}
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
                {/* 「次」は色だけでなく言葉で言う。チップの上辺に重ねるので幅は変わらない */}
                {upNext && (
                  <span className="track__next-tag" aria-hidden="true">
                    次
                  </span>
                )}
                {upNext && <span className="sr-only">（次に押す）</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
