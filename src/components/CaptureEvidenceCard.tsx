import type { CaptureEvidence } from '../domain/types'

/**
 * 実験で取得した Wireshark キャプチャによる答え合わせ。
 * imageSrc が未設定のうちは、Info 欄のテキスト再現をプレースホルダとして出す。
 */
export function CaptureEvidenceCard({ capture }: { capture: CaptureEvidence }) {
  return (
    <section className="capture">
      <h3 className="capture__title">答え合わせ: {capture.title}</h3>
      <p className="capture__caption">{capture.caption}</p>

      {capture.imageSrc ? (
        <img
          className="capture__image"
          src={capture.imageSrc}
          alt={capture.alt}
        />
      ) : (
        <div className="capture__placeholder">
          <p className="capture__placeholder-label">
            Wireshark の Info 欄（実キャプチャ画像に差し替え予定の再現表示）
          </p>
          <ol className="capture__info">
            {capture.infoColumn.map((line, index) => (
              <li key={line}>
                <span className="capture__no">{index + 1}</span>
                <code>{line}</code>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
