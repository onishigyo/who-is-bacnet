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
 * 画面そのものを切り替えるメニュー。左端のボタンを押すと、左から
 * 引き出しが出て、その中で行き先を選ぶ。
 *
 * ステップ 1〜7 と、別軸の読み物（BBMD）は同居させる意味がないので、
 * 下の帯には混ぜず、ここで丸ごと入れ替える。いまどこにいるかは
 * ヘッダーの見出し（App の app__section）が常に出している。
 */
export function SectionMenu({
  extras,
  activeExtra,
  onSelectMain,
  onSelectExtra,
}: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Esc で閉じる。閉じたらボタンへ戻す（キーボードで辿れるように）
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const choose = (run: () => void) => {
    run()
    setOpen(false)
  }

  const item = (
    key: string,
    name: string,
    summary: string,
    active: boolean,
    run: () => void,
  ) => (
    <li key={key}>
      <button
        type="button"
        className={`sectionmenu__item ${active ? 'is-active' : ''}`}
        aria-current={active ? 'true' : undefined}
        onClick={() => choose(run)}
      >
        <span className="sectionmenu__name">{name}</span>
        <span className="sectionmenu__summary">{summary}</span>
      </button>
    </li>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="sectionmenu__button"
        aria-label="画面を選ぶ"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sectionmenu__icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <>
          <div
            className="sectionmenu__backdrop"
            onClick={() => setOpen(false)}
          />
          <aside className="sectionmenu__drawer" aria-label="画面を選ぶ">
            <p className="sectionmenu__heading">画面を選ぶ</p>
            <ul className="sectionmenu__list">
              {item(
                'main',
                MAIN_SECTION.navLabel,
                MAIN_SECTION.menuSummary,
                activeExtra === null,
                onSelectMain,
              )}
              {extras.map((extra) =>
                item(
                  extra.id,
                  extra.navLabel,
                  extra.menuSummary,
                  activeExtra === extra.id,
                  () => onSelectExtra(extra.id),
                ),
              )}
            </ul>
          </aside>
        </>
      )}
    </>
  )
}
