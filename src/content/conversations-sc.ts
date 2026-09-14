import type { Conversation } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'
import { HUB_ID } from './diagram-sc'

export const SC_NORMAL_CONVERSATION_ID = 'sc-normal'
export const SC_ATTACK_CONVERSATION_ID = 'sc-attack'

/**
 * SC 編の会話。
 *
 * IP 編と同じ「探す→読む→書く」の中身が、今度は TLS の中を通る。
 * encrypted: true のメッセージは、傍受しても Wireshark には Application Data
 * としか映らない（＝中身が読めない）ことを表す。
 * rejected: true は、証明書のないノードがハブに門前払いされたことを表し、
 * そこで会話が止まる。
 *
 * ステップ6の門前払いは、実験キャプチャ（追加取得中）と結びつける frame を
 * 素材が揃い次第このデータに足す。いまはプレースホルダ。
 */
export const scConversations: Conversation[] = [
  {
    id: SC_NORMAL_CONVERSATION_ID,
    title: '証明書を持つ機器と、SC ハブの会話',
    messages: [
      {
        id: 's1',
        from: AHU_ID,
        to: HUB_ID,
        kind: 'request',
        plain: 'ハブに参加させてください（これが私の証明書です）',
        protocol: 'TLS 1.3 handshake（wss / port 47900）',
        transport: 'TCP → 192.168.222.130:47900',
        action: 'ハブに接続する',
        explain:
          '空調コントローラが、ハブに向かって TLS で繋ぎにいきます。このとき自分の X.509 証明書を示します。同じネットワークにいるかどうかではなく、正しい証明書を持っているかどうかが問われます。',
      },
      {
        id: 's2',
        from: HUB_ID,
        to: AHU_ID,
        kind: 'response',
        plain: '証明書を確認しました。どうぞ',
        protocol: 'TLS 1.3 handshake 完了（暗号化トンネル確立）',
        transport: 'TCP → 192.168.222.130:47900',
        action: '参加を認める',
        explain:
          'ハブが証明書を確かめ、正しかったので参加を認めます。ここから先のやり取りは、すべてこの暗号化されたトンネルの中を通ります。',
        annotation: '参加できるかどうかは、証明書だけで決まる',
      },
      {
        id: 's3',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol: 'ReadProperty analog-input,0 present-value（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '室温を聞く',
        encrypted: true,
        explain:
          '中身は IP 編とまったく同じ ReadProperty です。違うのは、これが暗号化されたトンネルの中を、ハブを経由して届くこと。傍受しても、この要求そのものは読めません。',
      },
      {
        id: 's4',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol: 'ComplexACK → 22.0（TLS で暗号化）',
        transport: 'ハブ経由（wss / TLS 1.3）',
        action: '室温を返す',
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
        protocol: 'SimpleACK（TLS で暗号化）',
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
    messages: [
      {
        id: 'sa1',
        from: ATTACKER_ID,
        to: HUB_ID,
        kind: 'request',
        plain: 'ハブに参加させてください',
        protocol: 'TLS 1.3 handshake を開始（wss / port 47900）',
        transport: 'TCP → 192.168.222.130:47900',
        action: 'ハブに接続を試みる',
        explain:
          'IP 編と同じ「持ち込まれた PC」が、今度はハブに繋ごうとします。やろうとしていることは、正規の機器と同じ ── まずハブに接続することです。',
        annotation: 'IP 編では、この先で会話に割り込めた',
      },
      {
        id: 'sa2',
        from: HUB_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '証明書がありません。参加は認められません',
        protocol: 'TLS handshake 失敗 ── 接続拒否',
        transport: 'TCP → 192.168.222.128:47900',
        action: '証明書がなく、拒否する',
        rejected: true,
        explain:
          'ハブは接続してきた相手に証明書を求めます。持ち込まれた PC はそれを出せません。TLS のハンドシェイクは完了せず、接続そのものが成立しません。Who-Is も ReadProperty も、そもそも送れない ── 会話の入り口で止められます。',
        annotation:
          'IP 編との決定的な違い。ネットワークに到達できても、証明書がなければ会話に入れない',
        annotationTone: 'alert',
      },
    ],
  },
]
