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
    navLabel: '便利な側面',
    title: '便利な側面 ── 実際の会話を見る',
    lead: 'メーカーの違う機器が同じネットワークに並び、中央監視から一括で読み書きできる。',
    paragraphs: [
      '図に機器が増え、中央監視装置（スーパーバイザ）が繋がりました。ここから先は、中央監視が機器を探し、値を読み、値を書く、というだけで建物中の設備を扱えます。',
      '会話は驚くほど素直です。「どなたかいますか？」（Who-Is）に対して「私はここにいます、ID はこれです」（I-Am）と返る。あとは「このオブジェクトのこのプロパティを読ませて」（ReadProperty）、「この値を書いて」（WriteProperty）。これだけで成立します。',
      'この素直さこそ、BACnet が広く使われている理由です。特別な準備をしなくても、同じネットワークに繋げば会話が成立する。まずはこの便利さを見てください。',
      '図の下にある「会話を始める」を押すと、1 通目が飛びます。あとは「次へ」を押すたびに 1 通ずつ進みます。意訳・実際のコマンド・宛先・いま何が起きているかの解説を読んでから、次を送ってください。',
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
        text: 'I-Am は、もともと規格ではブロードキャストで送ることが求められていました。Addendum 135-2008q でこれが緩和され、ブロードキャストまたはユニキャストのどちらでもよくなっています（ただし Who-Is を送った相手に必ず届く形で送ること）。この図では、尋ねた相手へ返す形で描いています。制作者の実験でも、機器は尋ねた相手へユニキャストで返していました（ステップ4の答え合わせ No.2239：192.168.222.130 → 192.168.222.128）。',
        source:
          'ANSI/ASHRAE Addendum q to Standard 135-2008（135-2008q-1、Clause 16.10.4 の変更）',
      },
    ],
  },
  {
    id: 'no-auth',
    order: 4,
    navLabel: '危険性',
    title: '危険性 ── 話し手が変わるだけ',
    lead: '同じネットワークに現れた誰かが、中央監視とまったく同じ言葉で割り込める。',
    paragraphs: [
      '平和だったネットワークに、持ち込まれた PC が 1 台つながりました。右のコンソールで、その PC を操作してみてください。やり取りは図の下に出ます。',
      'やることは前のステップとまったく同じです。機器を探し（Who-Is）、値を読み（ReadProperty）、値を書く（WriteProperty）。最後に、書き換わったかを読み直して確かめます。違うのは話し手だけ。それでも機器は同じように応答します。',
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
]
