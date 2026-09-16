import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_DEVICE_INSTANCE, AHU_ID, SUPERVISOR_ID } from './diagram'
import { LIGHTING_ID, METER_ID } from './diagram-bbmd'

/**
 * BBMD の読み物の 3 枚目。建物もサブネットの分かれ方も、2 枚目とまったく
 * 同じ（機器の IP を見れば 192.168.10.x と 192.168.20.x に分かれている）。
 * 違うのは、図から何が消えるか。
 *
 *   [中央監視][照明]            [空調][電力計]
 *          \\      \\          /      /
 *              \\    [SC ハブ]    /
 *
 * この教材では、どの図にも「その世界で通信の届き方を決めるもの」だけを
 * 描いている。BACnet/IP では届き方を L2 スイッチとルータが決めるので
 * 描く（diagram.ts / diagram-bbmd.ts）。BACnet/SC ではハブとの接続が
 * 決めるので、ハブだけを描く（diagram-sc.ts と同じ）。
 *
 * だから 2 枚目にあった L2 スイッチ 2 台・IP ルータ・BBMD 2 台が、ここでは
 * まるごと消える。配線が無くなったのではなく、BACnet の側で気にしなくて
 * よくなった ── それが絵の差としてそのまま出るようにしている。
 */
export const BBMD_SC_HUB_ID: NodeId = 'bbmd-sc-hub'

/** この図だけの段階（BBMD なし 2 / あり 3 の続き） */
export const BBMD_SC = 4

export const bbmdScDiagramNodes: DiagramNodeSpec[] = [
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'サブネット A（証明書あり）',
    deviceInstance: 260001,
    ip: '192.168.10.10',
    hasCertificate: true,
    appearsAt: BBMD_SC,
    position: { x: 0, y: 0 },
  },
  {
    id: LIGHTING_ID,
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'サブネット A（証明書あり）',
    deviceInstance: 100201,
    ip: '192.168.10.21',
    hasCertificate: true,
    appearsAt: BBMD_SC,
    position: { x: 250, y: 0 },
  },
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'サブネット B（証明書あり）',
    deviceInstance: AHU_DEVICE_INSTANCE,
    ip: '192.168.20.31',
    hasCertificate: true,
    appearsAt: BBMD_SC,
    position: { x: 650, y: 0 },
  },
  {
    id: METER_ID,
    kind: 'controller',
    label: '電力計',
    sublabel: 'サブネット B（証明書あり）',
    deviceInstance: 100305,
    ip: '192.168.20.32',
    hasCertificate: true,
    appearsAt: BBMD_SC,
    position: { x: 900, y: 0 },
  },
  {
    id: BBMD_SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: 'サブネットに関係なく、ここへ繋ぐ',
    appearsAt: BBMD_SC,
    position: { x: 450, y: 240 },
  },
]

export const bbmdScDiagramEdges: DiagramEdgeSpec[] = [
  {
    id: 'bsc-supervisor-hub',
    source: SUPERVISOR_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-lighting-hub',
    source: LIGHTING_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-ahu-hub',
    source: AHU_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
    label: 'サブネットが違っても、同じように繋ぐ',
  },
  {
    id: 'bsc-meter-hub',
    source: METER_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
  },
]
