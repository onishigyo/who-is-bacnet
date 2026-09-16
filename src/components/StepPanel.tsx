import type { PanelContent } from '../domain/types'

/** ステップの読み物部分。注記は StepNotes として会話のあとに置く */
export function StepPanel({ step }: { step: PanelContent }) {
  return (
    <section className="steppanel">
      <p className="steppanel__eyebrow">
        {'order' in step ? `ステップ ${step.order}` : step.navLabel}
      </p>
      <h2 className="steppanel__title">{step.title}</h2>
      <p className="steppanel__lead">{step.lead}</p>

      {step.paragraphs.map((paragraph, index) => (
        <p key={index} className="steppanel__body">
          {paragraph}
        </p>
      ))}
    </section>
  )
}
