import type {
  ExtraContent,
  ExtraId,
  StepContent,
  StepOrder,
} from '../domain/types'

interface Props {
  steps: StepContent[]
  current: StepOrder
  onChange: (order: StepOrder) => void
  /** 番外編（本編の 1〜7 には含まれない、別入り口から開く読み物） */
  extras: ExtraContent[]
  /** いま番外編を表示しているなら、その id */
  activeExtra: ExtraId | null
  onSelectExtra: (id: ExtraId) => void
}

/**
 * ステップの pill を 1 行に並べる。数が多いので横スクロールで逃がす。
 * 進む／戻るボタンは置かない（pill を直接押して移動する）。
 * 末尾に番外編のドロップダウンを置く。本編の pill はそのまま常時押せる
 * ので、番外編にいてもいつでも戻れる。
 */
export function StepNav({
  steps,
  current,
  onChange,
  extras,
  activeExtra,
  onSelectExtra,
}: Props) {
  return (
    <nav className="stepnav" aria-label="学習ステップ">
      <ol className="stepnav__list">
        {steps.map((step, index) => {
          // 章が切り替わるところに区切りを入れる（IP 編 → SC 編）
          const newChapter =
            index === 0 || steps[index - 1].chapter !== step.chapter
          return (
            <li key={step.id} className="stepnav__item">
              {newChapter && (
                <span className="stepnav__chapter">{step.chapter}</span>
              )}
              <button
                type="button"
                className="stepnav__pill"
                aria-current={
                  activeExtra === null && step.order === current
                    ? 'step'
                    : undefined
                }
                onClick={() => onChange(step.order)}
              >
                <span className="stepnav__num">{step.order}</span>
                <span className="stepnav__label">{step.navLabel}</span>
              </button>
            </li>
          )
        })}

        {extras.length > 0 && (
          <li className="stepnav__item">
            <span className="stepnav__chapter">番外編</span>
            <select
              className={`stepnav__extra ${
                activeExtra !== null ? 'is-active' : ''
              }`}
              aria-label="番外編を選ぶ"
              value={activeExtra ?? ''}
              onChange={(event) => {
                const id = event.target.value as ExtraId | ''
                if (id) onSelectExtra(id)
              }}
            >
              <option value="" disabled>
                番外編を選ぶ
              </option>
              {extras.map((extra) => (
                <option key={extra.id} value={extra.id}>
                  {extra.navLabel}
                </option>
              ))}
            </select>
          </li>
        )}
      </ol>
    </nav>
  )
}
