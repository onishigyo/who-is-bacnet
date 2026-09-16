import type { ExtraContent } from '../domain/types'
import {
  BBMD_AFTER_CONVERSATION_ID,
  BBMD_BEFORE_CONVERSATION_ID,
  BBMD_SC_CONVERSATION_ID,
} from './conversations-bbmd'
import { BBMD_AFTER, BBMD_BEFORE } from './diagram-bbmd'
import { BBMD_SC } from './diagram-bbmd-sc'

/**
 * ステップ 1〜7 とは別の画面としてメニューから開く読み物。
 * 1〜7 はセキュリティの話が一本の流れになっているが、こちらは
 * 「サブネットが分かれた建物をどう扱うか」という別の軸なので、
 * 同じ帯には混ぜない。
 */
export const extras: ExtraContent[] = [
  {
    id: 'bbmd',
    navLabel: 'サブネットを跨ぐなら',
    menuSummary: 'BBMD と、BACnet/SC ならどうなるか',
    title: 'BBMD ── ブロードキャストを、ユニキャストで運ぶ',
    lead: 'Who-Is はブロードキャスト。ブロードキャストはルータを越えない。では建物が複数のサブネットに分かれたら、機器はどうやって見つけるのか。',
    paragraphs: [
      'BACnet/IP の「探す」「名乗る」は、Who-Is も I-Am もブロードキャストです。そして IP のブロードキャストは、ルータが転送しません。建物が大きくなってネットワークがサブネットに分かれた瞬間、中央監視からは向こう側の機器が見えなくなります。',
      'かといって、機器の設定を全部書き換えて回るのは現実的ではありません。そこで各サブネットに 1 台ずつ置くのが BBMD（BACnet Broadcast Management Device）です。BBMD は、自分のサブネットに流れたブロードキャストを受け取り、あらかじめ登録しておいた相手の BBMD へ、宛先 IP を 1 つ指定した「ユニキャスト」として送り直します（BVLC Forwarded-NPDU）。ルータはユニキャストなら素通しするので、これで境界を越えられます。',
      '受け取った側の BBMD は、それを自分のサブネットにブロードキャストとして配り直します。だから機器の側は、BBMD の存在を何も知らなくてよい。「すぐ隣で誰かが呼びかけた」のと区別がつかないまま、いつもどおり返事をするだけです。',
      'BBMD が要るのは、この行きの片道だけです。帰りの I-Am は、尋ねてきた相手 1 台に返すユニキャストなので（ステップ 3 の注記のとおり、制作者の実験でもそうでした）、ルータをそのまま通って戻ります。困るのは「宛先を指定しない呼びかけ」だけ、ということです。',
      '相手の BBMD をどこに登録するかは BDT（Broadcast Distribution Table）という表で、これは自動では決まりません。BBMD を置く側が、手で設定してまわる必要があります。サブネットが増えれば、その数だけ増えていきます。',
      'そして BACnet/SC では、この仕組みごと要らなくなります。SC では機器がサブネットに関係なくハブへ繋ぎにいくので、ブロードキャストをユニキャストに包み直して運ぶ、という段取り自体が出てきません。',
      '下の 3 つを順に押して見比べてください。3 枚目で L2 スイッチもルータも BBMD も絵から消えるのは、配線が無くなったからではありません。この教材ではどの図にも「その世界で通信の届き方を決めるもの」だけを描いています。BACnet/IP では L2 スイッチとルータが届き方を決めるので描き、BACnet/SC ではハブとの接続が決めるのでハブだけを描く ── 気にしなくてよくなったものが絵から消える、という差です。',
    ],
    stages: [
      {
        id: 'bbmd-none',
        navLabel: 'BBMD なし',
        world: 'bbmd',
        order: BBMD_BEFORE,
        conversationId: BBMD_BEFORE_CONVERSATION_ID,
      },
      {
        id: 'bbmd-yes',
        navLabel: 'BBMD あり',
        world: 'bbmd',
        order: BBMD_AFTER,
        conversationId: BBMD_AFTER_CONVERSATION_ID,
      },
      {
        id: 'bbmd-sc',
        navLabel: 'BACnet/SC なら',
        world: 'bbmd-sc',
        order: BBMD_SC,
        conversationId: BBMD_SC_CONVERSATION_ID,
      },
    ],
    notes: [
      {
        id: 'bbmd-std-forward',
        confidence: 'standard',
        text: 'BACnet/IP のブロードキャストは、IP の仕組み上サブネットを越えません。BBMD は BDT（Broadcast Distribution Table）に従って、受け取ったブロードキャストを Forwarded-NPDU としてほかの BBMD へ送り、受け取った側がそれを自分のサブネットのブロードキャストとして配り直します。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'bbmd-std-fdr',
        confidence: 'standard',
        text: 'そのサブネットに BBMD を置けない場合（機器が 1 台だけ別のネットワークにいる、など）には、Foreign Device 登録という別の仕組みがあります。BBMD に「自分も配ってほしい」と登録しにいく形で、これも Annex J で定義されています。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'bbmd-std-iam',
        confidence: 'standard',
        text: 'I-Am は以前は全員に向けて（ブロードキャストで）返す決まりでしたが、Addendum 135-2008q で、尋ねた相手だけに返してもよくなりました。この図はステップ 3 と同じく、尋ねた相手だけに返す形で描いています（制作者の実験でも、I-Am は呼びかけた相手への 1 対 1 で返ってきました）。',
        source: 'ANSI/ASHRAE Standard 135 / Addendum 135-2008q',
      },
      {
        id: 'bbmd-interp-iam-broadcast',
        confidence: 'interpretation',
        text: 'I-Am をブロードキャストで返す機器なら、帰りも行きと同じ 3 手（配る → BBMD が転送 → 配り直す）を踏むことになる、と理解しています。手元にそういう機器がないため、実機では確かめられていません。',
      },
      {
        id: 'bbmd-interp-sc',
        confidence: 'interpretation',
        text: 'BACnet/SC でブロードキャストがハブからどう配られるかの細部は、Annex AB の原文で確認しきれていません。「BBMD と BDT の設定が要らなくなる」という結論は変わらないと理解していますが、配り方そのものの記述は要検証です。',
      },
      {
        id: 'bbmd-interp-ops',
        confidence: 'interpretation',
        text: 'BDT の中身は機種ごとの設定画面で入れることになり、サブネットを増やすたびに全 BBMD の BDT を更新して回る、という運用になると理解しています。実際の製品でどこまで自動化されているかは、確認できていません。',
      },
    ],
  },
]
