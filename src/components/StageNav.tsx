import type { ExtraStage } from '../domain/types'

interface Props {
  stages: ExtraStage[]
  /** いま見ている場面の index */
  current: number
  onChange: (index: number) => void
}

/**
 * 読み物の中で、条件を変えて見比べるための帯。ステップの帯と同じ位置・
 * 同じ見た目にして、「下の帯を押すと場面が変わる」という操作を揃える。
 * こちらは順番に進む流れではないので、番号は振らない。
 */
export function StageNav({ stages, current, onChange }: Props) {
  return (
    <nav className="stepnav" aria-label="見比べる場面">
      <ol className="stepnav__list">
        {stages.map((stage, index) => (
          <li key={stage.id} className="stepnav__item">
            <button
              type="button"
              className="stepnav__pill"
              aria-current={index === current ? 'true' : undefined}
              onClick={() => onChange(index)}
            >
              <span className="stepnav__label">{stage.navLabel}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
