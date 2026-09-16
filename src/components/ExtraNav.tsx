import type { ExtraContent, ExtraId } from '../domain/types'

interface Props {
  /** 番外編（本編の 1〜7 には含まれない、別入り口から開く読み物） */
  extras: ExtraContent[]
  /** いま番外編を表示しているなら、その id */
  activeExtra: ExtraId | null
  onSelectExtra: (id: ExtraId) => void
}

/**
 * 番外編の入り口。本編の流れとは別の読み物なので、下のステップナビには
 * 混ぜず、ヘッダーに置く。ステップの pill は常時押せるので、番外編から
 * 本編へはいつでも戻れる。
 */
export function ExtraNav({ extras, activeExtra, onSelectExtra }: Props) {
  if (extras.length === 0) return null

  return (
    <div className="extranav">
      <span className="extranav__label">番外編</span>
      <select
        className={`extranav__select ${activeExtra !== null ? 'is-active' : ''}`}
        aria-label="番外編を選ぶ"
        value={activeExtra ?? ''}
        onChange={(event) => {
          const id = event.target.value as ExtraId | ''
          if (id) onSelectExtra(id)
        }}
      >
        <option value="" disabled>
          選ぶ
        </option>
        {extras.map((extra) => (
          <option key={extra.id} value={extra.id}>
            {extra.navLabel}
          </option>
        ))}
      </select>
    </div>
  )
}
