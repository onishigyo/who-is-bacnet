import type { Conversation } from '../domain/types'
import { scRejectedCapture } from './captures'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'
import { SC_HUB_ID } from './diagram-sc'

export const SC_NORMAL_CONVERSATION_ID = 'sc-normal'
export const SC_ATTACK_CONVERSATION_ID = 'sc-attack'

/**
 * SC 編の会話。
 *
 * 流れ：まず証明書を持つ機器（中央監視も含む）がハブに参加する。そのあと、
 * 中央監視が機器を読み書きする ── 中身はすべて TLS の中を通る。
 * encrypted: true は、傍受しても Wireshark には Application Data としか
 * 映らない（＝中身が読めない）ことを表す。
 * rejected: true は、証明書のないノードがハブに門前払いされたことを表す。
 * そこから先、BACnet の会話（Who-Is や ReadProperty）には進まない。
 *
 * ステップ6の門前払いは実験キャプチャ（scRejectedCapture）と frame で結びつき、
 * protocol は Wireshark の Info 欄と同じ表記で書く。チップにしない TCP の行も
 * relatedFrames で前後のチップに割り当て、キャプチャの全行がどれかのチップで
 * 光るようにしている（logic/sc.test.ts で照合）。
 */
export const scConversations: Conversation[] = [
  {
    id: SC_NORMAL_CONVERSATION_ID,
    title: '証明書を持つ機器が、ハブに参加してから会話する',
    messages: [
      {
        id: 's1',
        from: AHU_ID,
        to: SC_HUB_ID,
        kind: 'request',
        plain: 'ハブに参加させてください（これが私の証明書です）',
        protocol:
          'wss 接続を確立（TCP 3way → TLS 1.3 → WebSocket / port 47900）',
        transport: 'TCP → ハブ:47900',
        action: 'ハブに接続する',
        explain:
          '空調コントローラが、ハブに向かって接続します。まず TCP の 3way ハンドシェイクで土台を作り、その上で TLS 1.3 のハンドシェイクで X.509 証明書を交換します。同じネットワークにいるかどうかではなく、正しい証明書を持っているかが問われます。',
      },
      {
        id: 's2',
        from: SC_HUB_ID,
        to: AHU_ID,
        kind: 'response',
        plain: '証明書を確認しました。参加を認めます',
        protocol: 'TLS 1.3 ハンドシェイク完了（暗号化トンネル確立）',
        transport: 'TCP（ハブ:47900 → 空調コントローラ）',
        action: '参加を認める',
        explain:
          'ハブが証明書を確かめ、正しかったので参加を認めます。ここから先、この機器のやり取りはすべて暗号化されたトンネルの中を通ります。照明・電力計・中央監視も、同じように証明書を見せてハブに参加しています。',
        annotation: '参加できるかどうかは、証明書だけで決まる',
      },
      {
        id: 's3',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの設定温度を教えて',
        protocol: 'ReadProperty analog-value,0 present-value（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '設定温度を聞く',
        encrypted: true,
        explain:
          '参加が済んだので、中央監視が空調コントローラに設定温度を尋ねます。中身は IP 編とまったく同じ ReadProperty。違うのは、これがハブを経由し、暗号化されたトンネルの中を通ることです。傍受しても、この要求は読めません。',
      },
      {
        id: 's4',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '24.0 ℃です',
        protocol: 'ComplexACK → 24.0（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '設定温度を返す',
        encrypted: true,
        explain:
          '値も暗号化されて返ります。Wireshark で見えるのは Application Data だけ。何を読んだのか、いくつだったのかは、外からは分かりません。',
        annotation: '傍受しても、中身は読めない',
      },
      {
        id: 's5',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 26.0 ℃にして',
        protocol: 'WriteProperty analog-value,0 present-value（TLS で暗号化）',
        value: 'Present Value (real): 26',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '書き換えを頼む',
        encrypted: true,
        explain:
          '書き込みも同じく暗号化されて通ります。正規の機器どうしなら、これまでと変わらず設備を扱えます。変わったのは「入り口の固さ」と「中身の見えなさ」です。',
      },
      {
        id: 's6',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '受け入れる',
        encrypted: true,
        explain:
          '正規の機器どうしの運用は、IP 編と同じように成立します。SC は使い勝手を奪わずに、入り口と中身を守ります。',
      },
    ],
  },
  {
    id: SC_ATTACK_CONVERSATION_ID,
    title: '持ち込まれた PC が、SC ハブに繋ごうとする',
    captureId: scRejectedCapture.id,
    messages: [
      {
        id: 'sa1',
        from: ATTACKER_ID,
        to: SC_HUB_ID,
        kind: 'request',
        plain: 'ハブに参加させてください',
        protocol: 'Client Hello',
        frame: 271,
        relatedFrames: [265, 266, 267, 272],
        transport: 'TCP → ハブ:47900（TLS 1.3 を開始）',
        action: 'ハブに接続を試みる',
        explain:
          'IP 編と同じ「持ち込まれた PC」が、今度はハブに繋ごうとします。TCP の 3way ハンドシェイク（265-267）は通ります ── ここまでは誰でも叩けるからです。続けて TLS 1.3 のハンドシェイクを始めます。',
        annotation: 'IP 編では、ここから先で会話に割り込めた',
      },
      {
        id: 'sa2',
        from: SC_HUB_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '証明書を見せてください',
        protocol: 'Server Hello, Change Cipher Spec, Application Data',
        frame: 276,
        relatedFrames: [277],
        transport: 'TCP（ハブ:47900 → 持ち込まれた PC）',
        action: '証明書を求める',
        encrypted: true,
        explain:
          'ハブは自分の証明書を示し、相手にも証明書を求めます。BACnet/SC では、ハブと機器が互いに証明書を確かめ合うことになっているからです。ただしこの求めは暗号化の内側にあり、Wireshark には Application Data としか映りません。',
      },
      {
        id: 'sa3',
        from: ATTACKER_ID,
        to: SC_HUB_ID,
        kind: 'request',
        plain: '（証明書はありません）',
        protocol: 'Change Cipher Spec, Application Data',
        value: 'Length: 77',
        frame: 278,
        transport: 'TCP → ハブ:47900',
        action: '証明書を出せない',
        encrypted: true,
        explain:
          '持ち込まれた PC は証明書を持っていません。返した暗号化データは 77 バイト。証明書ありで繋いだときは 1157 バイトありました。この差は、証明書の中身が入っていないことを示しています（中身は読めないので、大きさからの読み取りです）。',
      },
      {
        id: 'sa4',
        from: SC_HUB_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '参加は認めません',
        protocol: 'Application Data',
        value: 'Length: 19',
        frame: 279,
        transport: 'TCP（ハブ:47900 → 持ち込まれた PC）',
        action: '参加を断る',
        encrypted: true,
        rejected: true,
        explain:
          'ハブが返したのは 19 バイトだけ。暗号化のための付け足し（17 バイト）を除くと中身は 2 バイトで、TLS のエラー通知（Alert）とちょうど同じ大きさです。ハブはここで、参加を断りました。',
        annotation:
          'IP 編との決定的な違い。ネットワークに届いても、証明書がなければ会話に入れない',
        annotationTone: 'alert',
      },
      {
        id: 'sa5',
        from: ATTACKER_ID,
        to: SC_HUB_ID,
        kind: 'request',
        plain: '（気づかずに）続きを送ります',
        protocol: 'Application Data',
        value: 'Length: 221',
        frame: 280,
        transport: 'TCP → ハブ:47900',
        action: '続きを送る',
        encrypted: true,
        explain:
          'PC はまだ断られたことに気づかず、次のデータを送っています。TLS 1.3 では、PC は自分の分を送り終えた時点で「繋がった」とみなして先へ進めるからです。証明書ありで繋いだときも、ハンドシェイクの直後に同じ 221 バイトのデータを送っていました。今回は、ハブから返事がありません。',
      },
      {
        id: 'sa6',
        from: ATTACKER_ID,
        to: SC_HUB_ID,
        kind: 'request',
        plain: '接続を閉じます',
        protocol:
          '40212 → 47900 [FIN, ACK] Seq=529 Ack=1376 Win=67584 Len=0 TSval=695913008 TSecr=3490435831',
        frame: 281,
        transport: 'TCP → ハブ:47900',
        action: '接続を閉じる',
        explain:
          'PC はここで接続を閉じにいきます。FIN は TCP の「こちらからは終わります」という合図です。',
      },
      {
        id: 'sa7',
        from: SC_HUB_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '（もう閉じています）',
        protocol:
          '47900 → 40212 [RST, ACK] Seq=1376 Ack=530 Win=65024 Len=0 TSval=3490435831 TSecr=695913008',
        frame: 282,
        transport: 'TCP（ハブ:47900 → 持ち込まれた PC）',
        action: '接続を打ち切る',
        explain:
          'ハブの答えは RST ── 接続を強制的に打ち切る合図です。ハブ側は、断りの返事（279）を送った時点で接続を閉じていたと読めます。繋ぎ始め（265）からわずか 0.05 秒。Who-Is も ReadProperty も送れないまま終わりました。',
        annotation: 'BACnet の会話には、一度も入れなかった',
        annotationTone: 'alert',
      },
    ],
  },
]
