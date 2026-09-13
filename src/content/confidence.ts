import type { Confidence } from '../domain/types'

/**
 * 注記のバッジ文言。教材として、確立した事実と制作者の解釈を
 * 読み手が区別できることが目的なので、言い回しはここだけで変えられるようにする。
 */
export const confidenceLabels: Record<Confidence, string> = {
  standard: '規格に書いてある',
  interpretation: '制作者の理解（要検証）',
}

export const confidenceDescriptions: Record<Confidence, string> = {
  standard:
    'ANSI/ASHRAE 135 などの一次情報で裏が取れた記述。出典を併記しています。',
  interpretation:
    '制作者の解釈で、裏が取れていない記述。鵜呑みにせず、自分で確かめてください。',
}

export const confidenceLegendTitle = '注記の見方'
