import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_DEVICE_INSTANCE, AHU_ID, SUPERVISOR_ID } from './diagram'

/**
 * BBMD 番外編の図。建物が 2 つのサブネットに分かれている状態を、
 * 左右対称に描く。
 *
 *   [中央監視] [照明]                        [空調] [電力計]
 *         \\    /                                \\    /
 *        [L2 スイッチ A]                    [L2 スイッチ B]
 *              |                                   |
 *          [BBMD A] ──── ユニキャスト転送 ──── [BBMD B]
 *
 * L2 スイッチと BBMD は別物として描く。L2 スイッチは同じサブネットの
 * 中を配るだけ（IP アドレスも持たない）。BBMD はそのサブネットにいる
 * BACnet/IP 機器の 1 台で、受け取ったブロードキャストを相手の BBMD へ
 * ユニキャストで転送する。この役割の違いが番外編の肝。
 *
 * Before は BBMD をまだ置いていない状態。BBMD 2 台と、それに繋がる
 * 3 本の線だけが After で現れる。ノードの位置は動かさない。
 */
export const SWITCH_A_ID: NodeId = 'bbmd-switch-a'
export const SWITCH_B_ID: NodeId = 'bbmd-switch-b'
export const BBMD_A_ID: NodeId = 'bbmd-a'
export const BBMD_B_ID: NodeId = 'bbmd-b'
export const LIGHTING_ID: NodeId = 'lighting'
export const METER_ID: NodeId = 'meter'

/**
 * Before（BBMD なし）/ After（BBMD あり）を、この番号で出し分ける。
 * 2 以上にしているのは、どちらの段階でも IP アドレスの札を出すため
 * （サブネットが分かれていることが、この番外編の前提なので）。
 */
export const BBMD_BEFORE = 2
export const BBMD_AFTER = 3

export const bbmdDiagramNodes: DiagramNodeSpec[] = [
  // ── サブネット A（192.168.10.0/24）
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'サブネット A',
    deviceInstance: 260001,
    ip: '192.168.10.10',
    appearsAt: BBMD_BEFORE,
    position: { x: 0, y: 0 },
  },
  {
    id: LIGHTING_ID,
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'サブネット A',
    deviceInstance: 100201,
    ip: '192.168.10.21',
    appearsAt: BBMD_BEFORE,
    position: { x: 250, y: 0 },
  },
  {
    id: SWITCH_A_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット A の中を配るだけ',
    appearsAt: BBMD_BEFORE,
    position: { x: 125, y: 180 },
  },
  {
    id: BBMD_A_ID,
    kind: 'bbmd',
    label: 'BBMD A',
    sublabel: 'サブネット A 側',
    ip: '192.168.10.9',
    appearsAt: BBMD_AFTER,
    position: { x: 125, y: 360 },
  },

  // ── サブネット B（192.168.20.0/24）
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'サブネット B',
    deviceInstance: AHU_DEVICE_INSTANCE,
    ip: '192.168.20.31',
    appearsAt: BBMD_BEFORE,
    position: { x: 650, y: 0 },
  },
  {
    id: METER_ID,
    kind: 'controller',
    label: '電力計',
    sublabel: 'サブネット B',
    deviceInstance: 100305,
    ip: '192.168.20.32',
    appearsAt: BBMD_BEFORE,
    position: { x: 900, y: 0 },
  },
  {
    id: SWITCH_B_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'サブネット B の中を配るだけ',
    appearsAt: BBMD_BEFORE,
    position: { x: 775, y: 180 },
  },
  {
    id: BBMD_B_ID,
    kind: 'bbmd',
    label: 'BBMD B',
    sublabel: 'サブネット B 側',
    ip: '192.168.20.9',
    appearsAt: BBMD_AFTER,
    position: { x: 775, y: 360 },
  },
]

export const bbmdDiagramEdges: DiagramEdgeSpec[] = [
  {
    id: 'bbmd-supervisor-sw',
    source: SUPERVISOR_ID,
    target: SWITCH_A_ID,
    appearsAt: BBMD_BEFORE,
  },
  {
    id: 'bbmd-lighting-sw',
    source: LIGHTING_ID,
    target: SWITCH_A_ID,
    appearsAt: BBMD_BEFORE,
  },
  {
    id: 'bbmd-ahu-sw',
    source: AHU_ID,
    target: SWITCH_B_ID,
    appearsAt: BBMD_BEFORE,
  },
  {
    id: 'bbmd-meter-sw',
    source: METER_ID,
    target: SWITCH_B_ID,
    appearsAt: BBMD_BEFORE,
  },

  // ここから下が After で現れる。BBMD を置く、ということ
  {
    id: 'bbmd-sw-a',
    source: SWITCH_A_ID,
    target: BBMD_A_ID,
    appearsAt: BBMD_AFTER,
  },
  {
    id: 'bbmd-sw-b',
    source: SWITCH_B_ID,
    target: BBMD_B_ID,
    appearsAt: BBMD_AFTER,
  },
  {
    id: 'bbmd-a-b',
    source: BBMD_A_ID,
    target: BBMD_B_ID,
    appearsAt: BBMD_AFTER,
    label: '1 対 1 のユニキャスト（ルータを越えられる）',
  },
]
