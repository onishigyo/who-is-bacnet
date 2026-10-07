/**
 * メニューに並ぶ「画面」のうち、ステップ 1〜7 の側の呼び名。
 * BBMD 側の呼び名は content/extras.ts が持つ。
 */
export const MAIN_SECTION = {
  navLabel: 'BACnet の危険性と、その対策',
  menuSummary: '便利さと、無認証と、BACnet/SC（ステップ 1〜7）',
}

/** アプリ共通の免責。入口画面とヘッダーの両方で見せる */
export const DISCLAIMER =
  'ブラウザ内だけで動く再現です。実際の BACnet 通信は発生しません（本文に出てくる「実験」と答え合わせの Wireshark 記録は、制作者が閉域網で実際に BACnet を動かして取ったものです）。防御を学ぶための教材であり、許可のないシステムへの操作を推奨するものではありません。'
