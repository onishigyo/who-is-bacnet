import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_DEVICE_INSTANCE, AHU_ID, SUPERVISOR_ID } from './diagram'

/**
 * BBMD 番外編の図。建物が 2 つのサブネットに分かれている状態を、
 * 左右対称に描く。
 *
 *   [中央監視] [照明]                          [空調] [電力計]
 *         \\    /                                  \\    /
 *        [L2 スイッチ A] ── [IP ルータ] ── [L2 スイッチ B]
 *              |                                   |
 *          [BBMD A]                            [BBMD B]
 *
 * 3 種類の箱を、どれも別物として描く。
 *   L2 スイッチ … 同じサブネットの中を配るだけ（IP アドレスを持たない）
 *   IP ルータ   … サブネットどうしを繋ぐ。ユニキャストは通すが、
 *                 ブロードキャストは通さない ── これが問題の張本人
 *   BBMD        … そのサブネットにいる BACnet/IP 機器の 1 台。受け取った
 *                 ブロードキャストを相手の BBMD へユニキャストで送り直す
 *
 * ルータを省いて 2 つの島にしてしまうと「線が無いから届かないだけ」に
 * 見えてしまい、肝心の「繋がっているのにブロードキャストだけ越えない」
 * が伝わらない。だから Before の時点からルータは描いておく。
 *
 * Before は BBMD をまだ置いていない状態。BBMD 2 台と、そこへ繋がる
 * 2 本の線だけが After で現れる。ノードの位置は動かさない。
 * BBMD どうしを直接つなぐ線は引かない ── 転送はルータを通る
 * ふつうのユニキャストなので、経路もそのとおりに描く。
 */
export const SWITCH_A_ID: NodeId = 'bbmd-switch-a'
export const SWITCH_B_ID: NodeId = 'bbmd-switch-b'
export const ROUTER_ID: NodeId = 'bbmd-router'
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

  // ── サブネットどうしを繋ぐもの
  {
    id: ROUTER_ID,
    kind: 'router',
    label: 'IP ルータ',
    sublabel: 'ユニキャストは通す／ブロードキャストは通さない',
    appearsAt: BBMD_BEFORE,
    position: { x: 450, y: 180 },
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
    id: 'bbmd-sw-a-router',
    source: SWITCH_A_ID,
    target: ROUTER_ID,
    appearsAt: BBMD_BEFORE,
  },
  {
    id: 'bbmd-router-sw-b',
    source: ROUTER_ID,
    target: SWITCH_B_ID,
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
]
