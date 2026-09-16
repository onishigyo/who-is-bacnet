import type { ExtraContent } from '../domain/types'

/**
 * 番外編。本編（IP 編・SC 編）のセキュリティの話とは軸が違うので、
 * 1〜7 の流れには混ぜず、別の入り口（ヘッダーのドロップダウン）から開く。
 */
export const extras: ExtraContent[] = [
  {
    id: 'bbmd',
    world: 'bbmd',
    navLabel: 'サブネットを跨ぐなら（BBMD）',
    title: 'BBMD ── ブロードキャストを、ユニキャストで運ぶ',
    lead: 'Who-Is はブロードキャスト。ブロードキャストはルータを越えない。では建物が複数のサブネットに分かれたら、機器はどうやって見つけるのか。',
    paragraphs: [
      'BACnet/IP の「探す」「名乗る」は、Who-Is も I-Am もブロードキャストです。そして IP のブロードキャストは、ルータが転送しません。建物が大きくなってネットワークがサブネットに分かれた瞬間、中央監視からは向こう側の機器が見えなくなります。',
      'かといって、機器の設定を全部書き換えて回るのは現実的ではありません。そこで各サブネットに 1 台ずつ置くのが BBMD（BACnet Broadcast Management Device）です。BBMD は、自分のサブネットに流れたブロードキャストを受け取り、あらかじめ登録しておいた相手の BBMD へ、宛先 IP を 1 つ指定した「ユニキャスト」として送り直します（BVLC Forwarded-NPDU）。ルータはユニキャストなら素通しするので、これで境界を越えられます。',
      '受け取った側の BBMD は、それを自分のサブネットにブロードキャストとして配り直します。だから機器の側は、BBMD の存在を何も知らなくてよい。「すぐ隣で誰かが呼びかけた」のと区別がつかないまま、いつもどおり返事をするだけです。行きの Who-Is も、帰りの I-Am も、同じ 3 手（配る → ユニキャストで転送 → 配り直す）を踏みます。',
      '下の 2 つのボタンで、BBMD がない場合とある場合を見比べてください。相手の BBMD をどこに登録するかは BDT（Broadcast Distribution Table）という表で、これは自動では決まりません。BBMD を置く側が、手で設定してまわる必要があります。',
      'BACnet/SC では、この仕組みが要らなくなります。SC はハブへの 1 対 1 の接続（TLS）でできていて、そもそもブロードキャストを IP のブロードキャストとして流さないからです。BDT を配って回る運用も、サブネットをまたぐための設計も、出てきません。',
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
        id: 'bbmd-interp-ops',
        confidence: 'interpretation',
        text: 'BDT の中身は機種ごとの設定画面で入れることになり、サブネットを増やすたびに全 BBMD の BDT を更新して回る、という運用になると理解しています。実際の製品でどこまで自動化されているかは、確認できていません。',
      },
    ],
  },
]
