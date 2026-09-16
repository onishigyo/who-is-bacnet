import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_DEVICE_INSTANCE, AHU_ID, SUPERVISOR_ID } from './diagram'
import { LIGHTING_ID, METER_ID, SWITCH_A_ID, SWITCH_B_ID } from './diagram-bbmd'

/**
 * BBMD の読み物の 3 枚目。建物もサブネットの分かれ方も diagram-bbmd.ts と
 * まったく同じで、真ん中にいるものだけが違う。
 *
 *   [中央監視][照明] ── L2SW ─┐         ┌─ L2SW ── [空調][電力計]
 *                            └─ SC ハブ ─┘
 *
 * BBMD が 2 台と BDT の設定だったところが、ハブ 1 つになる。各機器は
 * サブネットに関係なくハブへ繋ぎにいくので、ブロードキャストを転送する
 * 仕掛けそのものが要らなくなる ── それを、BBMD ありの図と同じ位置・
 * 同じ機器で見比べられるようにしている。
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
    id: SWITCH_A_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット A',
    appearsAt: BBMD_SC,
    position: { x: 125, y: 180 },
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
    id: SWITCH_B_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット B',
    appearsAt: BBMD_SC,
    position: { x: 775, y: 180 },
  },
  {
    id: BBMD_SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: 'サブネットに関係なく、ここへ繋ぐ',
    appearsAt: BBMD_SC,
    position: { x: 450, y: 360 },
  },
]

export const bbmdScDiagramEdges: DiagramEdgeSpec[] = [
  {
    id: 'bsc-supervisor-sw',
    source: SUPERVISOR_ID,
    target: SWITCH_A_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-lighting-sw',
    source: LIGHTING_ID,
    target: SWITCH_A_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-ahu-sw',
    source: AHU_ID,
    target: SWITCH_B_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-meter-sw',
    source: METER_ID,
    target: SWITCH_B_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-sw-a-hub',
    source: SWITCH_A_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
    label: 'TLS でハブへ',
  },
  {
    id: 'bsc-sw-b-hub',
    source: SWITCH_B_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
    label: 'TLS でハブへ',
  },
]
