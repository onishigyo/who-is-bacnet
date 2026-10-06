import {
  confidenceDescriptions,
  confidenceLabels,
  confidenceLegendTitle,
} from '../content/confidence'
import type { ContentNote } from '../domain/types'

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
      {note.source && note.source.length > 0 && (
        <details className="note__source">
          <summary className="note__source-summary">出典</summary>
          <ul className="note__source-list">
            {note.source.map((ref, index) => (
              <li key={index} className="note__source-item">
                <span className="note__source-label">{ref.label}</span>
                <span className="note__source-ref">{ref.text}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}

/** 本文の補足。会話より後ろに置く（主役は会話） */
export function StepNotes({ notes }: { notes: ContentNote[] }) {
  if (notes.length === 0) return null

  return (
    <section className="notes-section">
      <NotesLegend />
      <ul className="notes">
        {notes.map((note) => (
          <Note key={note.id} note={note} />
        ))}
      </ul>
    </section>
  )
}
