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
        source: [
          { label: '規格', text: 'ANSI/ASHRAE Standard 135 / ISO 16484-5' },
        ],
      },
      {
        id: 'std-device-object',
        confidence: 'standard',
        text: 'どの BACnet 機器も Device オブジェクトを 1 つ持ち、機器を見分けるデバイスインスタンス番号（0〜4194302）を持ちます。',
        source: [
          { label: '規格', text: 'ANSI/ASHRAE Standard 135 Clause 12.1.1' },
          { label: '確認', text: '追補 135-2016br が同条を引用' },
        ],
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
        text: 'UDP 47808（16 進で 0xBAC0）が BACnet 用に登録されたポートで、実験でもこれを使っています。別の番号にも変えられます。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135 Annex J（BACnet/IP の規定）',
          },
          { label: '補足', text: 'Annex J は追補 135-1995a で規格に追加' },
          {
            label: '登録',
            text: 'IANA ポート番号レジストリ 47808/udp =「bacnet」',
          },
        ],
      },
      {
        id: 'std-bbmd',
        confidence: 'standard',
        text: 'ブロードキャストはサブネットを越えません。越えて届けたいときは、BBMD や Foreign Device 登録という中継の仕組みを使います。',
        source: [
          { label: '規格', text: 'ANSI/ASHRAE Standard 135 Annex J J.4.3' },
          { label: '確認', text: '追補 135-2012ai が同条を引用' },
        ],
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
        text: 'Who-Is / I-Am は確認を返さない通信、ReadProperty / WriteProperty は確認を返す通信です。実験では読み取りが Complex-ACK、書き込みが Simple-ACK として見えます。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135 Clause 16.10.4 / 15.9.2',
          },
          { label: '確認', text: '追補 135-2008q・135-2016br が同条を引用' },
          { label: '実験', text: '制作者の実験キャプチャ' },
        ],
      },
      {
        id: 'std-addressing',
        confidence: 'standard',
        text: '届け先は、宛先の IP アドレスで決まります。相手の IP は、I-Am が届いたパケットの送信元から分かります（I-Am の中身に IP は入っていません）。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135 Clause 16.10（I-Am の内容。IP は含まれない）',
          },
          { label: '規格', text: 'Annex J（宛先は IP とポートで決まる）' },
          { label: '実験', text: '制作者の実験キャプチャ（ステップ4）で図示' },
        ],
      },
      {
        id: 'std-iam-broadcast',
        confidence: 'standard',
        text: 'I-Am は以前はブロードキャストで返す決まりでしたが、今はユニキャストでもよくなりました。この図も実験も、尋ねた相手だけに返しています。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2008 追補 q（Clause 16.10.4 の変更。I-Am をユニキャストでもよいとした）',
          },
        ],
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
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135 Annex J（BVLC のカプセル化だけを定める）',
          },
          {
            label: '実験',
            text: '制作者の実験キャプチャ（中身が平文で読める）',
          },
        ],
      },
      {
        id: 'std-clause24-removed',
        confidence: 'standard',
        text: '以前は通信に認証をかける仕組みが規格にありましたが、普及が限られ、BACnet/SC を加える際に削除されました。いまの答えは BACnet/SC です。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2016 追補 by（Clause 24 Network Security の削除とその理由）',
          },
        ],
      },
      {
        id: 'std-write-may-fail',
        confidence: 'standard',
        text: 'どんな書き込みでも通るわけではありません（読み取り専用や範囲外の値は失敗が返る）。ただしこれは値の決まりによる制限で、送り主を確かめる仕組みではありません。',
        source: [
          { label: '規格', text: 'ANSI/ASHRAE Standard 135 Clause 15.9.2' },
          { label: '確認', text: '追補 135-2016br が同条を引用' },
        ],
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
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020（BACnet/SC を加えた追補 135-2016bj を収録）',
          },
        ],
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
    lead: '同じ LAN にいるだけでは、もう入れない。認証局（CA）が署名した証明書を持つ機器だけが、ハブを通して会話する。',
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
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.1 / YY.7.4',
          },
        ],
      },
      {
        id: 'sc-std-cert-ca',
        confidence: 'standard',
        text: '各機器は、サイトの認証局（CA）が署名した自分の運用証明書と、相手を確かめるための CA の証明書を持ちます。相手の証明書がこの CA に署名されていなければ参加できません（ただ証明書を持っているだけでは足りません）。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC の証明書）',
          },
          { label: '資料', text: 'Chipkin など業界資料' },
        ],
      },
      {
        id: 'sc-std-hub-function',
        confidence: 'standard',
        text: 'BACnet/SC のネットワーク 1 つにつき、ハブ機能は 1 つ必要です。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.1.2',
          },
        ],
      },
      {
        id: 'sc-interp-hub-host',
        confidence: 'interpretation',
        text: 'この図のハブは専用機ですが、専用である必要はなく、中央監視などが兼ねられると理解しています（製品ではソフトウェアの機能として BACnet ルータ等に載ることが多いようです）。「どの機器でもハブ機能を持てる」という規格の明文は未確認です。',
      },
      {
        id: 'sc-std-hub-uri',
        confidence: 'standard',
        text: 'ハブへの繋ぎ先は、決まったポート番号ではなく URI（wss://…）で設定します。教材に出てくる 47900 は、制作者の実験環境で使った値です。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.7.5.1',
          },
          { label: '補足', text: 'wss 以外のスキームは繋がない' },
        ],
      },
      {
        id: 'sc-std-no-broadcast',
        confidence: 'standard',
        text: 'IP のブロードキャストや BBMD は要らなくなります。Who-Is のような全員あての呼びかけも、ハブが各機器へ配ります（規格は「ハブ機能はブロードキャストをすべてのハブ接続へ配る」としています）。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.1.2 付近',
          },
        ],
      },
      {
        id: 'sc-std-handshake',
        confidence: 'standard',
        text: 'ハブへの接続は 4 段階 ── ① TCP で通り道を作る → ② TLS で証明書を確かめ暗号化 → ③ WebSocket に切り替え → ④ BACnet/SC として参加を申し込む（Connect-Request / Accept）。証明書を出せない機器は②で止まります。',
        source: [
          {
            label: 'RFC',
            text: 'RFC 9293（TCP）/ RFC 8446（TLS 1.3）/ RFC 6455（WebSocket）4.1',
          },
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.6.2',
          },
        ],
      },
      {
        id: 'sc-interp-hop-by-hop',
        confidence: 'interpretation',
        text: 'ハブは宛先を読むために中身をいったん復号し、相手向けに暗号化し直して中継していると理解しています。暗号化は端から端までではなく、区間ごと（機器⇔ハブ、ハブ⇔機器）です。規格の原文では未確認です。',
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
      '回線上の盗み見も防がれます。最初のあいさつ（Client Hello / Server Hello）より後は暗号化されていて、Wireshark には Application Data としか映りません。',
      '図の下の「持ち込まれた PC を操作する」を押すと、やり取りと Wireshark の記録が並び、対応する行が光ります。',
    ],
    notes: [
      {
        id: 'sc-std-cert-gate',
        confidence: 'standard',
        text: 'BACnet/SC では、ハブと機器が互いに証明書を確かめます（相互認証）。証明書を示せない機器は、BACnet の会話までたどり着けません。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）YY.7.4',
          },
        ],
      },
      {
        id: 'sc-std-tls13',
        confidence: 'standard',
        text: 'TLS 1.3 では、証明書を求められた側が持っていなければ空の証明書を返し、求めた側は certificate_required の Alert で打ち切れます。暗号化後は、中身が Alert でも外からは Application Data に見えます。',
        source: [{ label: 'RFC', text: 'RFC 8446（TLS 1.3）4.4.2.4 / 5.2' }],
      },
      {
        id: 'sc-std-dummy-ccs',
        confidence: 'standard',
        text: 'キャプチャの Change Cipher Spec（276・278）は、古い中継機器を通りやすくするため TLS 1.3 が送る形だけのメッセージで、受け取った側は無視します（暗号化とは無関係）。中身のあるやり取りは Server Hello 以降すべて暗号化されています。',
        source: [
          {
            label: 'RFC',
            text: 'RFC 8446（TLS 1.3）Appendix D.4（Middlebox Compatibility Mode）',
          },
        ],
      },
      {
        id: 'sc-interp-rejection',
        confidence: 'interpretation',
        text: '断りの中身は暗号化されて読めません。ハブの返事（279）が TLS の Alert 1 つ分（19 バイト）だったことから断られたと読んでいます。どの Alert かはハブのログで確かめるまで要検証です。',
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
        source: [
          {
            label: '資料',
            text: 'ASHRAE BACnet/SC ホワイトペーパー（Scenario #3）',
          },
        ],
      },
      {
        id: 'sc-std-router-forward',
        confidence: 'standard',
        text: 'BACnet ルータは、中の命令（ReadProperty / WriteProperty）はそのままに、データリンクの殻だけ付け替えて中継します。BACnet/SC もデータリンクの一種なので、旧来の BACnet/IP と SC のあいだもまたげます。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Standard 135 Clause 6（ネットワーク層のルーティング）',
          },
          { label: '規格', text: 'Annex AB（BACnet/SC はデータリンク）' },
        ],
      },
      {
        id: 'sc-std-router-reach',
        confidence: 'standard',
        text: 'ASHRAE の手引きは、旧来の区画に入り込まれると、ルータで絞らない限りすべての区画にアクセスされる、としています。対策はルータで通信を絞ること（例：旧来の区画からは読み取りだけ許す）。',
        source: [
          {
            label: '資料',
            text: 'ASHRAE Managed BACnet Guidance Vol.1（運用手引き）14.4.1 Monitoring/Filtering',
          },
        ],
      },
      {
        id: 'sc-std-snet-sadr',
        confidence: 'standard',
        text: 'BACnet ルータは転送時に送り主のネットワーク番号とアドレス（SNET / SADR）を書き足します。受け取った機器は送り主を知れますが、旧来の側から来た情報が本物かを確かめる仕組みはありません。',
        source: [
          { label: '規格', text: 'ANSI/ASHRAE Standard 135 Clause 6.5.4' },
          { label: '確認', text: '追補 135-2016bj が同条を引用' },
          { label: '規格', text: 'Annex J（送り主を確かめる仕組みがない）' },
        ],
      },
      {
        id: 'sc-interp-hub-trust',
        confidence: 'interpretation',
        text: 'ハブは全機器の通信を中継し、その場で中身を扱います。乗っ取られると SC の暗号化は意味を失うので、ハブを載せる機器の守りがとりわけ重要です。規格の原文では未確認です。',
      },
      {
        id: 'sc-std-auth-vs-authz',
        confidence: 'standard',
        text: 'SC が確かめるのは「この機器がネットワークに入ってよいか」まで。入った機器が何を読み書きしてよいか（認可）は SC 自体では決まらず、別の追補 135-2020cp（OAuth などに基づく）で規格に加わりました。',
        source: [
          {
            label: '規格',
            text: 'ANSI/ASHRAE Addendum 135-2020cp（認証・認可を追加。BACnet/SC への変更も含む）',
          },
          {
            label: '資料',
            text: 'bacnet.org「Addendum 135-2020cp Now Published」',
          },
        ],
      },
      {
        id: 'sc-interp-legacy',
        confidence: 'interpretation',
        text: '通信を絞る機能があるかは製品によります（手引きの推奨で、規格の必須ではありません）。制作者は実機では確かめていません。既存機器の SC 対応度も製品ごとに確認が要ります。',
      },
      {
        id: 'sc-std-cert-expiry',
        confidence: 'standard',
        text: 'X.509 証明書には有効期限があり、期限を過ぎた証明書は確認に通りません。BACnet/SC はハブとの接続で証明書を確かめ合うので、期限切れの機器は繋がれなくなります。',
        source: [
          { label: 'RFC', text: 'RFC 5280（X.509 証明書）' },
          { label: '規格', text: 'ANSI/ASHRAE Standard 135-2020 Annex AB' },
        ],
      },
      {
        id: 'sc-interp-cert-keys',
        confidence: 'interpretation',
        text: '正規機器から証明書と秘密鍵を盗まれれば攻撃者も参加でき、CA の鍵が漏れれば誰にでも証明書を発行できてしまう ── 証明書は鍵の守りが肝だと理解しています。失効（取り消し）の扱いも運用課題で、規格での失効確認の詳細は未確認です。',
      },
      {
        id: 'sc-interp-operation',
        confidence: 'interpretation',
        text: '証明書の運用の難しさは、制作者が実験で証明書を作って試した範囲の実感です。',
      },
    ],
  },
]
