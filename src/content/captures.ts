import type { CaptureEvidence, EvidenceSection } from '../domain/types'

/**
 * 実験で取得した Wireshark キャプチャによる答え合わせ素材。
 *
 * rows は tshark の出力をそのまま写したもので、手で書き換えない
 * （Info 欄の空白の数も含めて、Wireshark の表示と一致させる）。
 *
 * 公開してよいのは、ここに載せた範囲（表示フィルタで絞った行）だけ。
 * 元の pcapng には実験と無関係な通信（SSH・mDNS・DHCP など）や、
 * 個人を特定しうる情報が含まれるため、リポジトリにも教材にも置かない。
 */

const CAPTURED_BY =
  '制作者が閉域の実験環境（VMware 上の仮想マシン 2 台）で取得したキャプチャを、tshark 4.6.8 で表示フィルタをかけて出力したものです。'

const PROVENANCE_BASE =
  CAPTURED_BY +
  '図のアドレスも、この実験に合わせてあります。実験に登場するのは、送信側（192.168.222.128 = 図の「持ち込まれた PC」）と BACnet 機器（192.168.222.130 = 図の「空調コントローラ」）の 2 台だけです。照明コントローラ・電力計・中央監視装置は、教材の物語として置いた機器で、実験には登場しません。'

const SC_PROVENANCE_BASE =
  CAPTURED_BY +
  'SC の実験では、192.168.222.130 で SC ハブを動かし（図の「SC ハブ」）、192.168.222.128 からハブへ接続しました。空調コントローラ・照明コントローラ・電力計・中央監視装置は、教材の物語として置いた機器で、実験には登場しません。'

/** BACnet/IP：何をしているかが平文で全部読める（ステップ4の答え合わせ） */
export const ipCapture: CaptureEvidence = {
  id: 'ip-plaintext',
  title: '実験で取った BACnet/IP の通信',
  caption:
    'Info 欄に、何をしているかがそのまま並びます。誰が誰に、どのオブジェクトの何を読んだか・書いたか。値も詳細を開けば読めます。どれも隠れていません。',
  filter: 'bacnet',
  provenance:
    PROVENANCE_BASE +
    '読んだ設定温度 24 と、書き込んだ 99 は実験で取った値です。ステップ3で中央監視が書き込む 26.0 は、物語上の値です。',
  rows: [
    {
      no: 550,
      source: '192.168.222.128',
      destination: '192.168.222.255',
      protocol: 'BACnet-APDU',
      info: 'Unconfirmed-REQ who-Is',
    },
    {
      no: 551,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Unconfirmed-REQ i-Am device,3056489',
    },
    {
      no: 997,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'BACnet-APDU',
      info: 'Confirmed-REQ   readProperty[  0] analog-value,0 present-value',
    },
    {
      no: 998,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Complex-ACK     readProperty[  0] analog-value,0 present-value',
      value: 'Present Value (real): 24',
    },
    {
      no: 1509,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'BACnet-APDU',
      info: 'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
      value: 'Present Value (real): 99',
    },
    {
      no: 1510,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Simple-ACK      writeProperty[  1]',
    },
  ],
  alt: '実験で取得した BACnet/IP の通信を Wireshark で bacnet フィルタ表示した一覧',
}

/**
 * BACnet/SC：証明書を持たせて SC ハブに繋いだ記録（ステップ6で使う）。
 *
 * 約 6 秒おきに接続した側から短い暗号化データが出ているが、ハブは TCP の
 * ACK しか返していない。応答を伴う BACnet/SC の Heartbeat や WebSocket の
 * ping とは形が合わず、中身は特定できない。「心拍」とは書かない。
 */
export const scCapture: CaptureEvidence = {
  id: 'sc-encrypted',
  title: '実験で取った BACnet/SC の通信（証明書あり）',
  caption:
    'TCP の 3way ハンドシェイク（225-227）と TLS のハンドシェイク（231-235）のあとは、ハブとのやり取りがすべて Application Data になります。約 6 秒おきに短いデータも出ていますが（632, 634, 638）、何を送っているのかは制作者にも外からは分かりません。接続は、繋いだ側が閉じる（641 FIN）まで続きました。',
  filter: 'tcp.port==47900',
  provenance: SC_PROVENANCE_BASE,
  durationLabel: '24.0 秒 繋がり続けた（繋いだ側が閉じるまで）',
  durationTone: 'neutral',
  rows: [
    {
      no: 225,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM TSval=490222221 TSecr=0 WS=512',
    },
    {
      no: 226,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0 MSS=1460 SACK_PERM TSval=3267489567 TSecr=490222221 WS=512',
    },
    {
      no: 227,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [ACK] Seq=1 Ack=1 Win=64512 Len=0 TSval=490222221 TSecr=3267489567',
    },
    {
      no: 231,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Client Hello',
    },
    {
      no: 232,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1 Ack=215 Win=65024 Len=0 TSval=3267489593 TSecr=490222247',
    },
    {
      no: 233,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Server Hello, Change Cipher Spec, Application Data',
    },
    {
      no: 234,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [ACK] Seq=215 Ack=1352 Win=67584 Len=0 TSval=490222248 TSecr=3267489594',
    },
    {
      no: 235,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Change Cipher Spec, Application Data',
      value: 'Length: 1157',
    },
    {
      no: 236,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 237,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 238,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 239,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 240,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 241,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 250,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1785 Ack=1718 Win=69120 Len=0 TSval=3267489637 TSecr=490222250',
    },
    {
      no: 632,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 633,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1785 Ack=1769 Win=69120 Len=0 TSval=3267495600 TSecr=490228253',
    },
    {
      no: 634,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 635,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1785 Ack=1820 Win=69120 Len=0 TSval=3267501605 TSecr=490234258',
    },
    {
      no: 638,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 639,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1785 Ack=1871 Win=69120 Len=0 TSval=3267507606 TSecr=490240260',
    },
    {
      no: 640,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 641,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [FIN, ACK] Seq=1903 Ack=1785 Win=73216 Len=0 TSval=490246264 TSecr=3267507606',
    },
    {
      no: 644,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 47056 [ACK] Seq=1785 Ack=1903 Win=69120 Len=0 TSval=3267513609 TSecr=490246264',
    },
    {
      no: 645,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 646,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [RST] Seq=1904 Win=0 Len=0',
    },
    {
      no: 647,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 648,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '47056 → 47900 [RST] Seq=1904 Win=0 Len=0',
    },
  ],
  alt: '実験で取得した BACnet/SC の通信を Wireshark で tcp.port==47900 フィルタ表示した一覧',
}

/**
 * BACnet/SC：証明書を送らずに SC ハブへ繋ごうとした記録（ステップ6で使う）。
 *
 * TLS 1.3 では暗号化後のレコードは外から見ると全部 Application Data なので、
 * 拒否の通知（Alert）そのものは読めない。読めるのは大きさだけ
 * （TLS_AES_256_GCM_SHA384、認証タグ 16 バイト）:
 * - 278 の 77 バイト = 空の Certificate 8 + Finished 52 + 種別 1 + タグ 16
 *   （証明書ありの 235 は 1157 バイト）
 * - 279 の 19 バイト = 中身 2 + 種別 1 + タグ 16。2 バイトは Alert の大きさ
 * どの Alert かは復号鍵かハブ側のログがないと分からない（要検証のまま）。
 */
export const scRejectedCapture: CaptureEvidence = {
  id: 'sc-rejected',
  title: '実験で取った BACnet/SC の通信（証明書なし）',
  caption:
    'TCP（265-267）と TLS の始まり（271, 276）までは、証明書ありのときと同じです。違いは 278：証明書ありでは 1157 バイトあった暗号化データが、77 バイトしかありません。証明書が入っていない大きさです。ハブが返したのは 19 バイトだけ（279）で、接続はそのまま終わりました（281, 282）。',
  filter: 'tcp.port==47900',
  provenance:
    SC_PROVENANCE_BASE +
    'この記録では、192.168.222.128 に証明書を持たせずに接続しています。',
  durationLabel: '0.05 秒で終了（ハブの短い返事の直後）',
  durationTone: 'alert',
  rows: [
    {
      no: 265,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '40212 → 47900 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM TSval=695912956 TSecr=0 WS=512',
    },
    {
      no: 266,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 40212 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0 MSS=1460 SACK_PERM TSval=3490435779 TSecr=695912956 WS=512',
    },
    {
      no: 267,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '40212 → 47900 [ACK] Seq=1 Ack=1 Win=64512 Len=0 TSval=695912956 TSecr=3490435779',
    },
    {
      no: 271,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Client Hello',
    },
    {
      no: 272,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 40212 [ACK] Seq=1 Ack=215 Win=65024 Len=0 TSval=3490435803 TSecr=695912980',
    },
    {
      no: 276,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Server Hello, Change Cipher Spec, Application Data',
    },
    {
      no: 277,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '40212 → 47900 [ACK] Seq=215 Ack=1352 Win=67584 Len=0 TSval=695913007 TSecr=3490435830',
    },
    {
      no: 278,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Change Cipher Spec, Application Data',
      value: 'Length: 77',
    },
    {
      no: 279,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
      value: 'Length: 19',
    },
    {
      no: 280,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 281,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '40212 → 47900 [FIN, ACK] Seq=529 Ack=1376 Win=67584 Len=0 TSval=695913008 TSecr=3490435831',
    },
    {
      no: 282,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 40212 [RST, ACK] Seq=1376 Ack=530 Win=65024 Len=0 TSval=3490435831 TSecr=695913008',
    },
  ],
  alt: '実験で取得した、証明書なしで SC ハブへの接続を試みた通信を Wireshark で tcp.port==47900 フィルタ表示した一覧',
}

/**
 * ステップ6 の答え合わせ。IP 編で見た 2 つの危険（割り込み・盗み見）に
 * 1 つずつ答える順に並べる。先頭は、帯で再生する会話と結びつく記録。
 */
export const scDefenseEvidence: EvidenceSection[] = [
  {
    id: 'intrusion',
    heading: '割り込めるか ── 証明書なしで繋いでみた',
    captures: [scRejectedCapture],
  },
  {
    id: 'eavesdrop',
    heading: '盗み見できるか ── IP と SC を並べる',
    captures: [ipCapture, scCapture],
  },
]
