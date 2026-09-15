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

const CAPTURED_BY =
  '制作者が閉域の実験環境（仮想マシン 2 台）で取ったキャプチャを、tshark で絞り込んで載せています。'

const PROVENANCE_BASE =
  CAPTURED_BY +
  '192.168.222.128 が図の「持ち込まれた PC」、192.168.222.130 が「空調コントローラ」です。ほかの機器は物語上の存在で、実験にはいません。'

const SC_PROVENANCE_BASE =
  CAPTURED_BY +
  '192.168.222.130 で SC ハブを動かし、192.168.222.128 から証明書を持たせずに繋ぎました。ほかの機器は物語上の存在で、実験にはいません。'

/** BACnet/IP：何をしているかが平文で全部読める（ステップ4の答え合わせ） */
export const ipCapture: CaptureEvidence = {
  id: 'ip-plaintext',
  title: '実験で取った BACnet/IP の通信',
  caption:
    '誰が誰に、何を読んだか・書いたかが、Info 欄にそのまま並びます。値も読めます。何も隠れていません。',
  filter: 'bacnet',
  provenance:
    PROVENANCE_BASE +
    '24 と 99 は実験の値、ステップ3 の 26.0 は物語上の値です。',
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
 * BACnet/SC：証明書を送らずに SC ハブへ繋ごうとした記録（ステップ6で使う）。
 *
 * TLS 1.3 では暗号化後のレコードは外から見ると全部 Application Data なので、
 * 拒否の通知（Alert）そのものは読めない。読めるのは大きさだけ
 * （TLS_AES_256_GCM_SHA384、認証タグ 16 バイト）:
 * - 278 の 77 バイト = 空の Certificate 8 + Finished 52 + 種別 1 + タグ 16
 *   （同じ環境で証明書を持たせて繋いだ記録では、同じ位置が 1157 バイト）
 * - 279 の 19 バイト = 中身 2 + 種別 1 + タグ 16。2 バイトは Alert の大きさ
 * どの Alert かは復号鍵かハブ側のログがないと分からない（要検証のまま）。
 */
export const scRejectedCapture: CaptureEvidence = {
  id: 'sc-rejected',
  title: '実験で取った BACnet/SC の通信',
  caption:
    'TLS のあいさつ（271, 276）のあと、PC は証明書を出せず、小さなデータ（278）しか送れません。ハブは 19 バイト返しただけで（279）、接続は終わりました（280-282）。',
  filter: 'tcp.port==47900',
  provenance: SC_PROVENANCE_BASE,
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
