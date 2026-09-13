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
        {steps.map((step) => (
          <li key={step.id}>
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
        ))}
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
