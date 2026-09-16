import type { StepContent } from '../domain/types'

/**
 * 各ステップの解説文。
 * 断定してよいのは規格で確立している事柄だけ。制作者の理解・解釈は
 * notes に confidence: 'interpretation' として分離し、本文で断定しない。
 * 初心者向けなので短く保つ。本文は 2〜3 段落、注記は 1〜2 文を目安にする。
 */
export const steps: StepContent[] = [
  {
    id: 'what-is-bacnet',
    order: 1,
    chapter: 'IP',
    world: 'ip',
    navLabel: 'BACnet とは',
    title: 'BACnet とは何か',
    lead: 'メーカーの違う設備機器どうしが、同じ言葉で会話するための共通語。',
    paragraphs: [
      'BACnet は、空調・照明・電力などのビル設備が情報をやりとりするための通信の決まりです。ANSI/ASHRAE Standard 135 として標準化され、ISO 16484-5 にもなっています。',
      '機器の中身は「オブジェクト」として表します。たとえば設定温度なら、analog-value というオブジェクトの present-value という値です。メーカーが違っても、この形に従えば同じ手順で読み書きできます。',
      'いま図にあるのは空調コントローラ 1 台だけ。まずは「機器が話す言葉」の決まりだと押さえてください。',
    ],
    notes: [
      {
        id: 'std-135',
        confidence: 'standard',
        text: 'BACnet は公開された標準規格で、特定メーカーの独自規格ではありません。',
        source: 'ANSI/ASHRAE Standard 135 / ISO 16484-5',
      },
      {
        id: 'std-device-object',
        confidence: 'standard',
        text: 'どの BACnet 機器も Device オブジェクトを 1 つ持ち、機器を見分けるデバイスインスタンス番号（0〜4194302）を持ちます。',
        source: 'ANSI/ASHRAE Standard 135（Device オブジェクト）',
      },
    ],
  },
  {
    id: 'bacnet-ip',
    order: 2,
    chapter: 'IP',
    world: 'ip',
    navLabel: 'BACnet/IP とは',
    title: 'BACnet/IP とは何か',
    lead: 'その言葉を、ふだんの LAN（IP ネットワーク）の上で話せるようにしたもの。',
    paragraphs: [
      '機器に IP アドレスを付け、今ある LAN やスイッチをそのまま使って BACnet を運ぶのが BACnet/IP です。専用の配線が要らないので、導入しやすくなりました。',
      '中身はシンプルで、BACnet のメッセージに小さなヘッダ（BVLC）を付け、UDP のポート 47808 で送るだけです。全員への呼びかけは、LAN のブロードキャストで飛びます。',
      '覚えておいてほしいのは一点だけ。その LAN に入れる人は、BACnet の会話にも入れます。',
    ],
    notes: [
      {
        id: 'std-annex-j',
        confidence: 'standard',
        text: 'BACnet/IP は規格の Annex J で定められています。UDP 47808（16 進で 0xBAC0）は既定値で、変更もできます。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'std-bbmd',
        confidence: 'standard',
        text: 'ブロードキャストはサブネットを越えません。越えて届けたいときは、BBMD や Foreign Device 登録という中継の仕組みを使います。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
    ],
  },
  {
    id: 'interoperability',
    order: 3,
    chapter: 'IP',
    world: 'ip',
    navLabel: '便利な側面',
    title: '便利な側面 ── 実際の会話を見る',
    lead: 'メーカーの違う機器が同じ LAN に並び、中央監視から一括で読み書きできる。',
    paragraphs: [
      '中央監視装置が加わりました。機器を探し（Who-Is）、名乗ってもらい（I-Am）、値を読み（ReadProperty）、書く（WriteProperty）。これだけで建物中の設備を扱えます。',
      '特別な準備がなくても、同じ LAN に繋げば会話が成り立つ。この手軽さが BACnet の大きな魅力です。',
      '図の下の「会話を始める」を押すと、やり取りが並びます。ひとつ押すと図で再生されます。',
    ],
    notes: [
      {
        id: 'std-services',
        confidence: 'standard',
        text: 'Who-Is と I-Am は、届いたことの確認（ACK）を返さない通信です。ReadProperty と WriteProperty は確認を返す決まりで、読むと値入りの ComplexACK、書き込めると SimpleACK が返ります。',
        source:
          'ANSI/ASHRAE Standard 135（Object Access Services / Remote Device Management Services）',
      },
      {
        id: 'std-addressing',
        confidence: 'standard',
        text: 'ReadProperty などの要求には、相手の機器の番号は入っていません。同じ LAN の中では、届け先は宛先の IP アドレスで決まります。相手の IP は、I-Am が届いたパケットの送信元アドレスから分かります（I-Am の中身に IP は入っていません）。',
        source: 'ANSI/ASHRAE Standard 135（ReadProperty / I-Am、Annex J）',
      },
      {
        id: 'std-iam-broadcast',
        confidence: 'standard',
        text: 'I-Am は以前は全員に向けて（ブロードキャストで）返す決まりでしたが、Addendum 135-2008q で、尋ねた相手だけに返してもよくなりました。この図も制作者の実験も、尋ねた相手だけに返しています。',
        source: 'ANSI/ASHRAE Addendum q to Standard 135-2008',
      },
    ],
  },
  {
    id: 'no-auth',
    order: 4,
    chapter: 'IP',
    world: 'ip',
    navLabel: '危険性',
    title: '危険性 ── 誰が送っても通ってしまう',
    lead: '同じ LAN に現れた誰かが、中央監視とまったく同じ言葉で割り込める。',
    paragraphs: [
      '持ち込まれた PC が 1 台つながりました。やることはステップ3と同じ ── 探して、読んで、書く。違うのは話し手だけです。それでも機器は同じように応じます。',
      'BACnet/IP には、送り主が本物の中央監視かを確かめる仕組み（認証）も、中身を隠す仕組み（暗号化）もありません。守りは「その LAN に入れないこと」だけ。入られた時点で、設備は操作できてしまいます。',
      '図の下の「持ち込まれた PC を操作する」を押すと、やり取りと、実験で取った Wireshark の記録が並びます。',
    ],
    notes: [
      {
        id: 'std-no-auth',
        confidence: 'standard',
        text: 'BACnet/IP（Annex J）そのものには、送り主を確かめる仕組みも、暗号化の仕組みもありません。届いた要求は、送り主を確かめずに処理されます。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'std-write-may-fail',
        confidence: 'standard',
        text: 'どんな書き込みでも通るわけではありません。読み取り専用のプロパティや範囲外の値なら Error が返ります。ただしこれは値の決まりによる制限で、送り主を確かめる仕組みではありません。',
        source: 'ANSI/ASHRAE Standard 135（WriteProperty）',
      },
      {
        id: 'interp-segmentation',
        confidence: 'interpretation',
        text: '実際の建物で「同じ LAN に入られる」ことがどれほど起きやすいかは、ネットワークの分け方しだいです。制作者は確かめていません。',
      },
      {
        id: 'std-sc-answer',
        confidence: 'standard',
        text: 'この問題への規格の答えが BACnet/SC です（Addendum 135-2016bj として追加され、135-2020 に収録）。ステップ 5 以降で扱います。',
        source: 'ANSI/ASHRAE Standard 135-2020（Addendum 135-2016bj）',
      },
    ],
  },
  {
    id: 'bacnet-sc',
    order: 5,
    chapter: 'SC',
    world: 'sc',
    navLabel: 'BACnet/SC とは',
    title: 'BACnet/SC ── 参加に証明書が要る',
    lead: '同じ LAN にいるだけでは、もう入れない。証明書を持つ機器だけが、ハブを通して会話する。',
    paragraphs: [
      'ここまでで見た「同じ LAN にいれば誰でも操作できて、中身も丸見え」という問題に、規格が出した答えが BACnet/SC（Secure Connect）です。真ん中にハブがあり、証明書を持つ機器が ── 中央監視も含めて ── それぞれハブに繋ぎます。',
      '暗号化には、Web サイトの https と同じ TLS という仕組みを使います。機器はハブに繋ぐときに証明書を見せ合い、そのあとのやり取りはすべて暗号化されます。',
      '図の下の「会話を始める」を押すと、機器がハブに参加し、中央監視が設定温度を読み書きする流れが並びます。',
    ],
    notes: [
      {
        id: 'sc-std-topology',
        confidence: 'standard',
        text: 'BACnet/SC では、各機器がハブに暗号化した接続（wss）で繋ぎ、基本はハブが機器どうしのメッセージを中継します。通信は TLS 1.3 で暗号化され、機器とハブは X.509 証明書で互いを確かめます。',
        source:
          'ANSI/ASHRAE Standard 135-2020 Annex AB / ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-interp-hub-function',
        confidence: 'interpretation',
        text: 'この図では専用のハブを 1 台置いていますが、ハブは専用の機器とは限らず、中央監視装置などが兼ねることもある、と制作者は理解しています。規格の原文では確かめていません。',
      },
      {
        id: 'sc-std-no-broadcast',
        confidence: 'standard',
        text: 'IP のブロードキャストや BBMD は要らなくなります。Who-Is のような全員あての呼びかけも、ハブが各機器へ配ります。',
        source:
          'ANSI/ASHRAE Standard 135-2020 Annex AB / ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-std-handshake',
        confidence: 'standard',
        text: 'ハブへの接続は 3 段階です。① TCP で通り道を作る（3way ハンドシェイク）② TLS で証明書を確かめて暗号化する ③ WebSocket に切り替えて BACnet を流す。①の 3way は TCP の言葉で、②の TLS のあいさつとは別物です。',
        source: 'RFC 9293（TCP）/ RFC 8446（TLS 1.3）/ RFC 6455（WebSocket）',
      },
    ],
  },
  {
    id: 'sc-defense',
    order: 6,
    chapter: 'SC',
    world: 'sc',
    navLabel: '危険性は防げるか',
    title: '危険性は防げるか ── 入り口で止める',
    lead: 'BACnet/IP では割り込めた PC が、SC では会話に入る前に断られる。',
    paragraphs: [
      '同じ「持ち込まれた PC」がハブに繋ごうとします。ハブは証明書を求めますが、PC は出せません。ハブは短い返事を 1 つ返し、接続はそこで終わります。Who-Is も ReadProperty も送れません。',
      '盗み見も防がれます。最初のあいさつ（Client Hello / Server Hello）より後は暗号化されていて、Wireshark には Application Data としか映りません。',
      '図の下の「持ち込まれた PC を操作する」を押すと、やり取りと Wireshark の記録が並び、対応する行が光ります。',
    ],
    notes: [
      {
        id: 'sc-std-cert-gate',
        confidence: 'standard',
        text: 'BACnet/SC では、ハブと機器が互いに証明書を確かめます（相互認証）。証明書を示せない機器は、BACnet の会話までたどり着けません。',
        source:
          'ANSI/ASHRAE Standard 135-2020 Annex AB / ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-std-tls13',
        confidence: 'standard',
        text: 'TLS 1.3 で証明書を求められた側が証明書を持っていなければ、空の証明書を返します。求めた側は、certificate_required の Alert を送って打ち切れます。暗号化されたデータは、中身が Alert でも外からは Application Data に見えます。',
        source: 'RFC 8446（TLS 1.3）4.4.2 / 4.4.2.4 / 5.2',
      },
      {
        id: 'sc-interp-rejection',
        confidence: 'interpretation',
        text: '断りの中身は暗号化されて読めません。ハブの返事（279）が TLS のエラー通知（Alert）1 つ分の大きさ（19 バイト）だったことから、断られたと読んでいます。どの Alert かは、ハブのログで確かめるまで要検証です。',
      },
    ],
  },
  {
    id: 'sc-limits',
    order: 7,
    chapter: 'SC',
    world: 'mixed',
    navLabel: 'SC の限界',
    title: 'SC の限界 ── これだけで安全とは限らない',
    lead: '証明書で入り口は固くなる。それでも残る課題がある。',
    paragraphs: [
      'まず、既存の機器（図の下半分）。SC に対応していない電力計はハブに参加できず、旧来の BACnet/IP の区画に残ります。そこに PC を持ち込まれれば、BACnet/IP と同じく読み書きできてしまいます。',
      'しかも、その要求はルータを越えて SC 側にも届きえます。図の下の「持ち込まれた PC を操作する」を押すと、まず電力計を読み、続けて SC 側の空調コントローラへ書き込みが通る様子が並びます。ルータで通信を絞っていなければ、こうなります（実機では未確認・ASHRAE の手引きに基づくシナリオ）。',
      '次に、運用（図の右上）。証明書の期限が切れた照明コントローラは、ハブに繋がれません。証明書は持っているだけでは守れず、正しく発行し、期限を管理して、はじめて役に立ちます。',
      'この教材は、実務者が学んだ内容をまとめたものです。最後は、規格（ANSI/ASHRAE 135）と実機の仕様で確かめてください。',
    ],
    notes: [
      {
        id: 'sc-std-backward',
        confidence: 'standard',
        text: 'SC と BACnet/IP が混ざる建物では、BACnet ルータで両者をつなぎます。ルータの先の旧来の側は、SC では守られません。',
        source: 'ASHRAE BACnet/SC ホワイトペーパー（Scenario #3）',
      },
      {
        id: 'sc-std-router-reach',
        confidence: 'standard',
        text: 'ASHRAE の手引きは、旧来の区画に入り込まれると、BACnet ルータで絞っていない限り、すべての BACnet ネットワーク区画にアクセスされる、としています。対策として、ルータで通信を絞ること（例：旧来の区画から来る要求は読み取りだけにする）を勧めています。',
        source: 'ASHRAE Managed BACnet Guidance Vol.1（14.4）',
      },
      {
        id: 'sc-interp-legacy',
        confidence: 'interpretation',
        text: '通信を絞る機能があるかは、ルータ製品によって違います（手引きの推奨で、規格の必須ではありません）。制作者は実機のルータでは確かめていません。既存機器がどれだけ SC に対応できるかも、製品ごとに確かめが必要です。',
      },
      {
        id: 'sc-std-cert-expiry',
        confidence: 'standard',
        text: 'X.509 証明書には有効期限があり、期限を過ぎた証明書は確認に通りません。BACnet/SC はハブとの接続で証明書を確かめ合うので、期限切れの機器は繋がれなくなります。',
        source:
          'RFC 5280（X.509 証明書）/ ANSI/ASHRAE Standard 135-2020 Annex AB',
      },
      {
        id: 'sc-interp-operation',
        confidence: 'interpretation',
        text: '証明書の運用の難しさは、制作者が実験で証明書を作って試した範囲の実感です。',
      },
    ],
  },
]
