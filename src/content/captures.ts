import type { CaptureEvidence } from '../domain/types'

/**
 * 実験で取得した Wireshark キャプチャによる答え合わせ素材。
 *
 * スクリーンショットを src/assets/captures/ に置き、imageSrc に import したものを
 * 渡せば、プレースホルダから実素材に差し替わる（表示側の変更は不要）。
 * 置く前に、公開して問題のない情報だけが写っているか必ず確認すること。
 */
export const captures: CaptureEvidence[] = [
  {
    id: 'ip-plaintext',
    title: 'BACnet/IP の通信を Wireshark で見ると',
    caption:
      'Info 欄に、何をしているかがそのまま並びます。誰と誰のやり取りか、どのプロパティを読んだか、いくつを書いたか。どれも隠れていません。',
    infoColumn: [
      'Who-Is',
      'I-Am device,3056930',
      'Confirmed-REQ readProperty[ 0] analog-input,0 present-value',
      'Complex-ACK readProperty[ 0] analog-input,0 present-value',
      'Confirmed-REQ writeProperty[ 1] analog-value,0 present-value',
      'Simple-ACK writeProperty[ 1]',
    ],
    alt: 'BACnet/IP の通信を Wireshark で開き、Info 欄に Who-Is や readProperty が平文で表示されている画面',
  },
]
