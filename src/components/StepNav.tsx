import type { StepContent, StepOrder } from '../domain/types'
import { canGoNext, canGoPrev, nextStep, prevStep } from '../logic/steps'

interface Props {
  steps: StepContent[]
  current: StepOrder
  onChange: (order: StepOrder) => void
}

export function StepNav({ steps, current, onChange }: Props) {
  return (
    <nav className="stepnav" aria-label="学習ステップ">
      <button
        type="button"
        className="stepnav__arrow"
        onClick={() => onChange(prevStep(current))}
        disabled={!canGoPrev(current)}
      >
        ← 戻る
      </button>

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

      <button
        type="button"
        className="stepnav__arrow"
        onClick={() => onChange(nextStep(current))}
        disabled={!canGoNext(current)}
      >
        次へ →
      </button>
    </nav>
  )
}
