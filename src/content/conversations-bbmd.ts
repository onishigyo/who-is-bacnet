import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, SUPERVISOR_ID } from './diagram'
import { BBMD_A_ID, BBMD_B_ID, LIGHTING_ID } from './diagram-bbmd'

export const BBMD_BEFORE_CONVERSATION_ID = 'bbmd-before'
export const BBMD_AFTER_CONVERSATION_ID = 'bbmd-after'

/**
 * BBMD 番外編の会話。Before（BBMD なし）と After（BBMD あり）で、
 * 図の状態（BBMD_BEFORE / BBMD_AFTER）ごと切り替える。
 *
 * After は、BBMD の動きを省略せずに 3 手で描く。
 *   ① 送り主のサブネットに、ふつうにブロードキャストされる
 *   ② それを受け取った BBMD が、BDT に載っている相手 BBMD へ
 *      ユニキャスト（Forwarded-NPDU）で転送する
 *   ③ 受け取った側の BBMD が、自分のサブネットにブロードキャストし直す
 * 行きの Who-Is も、帰りの I-Am も、同じ 3 手を踏む。1 本の矢印で
 * 「境界を越えて届いた」と単純化しないことが、この番外編の要点。
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
        transport: '192.168.10.255（サブネット A のブロードキャスト）',
        action: '全員に呼びかける',
        explain:
          '中央監視がいつもどおり呼びかけます。宛先はサブネット A のブロードキャストアドレスなので、L2 スイッチは同じサブネットにいる照明コントローラにだけ配ります。',
      },
      {
        id: 'bb2',
        from: LIGHTING_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、照明コントローラです',
        protocol: 'Unconfirmed-REQ i-Am',
        transport: '同じサブネットの中',
        action: '名乗って返す',
        explain:
          '返事をしたのは、呼びかけを聞こえた照明コントローラだけ。サブネット B の空調コントローラと電力計は、そもそも呼びかけを受け取っていないので黙ったままです。ブロードキャストはルータを越えないからです。',
        annotation:
          '中央監視から見ると、サブネット B の機器は「存在しない」のと同じ',
      },
    ],
  },
  {
    id: BBMD_AFTER_CONVERSATION_ID,
    title: 'BBMD を置いてから探す',
    messages: [
      {
        id: 'ba1',
        from: SUPERVISOR_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: '192.168.10.255（サブネット A のブロードキャスト）',
        action: '全員に呼びかける',
        explain:
          '中央監視のやることは、さっきとまったく同じです。違うのは、この呼びかけをサブネット A に置いた BBMD A も受け取っている、という 1 点だけ。',
      },
      {
        id: 'ba2',
        from: BBMD_A_ID,
        to: BBMD_B_ID,
        kind: 'request',
        plain: '（この呼びかけを、そちらに転送します）',
        protocol: 'BVLC Forwarded-NPDU',
        transport: '192.168.10.9 → 192.168.20.9（ユニキャスト）',
        action: '相手の BBMD へ転送する',
        explain:
          'BBMD A は、あらかじめ持っている配信先の一覧（BDT: Broadcast Distribution Table）を見て、そこに載っている BBMD B へ送ります。このとき使うのはブロードキャストではなく、宛先 IP を 1 つ指定したユニキャストです。ユニキャストならルータが転送してくれるので、サブネットの境界を越えられます。',
        annotation: 'ここが BBMD の肝。ブロードキャストを、荷造りし直して運ぶ',
      },
      {
        id: 'ba3',
        from: BBMD_B_ID,
        to: BROADCAST,
        kind: 'request',
        plain: '（預かった呼びかけを、こちらで配ります）',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: '192.168.20.255（サブネット B のブロードキャスト）',
        action: '自分のサブネットに配り直す',
        explain:
          '受け取った BBMD B が、今度は自分のサブネットにブロードキャストとして配り直します。空調コントローラと電力計から見れば、すぐ隣で誰かが呼びかけたのと区別がつきません。機器の側は BBMD のことを何も知らなくてよい、というのがこの仕組みの良いところです。',
      },
      {
        id: 'ba4',
        from: AHU_ID,
        to: BROADCAST,
        kind: 'response',
        plain: 'はい、空調コントローラです',
        protocol: 'Unconfirmed-REQ i-Am',
        transport: '192.168.20.255（サブネット B のブロードキャスト）',
        action: '名乗って返す',
        explain:
          '空調コントローラが名乗ります。I-Am もブロードキャストなので、これはサブネット B の中に広がります。ここでも BBMD B が受け取ります。',
      },
      {
        id: 'ba5',
        from: BBMD_B_ID,
        to: BBMD_A_ID,
        kind: 'response',
        plain: '（この返事を、そちらに転送します）',
        protocol: 'BVLC Forwarded-NPDU',
        transport: '192.168.20.9 → 192.168.10.9（ユニキャスト）',
        action: '相手の BBMD へ転送する',
        explain:
          '帰りもまったく同じ仕組みです。BBMD B が BDT に従って、BBMD A へユニキャストで転送します。',
      },
      {
        id: 'ba6',
        from: BBMD_A_ID,
        to: BROADCAST,
        kind: 'response',
        plain: '（預かった返事を、こちらで配ります）',
        protocol: 'Unconfirmed-REQ i-Am',
        transport: '192.168.10.255（サブネット A のブロードキャスト）',
        action: '自分のサブネットに配り直す',
        explain:
          'BBMD A がサブネット A に配り直し、中央監視にようやく返事が届きます。BBMD を 2 台置いて互いを登録しておくだけで、サブネットが分かれていても、中央監視はいつもどおり機器を見つけられるようになりました。',
        annotation: '中央監視も空調も、設定は何も変えていない',
      },
    ],
  },
]
