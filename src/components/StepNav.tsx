import type { StepContent, StepOrder } from '../domain/types'

interface Props {
  steps: StepContent[]
  current: StepOrder
  onChange: (order: StepOrder) => void
}

/**
 * ステップの pill を 1 行に並べる。数が多いので横スクロールで逃がす。
 * 進む／戻るボタンは置かない（pill を直接押して移動する）。
 * 画面そのものの切り替えはここには置かない（ヘッダーの SectionMenu が持つ）。
 */
export function StepNav({ steps, current, onChange }: Props) {
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
                aria-current={step.order === current ? 'step' : undefined}
                onClick={() => onChange(step.order)}
              >
                <span className="stepnav__num">{step.order}</span>
                <span className="stepnav__label">{step.navLabel}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
