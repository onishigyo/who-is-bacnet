import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, SUPERVISOR_ID } from './diagram'
import { SUBNET_A_ID, SUBNET_B_ID } from './diagram-bbmd'

export const BBMD_BEFORE_CONVERSATION_ID = 'bbmd-before'
export const BBMD_AFTER_CONVERSATION_ID = 'bbmd-after'

/**
 * BBMD 番外編の会話。Before（線がまだない）と After（線がある）で、
 * 中身も図の状態も変わる。図の appearsAt（BBMD_BEFORE/BBMD_AFTER）と
 * セットで、App 側がどちらの会話・どちらの図を出すか決める。
 *
 * After の中継（ba2/ba3）は、BBMD の実際の動きを 2 段階で描く。
 * ① 区画をまたぐユニキャスト転送（Forwarded-NPDU）
 * ② 転送を受け取った側が、自分の区画にもう一度ブロードキャストし直す
 * 1 本の矢印で「境界を越えて届いた」と単純化しない。
 */
export const bbmdConversations: Conversation[] = [
  {
    id: BBMD_BEFORE_CONVERSATION_ID,
    title: 'BBMD なしで探す',
    messages: [
      {
        id: 'bb1',
        from: SUPERVISOR_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: 'UDP ブロードキャスト（サブネット A 内）',
        action: '全員に呼びかける',
        explain:
          '中央監視がいつもどおり呼びかけます。ですが、この呼びかけはサブネット A の中にしか届きません。線でつながっていないサブネット B の空調コントローラには、届きようがありません。',
        annotation: 'サブネットをまたいだ先には、返事が来ない',
      },
    ],
  },
  {
    id: BBMD_AFTER_CONVERSATION_ID,
    title: 'BBMD を設置してから探す',
    messages: [
      {
        id: 'ba1',
        from: SUPERVISOR_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: 'UDP ブロードキャスト（サブネット A 内）',
        action: '全員に呼びかける',
        explain:
          'まずサブネット A の中にブロードキャストされます。ここまでは BBMD なしのときと同じです。',
      },
      {
        id: 'ba2',
        from: SUBNET_A_ID,
        to: SUBNET_B_ID,
        kind: 'request',
        plain: '（この呼びかけを転送します）',
        protocol: 'BVLC Forwarded-NPDU',
        transport: 'UDP ユニキャスト（サブネット A → サブネット B）',
        action: '転送する',
        explain:
          'サブネット A の BBMD が、あらかじめ持っている配信先の一覧（Broadcast Distribution Table）に従って、サブネット B の BBMD へユニキャストで転送します。ブロードキャストそのものではなく、そのコピーが 1 対 1 の通信として境界を越えます。',
      },
      {
        id: 'ba3',
        from: SUBNET_B_ID,
        to: BROADCAST,
        kind: 'request',
        plain: '（受け取った呼びかけを配り直します）',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: 'UDP ブロードキャスト（サブネット B 内）',
        action: '配り直す',
        explain:
          '転送を受け取ったサブネット B の BBMD が、今度はサブネット B の中にブロードキャストとして配り直します。空調コントローラにも、ようやく呼びかけが届きます。',
      },
      {
        id: 'ba4',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです',
        protocol: 'Unconfirmed-REQ i-Am',
        transport: '同じ経路を逆にたどって届く',
        action: '名乗って返す',
        explain:
          '返事の I-Am も、同じ経路（サブネット B の BBMD → サブネット A の BBMD → 中央監視）を逆向きにたどって戻ります。BBMD を設置しておけば、サブネットが分かれていても、いつもどおり相手を見つけられます。',
      },
    ],
  },
]
