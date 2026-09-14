import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

/**
 * SC 編の中央。ハブは専用の箱とは限らず、どのノードでも「ハブ機能」を
 * 担える（ASHRAE ホワイトペーパー）。ここでは既存の中央監視装置が
 * ハブ機能を兼ねる、現実的な構成を採る。各機器はここへ TLS（wss）で繋ぐ。
 */
export const SC_HUB_ID: NodeId = SUPERVISOR_ID

/**
 * SC 編の図。IP 編とはトポロジが違う（hub-and-spoke）。
 * 中央監視装置がハブ機能を兼ね、証明書を持つ機器だけがそこへ TLS 接続する。
 *
 * appearsAt はステップ番号（5〜7）。IP 編と同じ横長比率を保つ。
 * ノード id は IP 編と同じものを流用して「同じ機器が SC に移った」ことを示す
 * （攻撃者だけステップ6で新たに現れる）。
 */
export const scDiagramNodes: DiagramNodeSpec[] = [
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'メーカーA 製',
    deviceInstance: 3056526,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 60, y: 0 },
  },
  {
    id: 'lighting',
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'メーカーB 製',
    deviceInstance: 100201,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 340, y: 0 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'メーカーC 製',
    deviceInstance: 100305,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 620, y: 0 },
  },
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'ハブ機能を兼ねる（wss / TLS 1.3）',
    deviceInstance: 260001,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 340, y: 200 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '証明書を持たない',
    hasCertificate: false,
    appearsAt: 6,
    position: { x: 760, y: 200 },
  },
]

export const scDiagramEdges: DiagramEdgeSpec[] = [
  { id: 'sc-ahu-hub', source: AHU_ID, target: SC_HUB_ID, appearsAt: 5 },
  {
    id: 'sc-lighting-hub',
    source: 'lighting',
    target: SC_HUB_ID,
    appearsAt: 5,
  },
  { id: 'sc-meter-hub', source: 'meter', target: SC_HUB_ID, appearsAt: 5 },
  // 攻撃者からハブへの線は「繋ごうとして拒否される」を表す。ステップ6で出す
  {
    id: 'sc-attacker-hub',
    source: ATTACKER_ID,
    target: SC_HUB_ID,
    appearsAt: 6,
  },
]
