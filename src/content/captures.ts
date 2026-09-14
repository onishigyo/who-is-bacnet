import type { CaptureEvidence } from '../domain/types'

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

const PROVENANCE_BASE =
  '制作者が閉域の実験環境（VMware 上の仮想マシン 2 台）で取得したキャプチャを、tshark 4.6.8 で表示フィルタをかけて出力したものです。図のアドレスも、この実験に合わせてあります。実験に登場するのは、送信側（192.168.222.128 = 図の「持ち込まれた PC」）と BACnet 機器（192.168.222.130 = 図の「空調コントローラ」）の 2 台だけです。照明コントローラ・電力計・中央監視装置は、教材の物語として置いた機器で、実験には登場しません。'

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

/** BACnet/SC：TLS に包まれて中身が読めない（SC 編の Before/After で使う） */
export const scCapture: CaptureEvidence = {
  id: 'sc-encrypted',
  title: '実験で取った BACnet/SC の通信',
  caption:
    'TCP の 3way ハンドシェイク（225-227）のあと、TLS のハンドシェイク（231-235）を経て、やり取りはすべて Application Data になります。約 6 秒おきの短い通信（632, 634, 638, 640）は、接続を維持するための「生きています」の合図です。最後は Kali 側から正常に接続を閉じています（641 FIN → 645 Application Data → 646/648 RST）。ハンドシェイク以降、何をしているかは一切読めません。',
  filter: 'tcp.port==47900',
  provenance: PROVENANCE_BASE,
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
