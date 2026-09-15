import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_ID, SUPERVISOR_ID } from './diagram'

/**
 * BBMD 番外編の図。中央監視と空調コントローラを、2 つのサブネットに
 * 分けて置く。機器の id は IP 編と共有し、「同じ機器が別の場面にいる」
 * ことを示す（diagram-sc.ts などと同じやり方）。
 *
 * ノードは最初から全部出す（appearsAt: 1）。サブネットどうしを繋ぐ線
 * だけ appearsAt: 2 にして、「BBMD を設置した後」で現れるようにする。
 * この 1 本の線の有無だけで、Before/After の届く・届かないを表現する。
 */
export const SUBNET_A_ID: NodeId = 'bbmd-subnet-a'
export const SUBNET_B_ID: NodeId = 'bbmd-subnet-b'

/** Before（線がまだない）/ After（線がある）を、この番号で出し分ける */
export const BBMD_BEFORE = 1
export const BBMD_AFTER = 2

export const bbmdDiagramNodes: DiagramNodeSpec[] = [
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'サブネット A',
    appearsAt: BBMD_BEFORE,
    position: { x: 0, y: 60 },
  },
  {
    id: SUBNET_A_ID,
    kind: 'switch',
    label: 'サブネット A のスイッチ',
    sublabel: 'BBMD 機能',
    appearsAt: BBMD_BEFORE,
    position: { x: 280, y: 60 },
  },
  {
    id: SUBNET_B_ID,
    kind: 'switch',
    label: 'サブネット B のスイッチ',
    sublabel: 'BBMD 機能',
    appearsAt: BBMD_BEFORE,
    position: { x: 680, y: 60 },
  },
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'サブネット B',
    appearsAt: BBMD_BEFORE,
    position: { x: 960, y: 60 },
  },
]

export const bbmdDiagramEdges: DiagramEdgeSpec[] = [
  {
    id: 'bbmd-supervisor-a',
    source: SUPERVISOR_ID,
    target: SUBNET_A_ID,
    appearsAt: BBMD_BEFORE,
  },
  {
    id: 'bbmd-b-ahu',
    source: SUBNET_B_ID,
    target: AHU_ID,
    appearsAt: BBMD_BEFORE,
  },
  // この 1 本だけ After で現れる。ブロードキャストが区画をまたげるかどうかは、
  // この線の有無だけで決まる（logic/conversation.ts の broadcastTargets）
  {
    id: 'bbmd-a-b',
    source: SUBNET_A_ID,
    target: SUBNET_B_ID,
    appearsAt: BBMD_AFTER,
  },
]
