import type { Conversation } from '../domain/types'
import { AHU_ID, ATTACKER_ID } from './diagram'

export const MIXED_ATTACK_CONVERSATION_ID = 'mixed-attack'

/**
 * SC の限界（ステップ7）の会話。旧来の BACnet/IP の区画に持ち込まれた PC が、
 * ① 同じ区画にいる SC 非対応の電力計を読む → ② ルータを越えて SC 側の
 * 空調コントローラに書き込みを送る、の 2 段階。
 *
 * ①は IP 編と同じ話（同じ区画にいれば読み書きできる）の繰り返しなので、
 * 電力計の書き込める先がはっきりしないこともあり、あえて「読む」だけに
 * 絞って正確さを優先した。②はこれまでの実験キャプチャと違い、実機では
 * 確かめていない（ASHRAE の手引き Managed BACnet Guidance 14.4 に基づく
 * シナリオ）。帯・注記の両方で要検証を明示する（captureId は持たせない）。
 */
export const mixedConversations: Conversation[] = [
  {
    id: MIXED_ATTACK_CONVERSATION_ID,
    title: '旧来の区画から、電力計を読み、SC 側にも書き込む',
    messages: [
      {
        id: 'mx1',
        from: ATTACKER_ID,
        to: 'meter',
        kind: 'request',
        plain: '電力計の値を教えて',
        protocol: 'Confirmed-REQ   readProperty analog-input,0 present-value',
        transport: '旧来の区画（ルータを越えない）',
        action: '値を読む',
        explain:
          '電力計は SC に対応していないので、証明書の確認がありません。持ち込まれた PC と同じ旧来のスイッチに繋がっているだけで、BACnet/IP と同じように読み書きできます。',
        annotation: '同じ区画にいるだけで読める（BACnet/IP と同じ弱点）',
        annotationTone: 'alert',
      },
      {
        id: 'mx2',
        from: 'meter',
        to: ATTACKER_ID,
        kind: 'response',
        plain: '今の使用電力です',
        protocol: 'Complex-ACK     readProperty analog-input,0 present-value',
        value: 'Present Value (real): 42',
        transport: '電力計 → 旧来の区画',
        action: '値を返す',
        explain:
          '証明書もなく、送り主を確かめる仕組みもないので、そのまま値を返します。中央監視からの問い合わせと区別できません。',
      },
      {
        id: 'mx3',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 99.0 ℃にして',
        protocol: 'Confirmed-REQ   writeProperty analog-value,0 present-value',
        value: 'Present Value (real): 99',
        transport: '旧来の区画 → ルータ → SC ハブ → 空調コントローラ',
        action: '書き換えを送る',
        explain:
          '続いて、もう一段先の SC 側にある空調コントローラも試します。要求はルータを通り、SC 側へ中継されます。ルータで通信を絞っていなければ、これが届いてしまいます。',
        annotation:
          'ルータで絞らなければ SC 側にも届く（ASHRAE 手引き・実機では未確認）',
        annotationTone: 'alert',
      },
      {
        id: 'mx4',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty',
        transport: '空調コントローラ → SC ハブ → ルータ → 旧来の区画',
        action: '受け入れる',
        explain:
          '空調コントローラから見ると、証明書を持つルータを経由して届いた、正しい形の要求です。元の送り主が旧来の区画の PC だとは分かりません。BACnet/SC で入り口を固めても、旧来の側に穴があれば、そこが回り道になりえます。',
      },
    ],
  },
]
