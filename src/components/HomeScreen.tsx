import { DISCLAIMER, MAIN_SECTION } from '../content/sections'
import type { ExtraContent, ExtraId } from '../domain/types'

interface Props {
  extras: ExtraContent[]
  /** 本編（ステップ 1〜7）に入る */
  onSelectMain: () => void
  /** 読み物に入る */
  onSelectExtra: (id: ExtraId) => void
}

/**
 * 入口画面。開いた瞬間に「学べるコンテンツが複数ある」と分かるようにする。
 * 本編（ステップ 1〜7）を「まずはここから」として前に出し、読み物は同格の
 * カードとして並べる。どれも作りは同じ（順番に育つページ群）で、格付けでは
 * なく"おすすめの入口"を示すだけ。入ったあとも画面内で切り替えられる。
 */
export function HomeScreen({ extras, onSelectMain, onSelectExtra }: Props) {
  return (
    <div className="home">
      <div className="home__inner">
        <header className="home__head">
          <h1 className="home__title">Who-Is BACnet?</h1>
          <p className="home__subtitle">
            ビル設備のプロトコル BACnet を、1 枚のネットワーク図の上で理解する
          </p>
        </header>

        <section className="home__group">
          <h2 className="home__group-title">まずはここから</h2>
          <button
            type="button"
            className="home__card home__card--main"
            onClick={onSelectMain}
          >
            <span className="home__card-badge">おすすめ</span>
            <span className="home__card-name">{MAIN_SECTION.navLabel}</span>
            <span className="home__card-summary">
              {MAIN_SECTION.menuSummary}
            </span>
          </button>
        </section>

        <section className="home__group">
          <h2 className="home__group-title">もっと知る</h2>
          <ul className="home__cards">
            {extras.map((extra) => (
              <li key={extra.id}>
                <button
                  type="button"
                  className="home__card"
                  onClick={() => onSelectExtra(extra.id)}
                >
                  <span className="home__card-name">{extra.navLabel}</span>
                  <span className="home__card-summary">
                    {extra.menuSummary}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="home__disclaimer">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
