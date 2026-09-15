import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'
import {
  AHU_DEVICE_INSTANCE,
  AHU_ID,
  ATTACKER_ID,
  SUPERVISOR_ID,
} from './diagram'
import { SC_HUB_ID } from './diagram-sc'

export const MIXED_ROUTER_ID: NodeId = 'bacnet-router'
export const LEGACY_SWITCH_ID: NodeId = 'legacy-switch'

/**
 * SC の限界（ステップ7）の図。SC の区画と、旧来の BACnet/IP の区画が
 * BACnet ルータでつながる建物。右の説明の 2 つの課題をそのまま描く。
 *
 * 1. 既存の機器：旧来の区画にある SC 非対応の機器は、IP 編と同じく
 *    持ち込まれた PC から操作できる。ルータで通信を絞っていなければ、
 *    PC の要求は SC 側にも届く（ASHRAE Managed BACnet Guidance 14.4）
 * 2. 証明書の運用：期限の切れた証明書では、ハブに繋がれない
 *
 * 機器の id は IP 編・SC 編と同じものを流用する。
 */
export const mixedDiagramNodes: DiagramNodeSpec[] = [
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'スーパーバイザ（証明書あり）',
    deviceInstance: 260001,
    hasCertificate: true,
    appearsAt: 7,
    position: { x: 0, y: 0 },
  },
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'メーカーA 製（証明書あり）',
    deviceInstance: AHU_DEVICE_INSTANCE,
    hasCertificate: true,
    appearsAt: 7,
    position: { x: 260, y: 0 },
  },
  {
    id: 'lighting',
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: '証明書の期限切れ',
    deviceInstance: 100201,
    hasCertificate: true,
    certificateExpired: true,
    appearsAt: 7,
    position: { x: 520, y: 0 },
  },
  {
    id: SC_HUB_ID,
    kind: 'hub',
    label: 'SC ハブ',
    sublabel: '証明書を確かめて参加を通す',
    appearsAt: 7,
    position: { x: 260, y: 190 },
  },
  {
    id: MIXED_ROUTER_ID,
    kind: 'router',
    label: 'BACnet ルータ',
    sublabel: 'SC と BACnet/IP をつなぐ',
    hasCertificate: true,
    appearsAt: 7,
    position: { x: 520, y: 190 },
  },
  {
    id: LEGACY_SWITCH_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: '旧来の BACnet/IP の区画',
    appearsAt: 7,
    position: { x: 520, y: 380 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'SC 非対応（既存の機器）',
    deviceInstance: 100305,
    appearsAt: 7,
    position: { x: 0, y: 380 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '旧来の区画に繋がれた',
    appearsAt: 7,
    position: { x: 800, y: 380 },
  },
]

export const mixedDiagramEdges: DiagramEdgeSpec[] = [
  {
    id: 'mx-supervisor-hub',
    source: SUPERVISOR_ID,
    target: SC_HUB_ID,
    appearsAt: 7,
  },
  { id: 'mx-ahu-hub', source: AHU_ID, target: SC_HUB_ID, appearsAt: 7 },
  {
    id: 'mx-lighting-hub',
    source: 'lighting',
    target: SC_HUB_ID,
    appearsAt: 7,
    tone: 'broken',
    label: '✕ 期限切れで繋がれない',
  },
  {
    id: 'mx-hub-router',
    source: SC_HUB_ID,
    target: MIXED_ROUTER_ID,
    appearsAt: 7,
  },
  {
    id: 'mx-router-switch',
    source: MIXED_ROUTER_ID,
    target: LEGACY_SWITCH_ID,
    appearsAt: 7,
  },
  {
    id: 'mx-meter-switch',
    source: 'meter',
    target: LEGACY_SWITCH_ID,
    appearsAt: 7,
    tone: 'danger',
    label: 'IP 編と同じく読み書きできる',
  },
  {
    id: 'mx-attacker-switch',
    source: ATTACKER_ID,
    target: LEGACY_SWITCH_ID,
    appearsAt: 7,
    tone: 'danger',
  },
]
