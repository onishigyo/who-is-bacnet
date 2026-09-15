import type { CaptureEvidence } from '../domain/types'

/**
 * 実験で取得した Wireshark キャプチャによる答え合わせ。
 * tshark の出力をそのまま並べる（列の中身には手を加えない）。
 */
export function CaptureEvidenceCard({
  capture,
  highlight = [],
}: {
  capture: CaptureEvidence
  /** いま図の上で飛んでいる（帯に出ている）パケットの番号 */
  highlight?: number[]
}) {
  return (
    <section className="capture">
      <h3 className="capture__title">{capture.title}</h3>
      {capture.durationLabel && (
        <p
          className={`capture__duration ${
            capture.durationTone === 'alert' ? 'is-alert' : ''
          }`}
        >
          {capture.durationLabel}
        </p>
      )}
      <p className="capture__caption">{capture.caption}</p>

      {capture.imageSrc && (
        <img
          className="capture__image"
          src={capture.imageSrc}
          alt={capture.alt}
        />
      )}

      {capture.rows.length === 0 ? (
        <p className="capture__pending">
          この答え合わせは、実験キャプチャを撮り直し中です。
        </p>
      ) : (
        <div className="capture__sheet">
          <p className="capture__filter">
            表示フィルタ <code>{capture.filter}</code>
          </p>
          {/* 右パネルは狭いので、1 パケットを 2 行で見せる。いちばん大事な Info 欄を隠さないため */}
          <ol className="capture__packets" aria-label={capture.alt}>
            {capture.rows.map((row) => (
              <li
                key={row.no}
                className={`capture__packet ${highlight.includes(row.no) ? 'is-now' : ''}`}
                aria-current={highlight.includes(row.no) ? 'true' : undefined}
              >
                <div className="capture__head">
                  <span className="capture__no">{row.no}</span>
                  <span className="capture__route">
                    {row.source} → {row.destination}
                  </span>
                  <span className="capture__proto">{row.protocol}</span>
                </div>
                <div className="capture__info">{row.info}</div>
                {row.value && <div className="capture__value">{row.value}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="capture__provenance">{capture.provenance}</p>
    </section>
  )
}
