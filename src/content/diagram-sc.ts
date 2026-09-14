import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

/**
 * SC 編の中央。専用のハブを 1 つ置く（分かりやすさ優先）。
 * 実際にはハブは専用機とは限らず、中央監視などどのノードでも「ハブ機能」を
 * 兼ねられる ── その点は注記で補う。各機器はここへ TLS（wss）で繋ぐ。
 */
export const SC_HUB_ID: NodeId = 'sc-hub'

/**
 * SC 編の図。IP 編とはトポロジが違う（hub-and-spoke）。
 * 中央に専用の SC ハブを置き、証明書を持つ機器（中央監視も含む）が
 * そこへ TLS 接続する。攻撃者だけステップ6で現れ、証明書がなく弾かれる。
 *
 * appearsAt はステップ番号（5〜7）。IP 編と同じ横長比率を保つ。
 * 機器の id は IP 編と同じものを流用して「同じ機器が SC に移った」ことを示す。
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
    position: { x: 0, y: 0 },
  },
  {
    id: 'lighting',
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'メーカーB 製',
    deviceInstance: 100201,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 250, y: 0 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'メーカーC 製',
    deviceInstance: 100305,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 500, y: 0 },
  },
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'スーパーバイザ（証明書あり）',
    deviceInstance: 260001,
    hasCertificate: true,
    appearsAt: 5,
    position: { x: 750, y: 0 },
  },
  {
    id: SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: '証明書を確かめて参加を通す（wss / TLS 1.3）',
    appearsAt: 5,
    position: { x: 375, y: 200 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '証明書を持たない',
    hasCertificate: false,
    appearsAt: 6,
    position: { x: 790, y: 200 },
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
  {
    id: 'sc-supervisor-hub',
    source: SUPERVISOR_ID,
    target: SC_HUB_ID,
    appearsAt: 5,
  },
  // 攻撃者からハブへの線は「繋ごうとして拒否される」を表す。ステップ6で出す
  {
    id: 'sc-attacker-hub',
    source: ATTACKER_ID,
    target: SC_HUB_ID,
    appearsAt: 6,
  },
]
