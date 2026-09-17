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
export const MIXED_SC_SWITCH_ID: NodeId = 'mixed-sc-switch'

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
    // ハブへの近道の線は引かず（配線上はスイッチに繋がっている）、
    // 入れないことは箱の札で伝える
    sublabel: '証明書が期限切れでハブに入れない',
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
    position: { x: 200, y: 340 },
  },
  {
    id: MIXED_ROUTER_ID,
    kind: 'router',
    label: 'BACnet ルータ',
    sublabel: 'SC と BACnet/IP をつなぐ',
    hasCertificate: true,
    appearsAt: 7,
    position: { x: 560, y: 340 },
  },
  {
    id: MIXED_SC_SWITCH_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: 'SC の区画',
    appearsAt: 7,
    position: { x: 200, y: 170 },
  },
  {
    id: LEGACY_SWITCH_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: '旧来の BACnet/IP の区画',
    appearsAt: 7,
    position: { x: 560, y: 480 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'SC 非対応（既存の機器）',
    deviceInstance: 100305,
    appearsAt: 7,
    position: { x: 0, y: 480 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '旧来の区画に繋がれた',
    appearsAt: 7,
    position: { x: 860, y: 480 },
  },
]

export const mixedDiagramEdges: DiagramEdgeSpec[] = [
  // SC の区画でも、機器はふつうに L2 スイッチに繋がっている
  {
    id: 'mx-supervisor-sw',
    source: SUPERVISOR_ID,
    target: MIXED_SC_SWITCH_ID,
    appearsAt: 7,
  },
  { id: 'mx-ahu-sw', source: AHU_ID, target: MIXED_SC_SWITCH_ID, appearsAt: 7 },
  {
    id: 'mx-lighting-sw',
    source: 'lighting',
    target: MIXED_SC_SWITCH_ID,
    appearsAt: 7,
  },
  {
    id: 'mx-sw-hub',
    source: MIXED_SC_SWITCH_ID,
    target: SC_HUB_ID,
    appearsAt: 7,
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
    label: 'BACnet/IP と同じく読み書きできる',
  },
  {
    id: 'mx-attacker-switch',
    source: ATTACKER_ID,
    target: LEGACY_SWITCH_ID,
    appearsAt: 7,
    tone: 'danger',
  },
]
