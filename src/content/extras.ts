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
 * 「ネットワークが分かれた建物をどう扱うか」という別の軸。
 * 同じ建物を条件を変えて見比べるので、説明も場面ごとに持つ。
 */
export const extras: ExtraContent[] = [
  {
    id: 'bbmd',
    navLabel: 'ルータの向こうの機器を探す方法',
    menuSummary: 'BBMD と、BACnet/SC ならどうなるか',
    stages: [
      {
        id: 'bbmd-none',
        navLabel: 'BBMD なし',
        world: 'bbmd',
        order: BBMD_BEFORE,
        conversationId: BBMD_BEFORE_CONVERSATION_ID,
        title: 'ネットワークが分かれると、呼びかけが届かない',
        lead: 'ルータで繋がっているのに、向こう側の機器が見つからない。',
        paragraphs: [
          '大きな建物では、ネットワークがいくつかの区画（サブネット）に分かれ、そのあいだをルータが繋ぎます。',
          '機器を探す Who-Is は「全員への呼びかけ」（ブロードキャスト）です。ブロードキャストはルータを越えません。だから中央監視の呼びかけは、同じサブネット A の中にしか届かず、サブネット B の空調や電力計からは返事が来ません。',
          '図の下の「会話を始める」を押して、呼びかけがルータで止まる様子を見てください。',
        ],
        notes: [
          {
            id: 'bbmd-std-no-cross',
            confidence: 'standard',
            text: 'ブロードキャストは、ふつうサブネットを越えません。規格は、2 つ以上のサブネットにまたがる BACnet/IP では、各サブネットに最低 1 台の BBMD を置くことを求めています。',
            source: [
              { label: '規格', text: 'ANSI/ASHRAE Standard 135 Annex J J.4.3' },
              { label: '確認', text: '追補 135-2012ai が同条を引用' },
            ],
          },
        ],
      },
      {
        id: 'bbmd-yes',
        navLabel: 'BBMD あり',
        world: 'bbmd',
        order: BBMD_AFTER,
        conversationId: BBMD_AFTER_CONVERSATION_ID,
        title: 'BBMD ── 呼びかけを、1 対 1 の通信で運び直す',
        lead: 'ルータが通さないのはブロードキャストだけ。1 対 1 の通信なら通る。',
        paragraphs: [
          '各サブネットに BBMD（BACnet Broadcast Management Device）を 1 台ずつ置きます。BBMD は呼びかけを受け取ると、登録してある相手の BBMD へ、宛先を 1 つに決めた通信（ユニキャスト）で送ります。これならルータを越えられます。',
          '受け取った BBMD は、自分のサブネットに呼びかけを配り直します。機器の側は何も変えなくてよく、いつもどおり返事をするだけです。',
          '返事の I-Am は、尋ねた相手 1 台へのユニキャストなので、BBMD を通らずルータをそのまま越えて戻ります。BBMD が要るのは、行きの呼びかけだけです。',
          '相手の BBMD の登録先は BDT（Broadcast Distribution Table）という表で、自動では決まりません。設定する人が BBMD ごとに入れる必要があります。',
        ],
        notes: [
          {
            id: 'bbmd-std-forward',
            confidence: 'standard',
            text: 'BBMD は、受け取ったブロードキャストを BDT に載った相手の BBMD へ送り（Forwarded-NPDU）、受け取った側が自分のサブネットに配り直します。この「2 ホップ方式」への対応は規格が BBMD に求めています。',
            source: [
              {
                label: '規格',
                text: 'ANSI/ASHRAE Standard 135 Annex J J.2.5 / J.4.3',
              },
              {
                label: '確認',
                text: '追補 135-2008o・135-2012ai が同条を引用',
              },
            ],
          },
          {
            id: 'bbmd-std-iam',
            confidence: 'standard',
            text: 'I-Am は以前はブロードキャストで返す決まりでしたが、今はユニキャストでもよくなりました。この図はステップ 3 と同じく、尋ねた相手だけに返す形です。',
            source: [
              {
                label: '規格',
                text: 'ANSI/ASHRAE Standard 135-2008 追補 q（Clause 16.10.4 の変更。I-Am をユニキャストでもよいとした）',
              },
            ],
          },
          {
            id: 'bbmd-std-one-hop',
            confidence: 'standard',
            text: 'BDT の設定によっては、相手の BBMD を介さず相手のサブネットへ直接届ける「1 ホップ方式」もあります。ただし規格が求めるのは 2 ホップ対応で、1 ホップ対応は任意です。',
            source: [
              { label: '規格', text: 'ANSI/ASHRAE Standard 135 Annex J J.4.3' },
              { label: '確認', text: '追補 135-2012ai が同条を引用' },
            ],
          },
          {
            id: 'bbmd-interp-iam-broadcast',
            confidence: 'interpretation',
            text: 'I-Am をブロードキャストで返す機器なら、そのブロードキャストも BBMD が転送することになるので、帰りも BBMD を通ると理解しています。そういう機器での実機確認はしていません。',
          },
          {
            id: 'bbmd-std-fdr',
            confidence: 'standard',
            text: 'BBMD として設定できない機器は、BBMD に Foreign Device として登録できなければならない、と規格は定めています。BBMD を置けないサブネットの機器は、この仕組みで配ってもらいます。',
            source: [
              { label: '規格', text: 'ANSI/ASHRAE Standard 135 Annex J J.4.3' },
              { label: '確認', text: '追補 135-2012ai が同条を引用' },
            ],
          },
          {
            id: 'bbmd-interp-ops',
            confidence: 'interpretation',
            text: 'サブネットを増やすたびに、全 BBMD の BDT を更新して回る運用になると理解しています。製品でどこまで自動化されているかは確認できていません。',
          },
        ],
      },
      {
        id: 'bbmd-sc',
        navLabel: 'BACnet/SC なら',
        world: 'bbmd-sc',
        order: BBMD_SC,
        conversationId: BBMD_SC_CONVERSATION_ID,
        title: 'BACnet/SC なら、BBMD が要らない',
        lead: '同じ建物・同じ配線のまま、運び直す仕掛けが消える。',
        paragraphs: [
          'BACnet/SC では、どの機器もサブネットに関係なくハブへ繋ぎます。ハブへの接続は 1 対 1 の通信なので、ルータをそのまま越えられます。',
          '呼びかけはハブが繋がっている機器全員に配ります。BBMD も、BDT の設定も出てきません。',
          'L2 スイッチとルータは BBMD ありの図と同じです。SC にしても建物の配線は変わらず、変わるのはその上での届け方だけです。',
        ],
        notes: [
          {
            id: 'bbmd-std-sc-broadcast',
            confidence: 'standard',
            text: 'BACnet/SC でも Who-Is のような全員あての呼びかけは使います。IP のブロードキャストとしては流れず、ハブが各機器へ配るので、BBMD は要りません（ステップ 5 の注記と同じ内容です）。',
            source: [
              { label: '規格', text: 'ANSI/ASHRAE Standard 135-2020 Annex AB' },
              { label: '資料', text: 'ASHRAE BACnet/SC ホワイトペーパー' },
            ],
          },
        ],
      },
    ],
  },
]
