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
    '読んだ室温 22 と、書き込んだ 99 は実験で取った値です。ステップ3で中央監視が設定する 24.0 は、物語上の値です。',
  rows: [
    {
      no: 1052,
      source: '192.168.222.128',
      destination: '192.168.222.255',
      protocol: 'BACnet-APDU',
      info: 'Unconfirmed-REQ who-Is',
    },
    {
      no: 1053,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Unconfirmed-REQ i-Am device,3056930',
    },
    {
      no: 2306,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'BACnet-APDU',
      info: 'Confirmed-REQ   readProperty[  0] analog-input,0 present-value',
    },
    {
      no: 2307,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Complex-ACK     readProperty[  0] analog-input,0 present-value',
      value: 'Present Value (real): 22',
    },
    {
      no: 2727,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'BACnet-APDU',
      info: 'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
      value: 'Present Value (real): 99',
    },
    {
      no: 2728,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Simple-ACK      writeProperty[  1]',
    },
    {
      no: 3089,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'BACnet-APDU',
      info: 'Confirmed-REQ   readProperty[  2] analog-value,0 present-value',
    },
    {
      no: 3090,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'BACnet-APDU',
      info: 'Complex-ACK     readProperty[  2] analog-value,0 present-value',
      value: 'Present Value (real): 99',
    },
  ],
  alt: '実験で取得した BACnet/IP の通信を Wireshark で bacnet フィルタ表示した一覧',
}

/** BACnet/SC：TLS に包まれて中身が読めない（SC 編の Before/After で使う） */
export const scCapture: CaptureEvidence = {
  id: 'sc-encrypted',
  title: '実験で取った BACnet/SC の通信',
  caption:
    'TLS のハンドシェイクのあとは Application Data が並ぶだけで、何をしているかは読めません。盗み見を防ぐという目的どおりの見え方です。',
  filter: 'tcp.port==47900',
  provenance: PROVENANCE_BASE,
  rows: [
    {
      no: 4884,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM TSval=3615033600 TSecr=0 WS=512',
    },
    {
      no: 4885,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 51116 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0 MSS=1460 SACK_PERM TSval=1133259609 TSecr=3615033600 WS=512',
    },
    {
      no: 4886,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [ACK] Seq=1 Ack=1 Win=64512 Len=0 TSval=3615033600 TSecr=1133259609',
    },
    {
      no: 4890,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Client Hello',
    },
    {
      no: 4891,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 51116 [ACK] Seq=1 Ack=215 Win=65024 Len=0 TSval=1133259633 TSecr=3615033624',
    },
    {
      no: 4892,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Server Hello, Change Cipher Spec, Application Data',
    },
    {
      no: 4893,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [ACK] Seq=215 Ack=1352 Win=67584 Len=0 TSval=3615033625 TSecr=1133259633',
    },
    {
      no: 4894,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Change Cipher Spec, Application Data',
    },
    {
      no: 4895,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4896,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4897,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4898,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4899,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4900,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 4909,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 51116 [ACK] Seq=1785 Ack=1713 Win=69120 Len=0 TSval=1133259677 TSecr=3615033626',
    },
    {
      no: 5204,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 5205,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [FIN, ACK] Seq=1745 Ack=1785 Win=73216 Len=0 TSval=3615036630 TSecr=1133259677',
    },
    {
      no: 5207,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TCP',
      info: '47900 → 51116 [ACK] Seq=1785 Ack=1745 Win=69120 Len=0 TSval=1133262637 TSecr=3615036630',
    },
    {
      no: 5209,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 5210,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [RST] Seq=1746 Win=0 Len=0',
    },
    {
      no: 5211,
      source: '192.168.222.130',
      destination: '192.168.222.128',
      protocol: 'TLSv1.3',
      info: 'Application Data',
    },
    {
      no: 5212,
      source: '192.168.222.128',
      destination: '192.168.222.130',
      protocol: 'TCP',
      info: '51116 → 47900 [RST] Seq=1746 Win=0 Len=0',
    },
  ],
  alt: '実験で取得した BACnet/SC の通信を Wireshark で tcp.port==47900 フィルタ表示した一覧',
}
