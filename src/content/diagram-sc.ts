import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import {
  AHU_DEVICE_INSTANCE,
  AHU_ID,
  ATTACKER_ID,
  SUPERVISOR_ID,
} from './diagram'

/**
 * SC 編の中央。専用のハブを 1 つ置く（分かりやすさ優先）。
 * ハブは専用機とは限らず中央監視などが兼ねることもある、というのは制作者の
 * 理解（規格の原文では未確認）なので、要検証の注記で補う。各機器はここへ TLS（wss）で繋ぐ。
 */
export const SC_HUB_ID: NodeId = 'sc-hub'

/**
 * SC の図。中央に専用の SC ハブを置き、証明書を持つ機器（中央監視も
 * 含む）がそこへ TLS 接続する。攻撃者だけステップ6で現れ、証明書が
 * なく弾かれる。
 *
 * L2 スイッチは、BACnet/IP の図と同じように描く。SC にしても建物の
 * 配線は 1 本も変わらない（機器は今までどおりスイッチに繋がっている）。
 * 変わるのは、その上で誰と話せるかをハブと証明書が決めるようになる、
 * という点だけ。スイッチを省くと「SC にするとスイッチが要らない」と
 * 読めてしまうので、省かない。
 *
 * 機器の id は BACnet/IP の図と同じものを流用して「同じ機器が SC に
 * 移った」ことを示す。
 */
export const SC_SWITCH_ID: NodeId = 'sc-switch'
export const scDiagramNodes: DiagramNodeSpec[] = [
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'メーカーA 製',
    deviceInstance: AHU_DEVICE_INSTANCE,
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
    id: SC_SWITCH_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: '配線はこれまでどおり',
    appearsAt: 5,
    position: { x: 375, y: 180 },
  },
  {
    id: SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: '証明書を確かめて参加を通す',
    appearsAt: 5,
    position: { x: 375, y: 360 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '証明書を持たない',
    hasCertificate: false,
    appearsAt: 6,
    position: { x: 750, y: 360 },
  },
]

export const scDiagramEdges: DiagramEdgeSpec[] = [
  // 機器はこれまでどおりスイッチに繋がっている（配線は SC でも変わらない）
  { id: 'sc-ahu-sw', source: AHU_ID, target: SC_SWITCH_ID, appearsAt: 5 },
  {
    id: 'sc-lighting-sw',
    source: 'lighting',
    target: SC_SWITCH_ID,
    appearsAt: 5,
  },
  { id: 'sc-meter-sw', source: 'meter', target: SC_SWITCH_ID, appearsAt: 5 },
  {
    id: 'sc-supervisor-sw',
    source: SUPERVISOR_ID,
    target: SC_SWITCH_ID,
    appearsAt: 5,
  },
  {
    id: 'sc-sw-hub',
    source: SC_SWITCH_ID,
    target: SC_HUB_ID,
    appearsAt: 5,
    label: '各機器はここを通ってハブへ繋ぐ',
  },
  // 持ち込まれた PC も、配線の上では同じスイッチにいる。
  // それでもハブへの参加は断られる ── そこが BACnet/IP との違い
  {
    id: 'sc-attacker-sw',
    source: ATTACKER_ID,
    target: SC_SWITCH_ID,
    appearsAt: 6,
  },
  {
    id: 'sc-attacker-hub',
    source: ATTACKER_ID,
    target: SC_HUB_ID,
    appearsAt: 6,
  },
]
