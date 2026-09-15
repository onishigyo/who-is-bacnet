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
          '空調コントローラがハブに繋ぎます。TCP で繋いだあと、TLS 1.3 のハンドシェイクで証明書を見せ合います。',
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
          'ハブが証明書を確かめ、参加を認めます。照明・電力計・中央監視も、同じように参加しています。',
        annotation: '参加できるかは、証明書で決まる',
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
          '中央監視が設定温度を尋ねます。中身は IP 編と同じ ReadProperty ですが、ハブを通って暗号化されたまま届きます。',
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
          '値も暗号化されて返ります。傍受しても Application Data としか見えません。',
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
        explain: '書き込みも暗号化されて届きます。',
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
        explain: '正規の機器どうしなら、IP 編と同じように設備を扱えます。',
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
          'IP 編と同じ PC が、ハブに繋ごうとします。TCP の 3way（265-267）までは誰でも通れます。',
        annotation: 'IP 編では、この先で割り込めた',
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
          'ハブは自分の証明書を示し、PC にも証明書を求めます。この求めは暗号化されていて、Wireshark には Application Data としか映りません。',
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
          'PC は証明書を持っていないので、出せません。送ったのは 77 バイトの小さなデータだけです。',
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
        relatedFrames: [280, 281, 282],
        transport: 'TCP（ハブ:47900 → 持ち込まれた PC）',
        action: '参加を断る',
        encrypted: true,
        rejected: true,
        explain:
          'ハブの返事は 19 バイトだけ。TLS のエラー通知（Alert）1 つ分の大きさです。このあと PC が送ったデータにも返事はなく、接続は終わります（280-282）。Who-Is も ReadProperty も送れませんでした。',
        annotation: 'ネットワークに届いても、証明書がなければ会話に入れない',
        annotationTone: 'alert',
      },
    ],
  },
]
