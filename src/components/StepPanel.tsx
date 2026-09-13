import {
  confidenceDescriptions,
  confidenceLabels,
  confidenceLegendTitle,
} from '../content/confidence'
import type { ContentNote, StepContent } from '../domain/types'

const CONFIDENCES = ['standard', 'interpretation'] as const

/** バッジが何を意味するのかを、注記の手前で一度説明する */
function NotesLegend() {
  return (
    <div className="notes__legend">
      <p className="notes__legend-title">{confidenceLegendTitle}</p>
      <ul>
        {CONFIDENCES.map((confidence) => (
          <li key={confidence}>
            <span className={`note__badge note__badge--${confidence}`}>
              {confidenceLabels[confidence]}
            </span>
            <span className="notes__legend-text">
              {confidenceDescriptions[confidence]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Note({ note }: { note: ContentNote }) {
  return (
    <li className={`note note--${note.confidence}`}>
      <span className={`note__badge note__badge--${note.confidence}`}>
        {confidenceLabels[note.confidence]}
      </span>
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

      {step.notes.length > 0 && <NotesLegend />}

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
