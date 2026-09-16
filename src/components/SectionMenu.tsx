import { useEffect, useRef, useState } from 'react'
import { MAIN_SECTION } from '../content/sections'
import type { ExtraContent, ExtraId } from '../domain/types'

interface Props {
  extras: ExtraContent[]
  /** 読み物を開いているなら、その id。null ならステップ 1〜7 の側 */
  activeExtra: ExtraId | null
  onSelectMain: () => void
  onSelectExtra: (id: ExtraId) => void
}

/**
 * 画面そのものを切り替えるメニュー。ステップ 1〜7 と、別軸の読み物
 * （BBMD）は同居させる意味がないので、下の帯に混ぜず、ここで丸ごと
 * 入れ替える。いまどちらにいるかは、ボタンの横に出す名前で分かる。
 */
export function SectionMenu({
  extras,
  activeExtra,
  onSelectMain,
  onSelectExtra,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 外を押したとき・Esc で閉じる
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const activeContent = extras.find((extra) => extra.id === activeExtra)
  const currentName = activeContent
    ? activeContent.navLabel
    : MAIN_SECTION.navLabel

  const choose = (run: () => void) => {
    run()
    setOpen(false)
  }

  return (
    <div className="sectionmenu" ref={ref}>
      <button
        type="button"
        className="sectionmenu__button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sectionmenu__icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sectionmenu__current">{currentName}</span>
      </button>

      {open && (
        <ul className="sectionmenu__list" role="menu">
          <li>
            <button
              type="button"
              role="menuitem"
              className={`sectionmenu__item ${
                activeExtra === null ? 'is-active' : ''
              }`}
              onClick={() => choose(onSelectMain)}
            >
              <span className="sectionmenu__name">{MAIN_SECTION.navLabel}</span>
              <span className="sectionmenu__summary">
                {MAIN_SECTION.menuSummary}
              </span>
            </button>
          </li>

          {extras.map((extra) => (
            <li key={extra.id}>
              <button
                type="button"
                role="menuitem"
                className={`sectionmenu__item ${
                  activeExtra === extra.id ? 'is-active' : ''
                }`}
                onClick={() => choose(() => onSelectExtra(extra.id))}
              >
                <span className="sectionmenu__name">{extra.navLabel}</span>
                <span className="sectionmenu__summary">
                  {extra.menuSummary}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
