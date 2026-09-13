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
      '下の「会話を始める」を押すと、1 通ずつ送れます。自動では進みません。意訳・実際のコマンド・いま何が起きているかの解説を読んでから、次の 1 通を送ってください。',
    ],
    notes: [
      {
        id: 'std-services',
        confidence: 'standard',
        text: 'Who-Is / I-Am は確認応答を伴わないサービス（unconfirmed service）です。ReadProperty / WriteProperty は確認応答を伴うサービス（confirmed service）で、読み取りは値を含む ComplexACK、書き込みの成功は SimpleACK が返ります。',
        source:
          'ANSI/ASHRAE Standard 135（Object Access Services / Remote Device Management Services）',
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
      '平和だったネットワークに、持ち込まれた PC が 1 台つながりました。下のコンソールで、その PC を操作してみてください。',
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
