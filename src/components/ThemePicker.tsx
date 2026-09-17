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
 * 「いま学んでいるテーマ」の表示と、その切り替えを 1 か所にまとめる。
 * テーマの名前そのものが押せるボタンで、開くと名前と一行説明が並ぶ。
 *
 * ただの見出しに見えると押せることに気づかれない（右上の小さな
 * ドロップダウンで一度失敗した）ので、枠・背景・▼ でボタンだと分かる
 * 見た目にし、ヘッダーの中でいちばん目立たせる。
 */
export function ThemePicker({
  extras,
  activeExtra,
  onSelectMain,
  onSelectExtra,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 外を押したとき・Esc で閉じる
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const themes = [
    {
      key: 'main',
      name: MAIN_SECTION.navLabel,
      summary: MAIN_SECTION.menuSummary,
      active: activeExtra === null,
      select: onSelectMain,
    },
    ...extras.map((extra) => ({
      key: extra.id,
      name: extra.navLabel,
      summary: extra.menuSummary,
      active: activeExtra === extra.id,
      select: () => onSelectExtra(extra.id),
    })),
  ]
  const current = themes.find((theme) => theme.active) ?? themes[0]

  return (
    <div className="themepicker" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="themepicker__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="themepicker__text">
          <span className="themepicker__caption">学ぶテーマ</span>
          <span className="themepicker__name">{current.name}</span>
        </span>
        <span className="themepicker__chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="themepicker__list"
          role="listbox"
          aria-label="学ぶテーマ"
        >
          {themes.map((theme) => (
            <li key={theme.key}>
              <button
                type="button"
                role="option"
                aria-selected={theme.active}
                className={`themepicker__item ${theme.active ? 'is-active' : ''}`}
                onClick={() => {
                  theme.select()
                  setOpen(false)
                }}
              >
                <span className="themepicker__item-name">{theme.name}</span>
                <span className="themepicker__item-summary">
                  {theme.summary}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
