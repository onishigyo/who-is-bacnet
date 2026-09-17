import type {
  DiagramEdgeSpec,
  DiagramNodeSpec,
  DiagramZoneSpec,
  NodeId,
} from '../domain/types'
import { AHU_DEVICE_INSTANCE, AHU_ID, SUPERVISOR_ID } from './diagram'
import {
  LIGHTING_ID,
  METER_ID,
  ROUTER_ID,
  SWITCH_A_ID,
  SWITCH_B_ID,
} from './diagram-bbmd'

/**
 * BBMD の読み物の 3 枚目。建物もサブネットの分かれ方も、2 枚目とまったく
 * 同じ（機器の IP を見れば 192.168.10.x と 192.168.20.x に分かれている）。
 * 違うのは、図から何が消えるか。
 *
 *   [中央監視][照明]                          [空調][電力計]
 *         \\    /                                  \\    /
 *        [L2 スイッチ] ── [IP ルータ] ── [L2 スイッチ]
 *                             |
 *                        [SC ハブ]
 *
 * 配線（L2 スイッチ・IP ルータ）は 2 枚目とまったく同じ。SC にしても
 * 建物の配線は 1 本も変わらないので、図からも消さない。消えるのは
 * BBMD 2 台と、その BDT の設定だけ。
 *
 * ハブはルータの側に置く。どの機器も、自分のサブネットのスイッチと
 * ルータを通ってハブへ繋ぐ ── ブロードキャストは越えられなかった
 * そのルータを、ハブへの接続はふつうに越えていく。
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
    position: { x: 800, y: 0 },
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
    position: { x: 1050, y: 0 },
  },
  {
    id: SWITCH_A_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット A の中を配るだけ',
    appearsAt: BBMD_SC,
    position: { x: 125, y: 180 },
  },
  {
    id: SWITCH_B_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット B の中を配るだけ',
    appearsAt: BBMD_SC,
    position: { x: 925, y: 180 },
  },
  {
    id: ROUTER_ID,
    kind: 'router',
    label: 'IP ルータ',
    sublabel: 'ユニキャストは通す／ブロードキャストは通さない',
    appearsAt: BBMD_SC,
    position: { x: 525, y: 180 },
  },
  {
    id: BBMD_SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: 'サブネットに関係なく、みんなここへ繋ぐ',
    appearsAt: BBMD_SC,
    position: { x: 525, y: 360 },
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
    id: 'bsc-sw-a-router',
    source: SWITCH_A_ID,
    target: ROUTER_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-router-sw-b',
    source: ROUTER_ID,
    target: SWITCH_B_ID,
    appearsAt: BBMD_SC,
  },
  {
    id: 'bsc-router-hub',
    source: ROUTER_ID,
    target: BBMD_SC_HUB_ID,
    appearsAt: BBMD_SC,
    label: 'どのサブネットからも、ここへ繋ぐ',
  },
]

/** サブネットの囲い。BBMD の図と同じ位置・同じ幅にして、見比べやすくする */
export const bbmdScDiagramZones: DiagramZoneSpec[] = [
  {
    id: 'bsc-zone-a',
    label: 'サブネット A',
    sublabel: '192.168.10.0/24',
    appearsAt: BBMD_SC,
    rect: { x: -28, y: -56, width: 530, height: 360 },
  },
  {
    id: 'bsc-zone-b',
    label: 'サブネット B',
    sublabel: '192.168.20.0/24',
    appearsAt: BBMD_SC,
    rect: { x: 772, y: -56, width: 530, height: 360 },
  },
]
