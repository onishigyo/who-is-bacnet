import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, SUPERVISOR_ID } from './diagram'
import { BBMD_A_ID, BBMD_B_ID, LIGHTING_ID } from './diagram-bbmd'

export const BBMD_BEFORE_CONVERSATION_ID = 'bbmd-before'
export const BBMD_AFTER_CONVERSATION_ID = 'bbmd-after'
export const BBMD_SC_CONVERSATION_ID = 'bbmd-sc'

/**
 * BBMD 番外編の会話。Before（BBMD なし）と After（BBMD あり）で、
 * 図の状態（BBMD_BEFORE / BBMD_AFTER）ごと切り替える。
 *
 * After は、BBMD の動きを省略せずに 3 手で描く。
 *   ① 送り主のサブネットに、ふつうにブロードキャストされる
 *   ② それを受け取った BBMD が、BDT に載っている相手 BBMD へ
 *      ユニキャスト（Forwarded-NPDU）で転送する
 *   ③ 受け取った側の BBMD が、自分のサブネットにブロードキャストし直す
 * 1 本の矢印で「境界を越えて届いた」と単純化しないことが要点。
 *
 * 帰りの I-Am はこの 3 手を踏まない。尋ねた相手だけに返すユニキャスト
 * なので（ステップ 3 の注記・実験キャプチャと同じ）、ルータをそのまま
 * 通って戻る。行きだけが BBMD を必要とする、という非対称がそのまま図に
 * 出るようにしている。ここを本編と食い違わせない。
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
          '中央監視がいつもどおり呼びかけます。宛先はサブネット A のブロードキャストアドレスです。L2 スイッチは、同じサブネットにいる照明コントローラと、その先の IP ルータへ配ります。ただしルータは、ブロードキャストをそこで捨てます。',
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
          '返事をしたのは、呼びかけが聞こえた照明コントローラだけ。サブネット B の空調コントローラと電力計は、そもそも呼びかけを受け取っていないので黙ったままです。線はルータでちゃんと繋がっているのに、ブロードキャストだけが越えられない ── ここが出発点です。',
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
          '中央監視のやることは、さっきとまったく同じです。ルータで止まるのも同じ。違うのは、この呼びかけをサブネット A に置いた BBMD A も受け取っている、という 1 点だけです。',
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
          'BBMD A は、あらかじめ持っている配信先の一覧（BDT: Broadcast Distribution Table）を見て、そこに載っている BBMD B へ送ります。このとき使うのはブロードキャストではなく、宛先 IP を 1 つ指定したユニキャストです。さっき呼びかけを捨てた同じルータが、今度はふつうに転送してくれます ── 図のとおり、パケットはルータを通って向こう側へ渡ります。',
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
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです',
        protocol: 'Unconfirmed-REQ i-Am',
        transport: '192.168.20.31 → 192.168.10.10（ユニキャスト）',
        action: '名乗って返す',
        explain:
          '空調コントローラが名乗ります。返す相手は、呼びかけを送ってきた中央監視 1 台だけ（ステップ 3 と同じで、制作者の実験でもそうでした）。つまり帰りはユニキャストなので、BBMD を通る必要がありません。図のとおり、ルータをそのまま通って中央監視へ戻ります。',
        annotation: 'BBMD が要るのは行きだけ。帰りはふつうに routed で戻る',
      },
    ],
  },
  {
    id: BBMD_SC_CONVERSATION_ID,
    title: 'BACnet/SC なら、どうなるか',
    messages: [
      {
        id: 'bs1',
        from: SUPERVISOR_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Who-Is（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '全員に呼びかける',
        encrypted: true,
        explain:
          '機器はサブネットに関係なく、それぞれハブへ繋いでいます。だから呼びかけはハブから全員に配られ、サブネット B の空調コントローラと電力計にもそのまま届きます。BBMD も、BDT の設定も、それを置くためのルータの扱いも出てきません。',
        annotation: '転送する仕掛けを、置く必要がない',
      },
      {
        id: 'bs2',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです',
        protocol: 'I-Am（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '名乗って返す',
        encrypted: true,
        explain:
          '返事もハブを通って戻ります。BBMD ありの図では、行きの呼びかけだけが「配る → BBMD が転送 → 配り直す」の 3 手を踏んでいました。ここではその 3 手がまるごと無くなり、行きも帰りも 1 手です。サブネットが分かれていること自体を、BACnet の側で気にしなくてよくなりました。',
      },
    ],
  },
]
