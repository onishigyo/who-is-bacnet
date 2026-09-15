import type { StepContent } from '../domain/types'

/**
 * 各ステップの解説文。
 * 断定してよいのは規格で確立している事柄だけ。制作者の理解・解釈は
 * notes に confidence: 'interpretation' として分離し、本文で断定しない。
 */
export const steps: StepContent[] = [
  {
    id: 'what-is-bacnet',
    order: 1,
    chapter: 'IP 編',
    world: 'ip',
    navLabel: 'BACnet とは',
    title: 'BACnet とは何か',
    lead: 'メーカーの違う設備機器どうしが、同じ言葉で会話するための共通語。',
    paragraphs: [
      'BACnet（Building Automation and Control Networks）は、ビルの空調・照明・電力といった設備機器が情報をやりとりするための通信仕様です。ANSI/ASHRAE Standard 135 として標準化され、ISO 16484-5 にもなっています。',
      'BACnet の世界では、機器は「オブジェクト」の集まりとして表現されます。たとえば温度センサの測定値は analog-input オブジェクトの present-value プロパティ、設定温度は analog-value オブジェクトの present-value、という具合に、読み書きの対象が決まった形に整理されています。',
      'メーカーが違っても、この形に従っていれば同じ手順で読み書きできます。「A 社の機器と B 社の機器が会話できない」という問題を解くために作られた共通語が BACnet です。',
      'いま図にあるのは空調コントローラ 1 台だけ。ここではまだネットワークの話をしません。BACnet はまず「機器が喋る言葉」の取り決めである、という点を押さえてください。',
    ],
    notes: [
      {
        id: 'std-135',
        confidence: 'standard',
        text: 'BACnet は ANSI/ASHRAE Standard 135 として標準化された公開仕様であり、特定メーカーの独自規格ではありません。',
        source: 'ANSI/ASHRAE Standard 135 / ISO 16484-5',
      },
      {
        id: 'std-device-object',
        confidence: 'standard',
        text: 'すべての BACnet 機器は Device オブジェクトを 1 つ持ち、そこに機器を識別するデバイスインスタンス番号（0〜4194302）があります。',
        source: 'ANSI/ASHRAE Standard 135（Device オブジェクト）',
      },
    ],
  },
  {
    id: 'bacnet-ip',
    order: 2,
    chapter: 'IP 編',
    world: 'ip',
    navLabel: 'BACnet/IP とは',
    title: 'BACnet/IP とは何か',
    lead: 'その言葉を、ふだんの IP ネットワーク（LAN）の上で喋れるようにしたもの。',
    paragraphs: [
      '機器に IP アドレスが付き、すでにある LAN・スイッチ・ルータをそのまま使って BACnet を運べるようにしたのが BACnet/IP です。設備専用の配線を新たに引かなくてよいので、導入のハードルが大きく下がりました。',
      '実体はシンプルです。BACnet のメッセージの前に BVLC（BACnet Virtual Link Control）という小さなヘッダを付け、UDP のポート 47808（16 進で 0xBAC0）で送る。それだけです。',
      '「どなたかいますか？」のような呼びかけは、サブネット内のブロードキャストとして飛びます。サブネットをまたいで届けたいときは、BBMD（BACnet Broadcast Management Device）や Foreign Device 登録という仕組みで中継します。',
      'ここで覚えておいてほしいのは、BACnet/IP は「IP ネットワークの上で動く」ということです。つまり、その IP ネットワークに入れる人は、BACnet の会話にも入れます。',
    ],
    notes: [
      {
        id: 'std-annex-j',
        confidence: 'standard',
        text: 'BACnet/IP は規格の Annex J で定義されています。UDP ポート 47808（0xBAC0）は既定値で、設定で変更することもできます。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
    ],
  },
  {
    id: 'interoperability',
    order: 3,
    chapter: 'IP 編',
    world: 'ip',
    navLabel: '便利な側面',
    title: '便利な側面 ── 実際の会話を見る',
    lead: 'メーカーの違う機器が同じネットワークに並び、中央監視から一括で読み書きできる。',
    paragraphs: [
      '図に機器が増え、中央監視装置（スーパーバイザ）が繋がりました。ここから先は、中央監視が機器を探し、値を読み、値を書く、というだけで建物中の設備を扱えます。',
      '会話は驚くほど素直です。「どなたかいますか？」（Who-Is）に対して「私はここにいます、ID はこれです」（I-Am）と返る。あとは「このオブジェクトのこのプロパティを読ませて」（ReadProperty）、「この値を書いて」（WriteProperty）。これだけで成立します。',
      'この素直さこそ、BACnet が広く使われている理由です。特別な準備をしなくても、同じネットワークに繋げば会話が成立する。まずはこの便利さを見てください。',
      '図の下にある「会話を始める」を押すと、やり取りが図の下にずらりと並びます。ひとつ押すと、その通信が図の上で再生され、意訳・実際のコマンド・宛先・いま何が起きているかの解説が出ます。左から順に押していけば、会話の流れをたどれます。',
    ],
    notes: [
      {
        id: 'std-services',
        confidence: 'standard',
        text: 'Who-Is / I-Am は確認応答を伴わないサービス（unconfirmed service）です。ReadProperty / WriteProperty は確認応答を伴うサービス（confirmed service）で、読み取りは値を含む ComplexACK、書き込みの成功は SimpleACK が返ります。',
        source:
          'ANSI/ASHRAE Standard 135（Object Access Services / Remote Device Management Services）',
      },
      {
        id: 'std-addressing',
        confidence: 'standard',
        text: 'ReadProperty / WriteProperty の要求そのものには、相手の機器を指す情報は入っていません。中身は「どのオブジェクトの、どのプロパティか」だけです。どの機器に届くかは、その下の層 ── BACnet/IP なら宛先 IP アドレスと UDP ポート ── が決めます。つまり会話の相手は、IP で指定されています。',
        source:
          'ANSI/ASHRAE Standard 135（ReadProperty / WriteProperty Service、Annex J）',
      },
      {
        id: 'std-iam-address',
        confidence: 'standard',
        text: 'I-Am が伝えるのは、デバイスインスタンス番号・受け入れ可能な APDU の最大長・セグメンテーション対応・ベンダー ID です。IP アドレスは入っていません。「どの IP にどの機器がいるか」が分かるのは、その I-Am が届いたパケットの送信元アドレスからです。中央監視は、この対応を覚えてから名指しの読み書きに移ります。',
        source: 'ANSI/ASHRAE Standard 135（I-Am Service）',
      },
      {
        id: 'std-iam-burst',
        confidence: 'standard',
        text: 'Who-Is の条件に当てはまる機器は、それぞれが I-Am を返します。呼びかけは 1 回でも、返事は台数ぶん発生します。この図で返事がまとめて飛ぶのは、そのためです。',
        source: 'ANSI/ASHRAE Standard 135（Who-Is / I-Am Service）',
      },
      {
        id: 'interp-whois-storm',
        confidence: 'interpretation',
        text: '機器の多い環境では、この返事が短時間に集中してネットワークを圧迫することがあると、ベンダーの技術記事で指摘されています（現場では「Who-Is ストーム」と呼ばれます）。規格そのものの記述ではなく、制作者も実環境では未確認です。',
      },
      {
        id: 'std-iam-broadcast',
        confidence: 'standard',
        text: 'I-Am は、もともと規格ではブロードキャストで送ることが求められていました。Addendum 135-2008q でこれが緩和され、ブロードキャストまたはユニキャストのどちらでもよくなっています（ただし Who-Is を送った相手に必ず届く形で送ること）。この図では、尋ねた相手へ返す形で描いています。制作者の実験でも、機器は尋ねた相手へユニキャストで返していました（IP 版のキャプチャで確認）。',
        source:
          'ANSI/ASHRAE Addendum q to Standard 135-2008（135-2008q-1、Clause 16.10.4 の変更）',
      },
    ],
  },
  {
    id: 'no-auth',
    order: 4,
    chapter: 'IP 編',
    world: 'ip',
    navLabel: '危険性',
    title: '危険性 ── 話し手が変わるだけ',
    lead: '同じネットワークに現れた誰かが、中央監視とまったく同じ言葉で割り込める。',
    paragraphs: [
      '平和だったネットワークに、持ち込まれた PC が 1 台つながりました。図の下の「持ち込まれた PC を操作する」を押すと、その PC からの通信が並びます。ひとつ押すと図で再生される ── ステップ3とまったく同じ操作です。',
      'やることは前のステップとまったく同じです。機器を探し（Who-Is）、値を読み（ReadProperty）、値を書く（WriteProperty）。違うのは話し手だけ。それでも機器は同じように応答します。',
      'BACnet/IP には、相手が誰かを確かめる仕組み（認証）も、中身を隠す仕組み（暗号化）もありません。届いた要求が中央監視から来たのか、持ち込まれたノート PC から来たのかを、機器は区別できません。',
      'つまり BACnet/IP のセキュリティは、「そのネットワークに入れないこと」だけに乗っています。入られた時点で、設備は操作できる状態になります。',
    ],
    notes: [
      {
        id: 'std-no-auth',
        confidence: 'standard',
        text: 'BACnet/IP（Annex J）自体には、送信元を検証する認証の仕組みも、通信を暗号化する仕組みもありません。ネットワーク的に到達できるノードからの要求は、送信元を確認されずに処理されます。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'std-write-may-fail',
        confidence: 'standard',
        text: '「認証がない」ことと「どんな書き込みも必ず通る」ことは別の話です。プロパティが読み取り専用だったり、値が範囲外だったり、Priority Array の優先度で上書きされたりすれば Error や Reject が返ります。ただしこれはデータモデル上の制約であって、送信元を確かめるセキュリティ機構ではありません。',
        source: 'ANSI/ASHRAE Standard 135（WriteProperty / Priority Array）',
      },
      {
        id: 'std-target-by-ip',
        confidence: 'standard',
        text: '攻撃側も、特別なことは何もしていません。Who-Is への返事で「どの IP にどの機器がいるか」を知り、その IP へ普通のユニキャストで読み書きを送っているだけです。機器から見れば、宛先 IP に届いた正しい形の要求であり、中央監視からのものと区別する材料がありません。',
        source: 'ANSI/ASHRAE Standard 135 Annex J',
      },
      {
        id: 'interp-segmentation',
        confidence: 'interpretation',
        text: '実際の建物ネットワークがどの程度ほかのネットワークから分離されているかは現場ごとに異なります。「同じネットワークに入れてしまえば」という前提がどれだけ現実に起きやすいかについては、制作者の理解であり検証が必要です。',
      },
      {
        id: 'std-sc-answer',
        confidence: 'standard',
        text: 'この問題に対する規格側の答えが BACnet/SC です。Addendum 135-2016bj として追加され、ANSI/ASHRAE 135-2020 に取り込まれました。TLS の上で WebSocket を使い、X.509 証明書を持つ機器だけがハブに参加できます（このアプリでは SC 編として別途扱います）。',
        source: 'ANSI/ASHRAE Standard 135-2020（Addendum 135-2016bj）',
      },
    ],
  },
  {
    id: 'bacnet-sc',
    order: 5,
    chapter: 'SC 編',
    world: 'sc',
    navLabel: 'BACnet/SC とは',
    title: 'BACnet/SC ── 参加に証明書が要る',
    lead: '同じネットワークにいるだけでは、もう入れない。証明書を持つ機器だけが、ハブを通して会話する。',
    paragraphs: [
      'ここまで見てきた無認証・丸見えの問題に、規格の側から答えたのが BACnet/SC（Secure Connect）です。図が変わりました。真ん中に「ハブ」があり、証明書を持つ機器が ── 中央監視装置も含めて ── それぞれハブに繋ぎにいきます。',
      '繋ぎ方は、いつもの Web と同じ仕組みです。機器はハブに wss（TLS で暗号化した WebSocket）で接続し、そのとき X.509 証明書を示します。ハブは証明書を確かめ、正しければ参加を認めます。以降のやり取りは、すべてこの暗号化されたトンネルの中を通ります。',
      'IP 編との一番の違いは「参加できるかどうかが、証明書だけで決まる」ことです。同じネットワークに繋がっているかどうかは、もう関係ありません。ブロードキャストで探し回る必要もなく、ハブが相手へメッセージを配ります。',
      '流れは二段です。まず証明書を持つ機器がハブに参加し（入り口の認証）、そのあと中央監視が機器を読み書きします（暗号化された運用）。下の「会話を始める」を押すと、この流れが図の下に並びます。ひとつ押せば図で再生されます。中身は暗号化されていて傍受しても読めない ── それは次のステップの答え合わせで確かめます。',
    ],
    notes: [
      {
        id: 'sc-std-topology',
        confidence: 'standard',
        text: 'BACnet/SC は hub-and-spoke のトポロジを取ります。中央のハブ機能がノード間のトラフィックを中継し、各ノードはハブへ WebSocket（wss スキーム）で接続します。通信は TLS 1.3 で暗号化され、機器は X.509 証明書で相互に認証します。',
        source:
          'ANSI/ASHRAE Standard 135（Addendum 135-2016bj）/ ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-std-hub-function',
        confidence: 'standard',
        text: 'この図では分かりやすさのため専用のハブを 1 つ置いていますが、ハブは専用の箱とは限りません。「ハブ機能（hub function）」という役割で、単純な機器から施設全体のワークステーションまで、どのノードでも担えます（たとえば中央監視装置がハブを兼ねることもできます）。ハブは単一障害点になるため、規格はプライマリのハブとフェイルオーバー用のハブの両方に繋げることをノードに求めています。',
        source: 'ASHRAE BACnet/SC ホワイトペーパー（Topology）',
      },
      {
        id: 'sc-std-handshake',
        confidence: 'standard',
        text: 'ハブへの接続は段階を踏みます。まず TCP の 3way ハンドシェイク（SYN → SYN/ACK → ACK）で土台を作り、その上で TLS ハンドシェイク（TLS 1.3 は 1 往復）で証明書を交換して暗号化を確立し、さらに WebSocket に切り替えて BACnet/SC のメッセージを流します。「3way ハンドシェイク」は TCP の用語で、TLS のハンドシェイクとは別のものです。',
        source: 'RFC 793（TCP）/ RFC 8446（TLS 1.3）/ RFC 6455（WebSocket）',
      },
      {
        id: 'sc-std-no-broadcast',
        confidence: 'standard',
        text: 'BACnet/SC では、IP 編で使っていたブロードキャストや BBMD、固定 IP アドレスへの依存がなくなります。相手を探して一斉に呼びかける代わりに、ハブがメッセージを配ります。',
        source: 'ASHRAE BACnet/SC ホワイトペーパー',
      },
    ],
  },
  {
    id: 'sc-defense',
    order: 6,
    chapter: 'SC 編',
    world: 'sc',
    navLabel: '危険性は防げるか',
    title: '危険性は防げるか ── 入り口で止める',
    lead: 'IP 編では同じ言葉で割り込めた攻撃者が、SC では会話に入る前に弾かれる。',
    paragraphs: [
      'IP 編と同じ「持ち込まれた PC」が、SC のネットワークにも現れます。やることも同じ ── ハブに繋いで、機器と会話しようとします。',
      'ですが、今度は入り口で止まります。ハブは相手に証明書を求め、持ち込まれた PC はそれを出せません。ハブは短い返事を 1 つ返し、接続はそこで終わります。Who-Is も ReadProperty も、送る前に締め出されました。IP 編では「同じネットワークにいれば会話に割り込めた」のが、SC では「証明書がなければ会話に入れない」に変わります。',
      'もう 1 つの危険だった盗み見も防がれます。証明書を持つ機器どうしの通信は TLS で暗号化されていて、Wireshark で見ても Application Data としか映りません。',
      '図の下の「持ち込まれた PC を操作する」を押すと、ハブに断られるまでのやり取りが並びます。ひとつ押せば図で再生され、右の答え合わせの該当行が光ります。その下では、IP と SC の Wireshark を並べて「読める」と「読めない」を見比べられます。',
    ],
    notes: [
      {
        id: 'sc-std-cert-gate',
        confidence: 'standard',
        text: 'BACnet/SC では、ハブと機器が互いに X.509 証明書を確かめ合います（相互認証）。証明書を示せないノードはハブとの接続を確立できず、BACnet/SC の会話（Who-Is や ReadProperty）までたどり着けません。',
        source:
          'ANSI/ASHRAE Standard 135-2020 Annex AB（BACnet/SC）/ ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-std-tls13-client-auth',
        confidence: 'standard',
        text: 'TLS 1.3 で相手にも証明書を求めるとき、サーバーは自分の証明書に続けて CertificateRequest を送ります。証明書を持たないクライアントは空の Certificate を返し、サーバーはそこで certificate_required の Alert を送って打ち切ることができます。クライアントは自分の Finished を送った時点で次のデータを送り始められるため、クライアント側からは「ハンドシェイクが終わったあとで断られた」ように見えます。',
        source: 'RFC 8446（TLS 1.3）4.3.2 / 4.4.2.4',
      },
      {
        id: 'sc-std-encrypted',
        confidence: 'standard',
        text: 'TLS 1.3 では、Server Hello より後のやり取りが暗号化されます。暗号化されたレコードは、中身がデータでもエラー通知（Alert）でも、外から見える種別は常に Application Data です。証明書の交換も拒否の通知も、Wireshark には Application Data としか映りません。「読めない」ことは弱点ではなく、盗み見を防ぐという目的の達成そのものです。',
        source: 'RFC 8446（TLS 1.3）5.2',
      },
      {
        id: 'sc-interp-rejection',
        confidence: 'interpretation',
        text: '暗号化されていても、データの大きさは読めます。証明書なしで繋いだとき、持ち込まれた PC がハブに送ったデータは 77 バイト（No.278）。証明書ありのときの 1157 バイト（No.235）と比べ、空の証明書と Finished だけが入る大きさでした。ハブの返事（No.279）は 19 バイトで、暗号化の付け足しを除くと 2 バイト ── Alert 1 つと同じ大きさです。ここから「証明書がないので断られた」と読んでいますが、中身を復号したわけではありません。どの Alert だったか（certificate_required など）は、ハブ側のログで確かめられるまで要検証です。',
      },
    ],
  },
  {
    id: 'sc-limits',
    order: 7,
    chapter: 'SC 編',
    world: 'sc',
    navLabel: 'SC の限界',
    title: 'SC の限界 ── 銀の弾丸ではない',
    lead: '証明書は入り口を固める。だが、現実の建物すべてを守れるわけではない。',
    paragraphs: [
      'BACnet/SC は「参加の可否を証明書で決める」という点で、IP 編の無認証・丸見えの問題に正面から答えます。ただし、これですべてが解決するわけではありません。公平に、限界も見ておきます。',
      '一つは、既存機器の対応です。古い設備の多くは証明書を扱えず、現実の建物では全機器を一度に SC 化することは困難です。SC と旧来の BACnet/IP が混在すると、その境界が新たな弱点になりえます。',
      'もう一つは、運用です。証明書は「持っていれば安全」ではなく、正しく発行し、期限を管理し、設定を誤らないことまで含めて、はじめて機能します。設定ミス一つでセキュリティが働かなくなる余地は残ります。',
      'このアプリは、実務者が壁打ちで学んだ内容を教材にしたものです。SC についても、確立した規格の事実と、制作者の理解・要検証の事柄を分けて示しています。ここから先は、一次情報（ANSI/ASHRAE 135）と実機の仕様で確かめてください。',
    ],
    notes: [
      {
        id: 'sc-std-backward',
        confidence: 'standard',
        text: 'BACnet/SC は既存の BACnet と後方互換で、ルータを介して旧来の BACnet/IP・MS-TP セグメントと相互接続できます。段階的な導入が前提の設計です。',
        source: 'ASHRAE BACnet/SC ホワイトペーパー',
      },
      {
        id: 'sc-interp-legacy',
        confidence: 'interpretation',
        text: '「既存機器の多くが証明書に対応できず、全機器の SC 化は現実には難しい」というのは、制作者の理解です。個々の製品の対応状況は、その製品の仕様で確認が必要です。特定の製品・メーカーについての断定は避けています。',
      },
      {
        id: 'sc-interp-operation',
        confidence: 'interpretation',
        text: '証明書運用の難しさ（発行・失効・設定ミスのリスク）は、制作者が実験中に実際に遭遇した範囲の理解です。どの設定ミスがどの結果を招くかは、環境ごとに検証が必要です。',
      },
      {
        id: 'sc-interp-mixed',
        confidence: 'interpretation',
        text: 'IP と SC の混在で境界が弱点になりうる、というのは制作者の理解であり要検証です。実際の被害の広がりやすさは、ネットワーク構成に依存します。',
      },
    ],
  },
]
