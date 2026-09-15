import type { ExtraContent } from '../domain/types'

/**
 * 番外編。本編（IP 編・SC 編）のセキュリティの話とは軸が違うので、
 * 1〜7 の流れには混ぜず、別の入り口（ドロップダウン）から開く。
 */
export const extras: ExtraContent[] = [
  {
    id: 'bbmd',
    world: 'bbmd',
    navLabel: 'サブネットを跨ぐなら（BBMD）',
    title: 'BBMD ── サブネットを越えて届ける',
    lead: '建物が大きくなり、ネットワークが複数のサブネットに分かれると、ブロードキャストはそのままでは届かない。',
    paragraphs: [
      'Who-Is のような「全員への呼びかけ」（ブロードキャスト）は、同じサブネットの中にしか届きません。中央監視と空調コントローラが別のサブネットにいると、呼びかけても返事が来ません。',
      'これを解決するのが BBMD（BACnet Broadcast Management Device）です。各サブネットに 1 台ずつ置き、届いたブロードキャストを、あらかじめ登録された相手（Broadcast Distribution Table）へユニキャストで転送します。転送を受け取った側は、それを自分のサブネットにもう一度ブロードキャストし直します。',
      '下の 2 つのボタンで、BBMD がない場合とある場合を見比べられます。',
      'BACnet/SC では、この設定が要らなくなります（ステップ5 の注記）。ハブがメッセージを配るので、サブネットをまたぐための BBMD や、その配信先リストの管理は、そもそも出てきません。',
    ],
    notes: [
      {
        id: 'bbmd-std-scope',
        confidence: 'standard',
        text: 'BACnet/IP のブロードキャストは、IP の仕組み上サブネットを越えません。BBMD は Broadcast Distribution Table（BDT）に従い、ブロードキャストをユニキャスト（Forwarded-NPDU）で他の BBMD に転送し、転送先で再びローカルブロードキャストとして配ります。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'bbmd-std-fdr',
        confidence: 'standard',
        text: '固定の BBMD を置けない場合（機器が 1 台だけ他のネットワークにいる、など）には、Foreign Device 登録という別の仕組みもあります。これも Annex J で定義されています。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
    ],
  },
]
