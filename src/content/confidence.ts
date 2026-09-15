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
    '規格（ANSI/ASHRAE 135 や RFC）や公式資料に書かれている内容。出典を添えています。',
  interpretation:
    '制作者の理解で、まだ確かめきれていない内容。鵜呑みにせず、自分で確かめてください。',
}

export const confidenceLegendTitle = '注記の見方'
