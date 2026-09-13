import type { ContentNote, StepContent } from '../domain/types'

const confidenceLabel: Record<ContentNote['confidence'], string> = {
  standard: '規格で確立',
  interpretation: '制作者の理解・要検証',
}

function Note({ note }: { note: ContentNote }) {
  return (
    <li className={`note note--${note.confidence}`}>
      <span className="note__badge">{confidenceLabel[note.confidence]}</span>
      <p className="note__text">{note.text}</p>
      {note.source && <p className="note__source">出典: {note.source}</p>}
    </li>
  )
}

export function StepPanel({ step }: { step: StepContent }) {
  return (
    <section className="steppanel">
      <p className="steppanel__eyebrow">ステップ {step.order}</p>
      <h2 className="steppanel__title">{step.title}</h2>
      <p className="steppanel__lead">{step.lead}</p>

      {step.paragraphs.map((paragraph, index) => (
        <p key={index} className="steppanel__body">
          {paragraph}
        </p>
      ))}

      {step.notes.length > 0 && (
        <ul className="notes">
          {step.notes.map((note) => (
            <Note key={note.id} note={note} />
          ))}
        </ul>
      )}
    </section>
  )
}
