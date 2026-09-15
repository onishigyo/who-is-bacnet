import type { Conversation } from '../domain/types'
import { AHU_ID, ATTACKER_ID } from './diagram'

export const MIXED_ATTACK_CONVERSATION_ID = 'mixed-attack'

/**
 * SC の限界（ステップ7）の会話。旧来の BACnet/IP の区画に持ち込まれた PC が、
 * ルータを越えて SC 側の空調コントローラに書き込みを送る。
 *
 * これは実機では確かめていない（IP 編・SC 編のような答え合わせキャプチャは
 * ない）。ASHRAE の手引き（Managed BACnet Guidance 14.4）に基づくシナリオで、
 * 「ルータで通信を絞っていなければ、こうなりうる」を示すもの。帯・注記で
 * 要検証を明示する（captureId は持たせない）。
 */
export const mixedConversations: Conversation[] = [
  {
    id: MIXED_ATTACK_CONVERSATION_ID,
    title: '旧来の区画から、SC 側の機器に書き込む',
    messages: [
      {
        id: 'mx1',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 99.0 ℃にして',
        protocol: 'Confirmed-REQ   writeProperty analog-value,0 present-value',
        value: 'Present Value (real): 99',
        transport: '旧来の区画 → ルータ → SC ハブ → 空調コントローラ',
        action: '書き換えを送る',
        explain:
          '持ち込まれた PC が、旧来の区画から SC 側の空調コントローラに書き込みを送ります。要求はルータを通り、SC 側へ中継されます。ルータで通信を絞っていなければ、これが届いてしまいます。',
        annotation:
          'ルータで絞らなければ SC 側にも届く（ASHRAE 手引き・実機では未確認）',
        annotationTone: 'alert',
      },
      {
        id: 'mx2',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty',
        transport: '空調コントローラ → SC ハブ → ルータ → 旧来の区画',
        action: '受け入れる',
        explain:
          '空調コントローラから見ると、証明書を持つルータを経由して届いた、正しい形の要求です。元の送り主が旧来の区画の PC だとは分かりません。SC 編で入り口を固めても、旧来の側に穴があれば、そこが回り道になりえます。',
      },
    ],
  },
]
