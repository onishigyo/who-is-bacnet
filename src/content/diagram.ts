import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'

/** 会話がブロードキャストのとき、経由地として使うノード */
export const NETWORK_NODE_ID: NodeId = 'net'

export const AHU_ID: NodeId = 'ahu'
/** 空調コントローラのデバイスインスタンス。実験の I-Am（ipCapture）に合わせる */
export const AHU_DEVICE_INSTANCE = 3056489
export const SUPERVISOR_ID: NodeId = 'supervisor'
export const ATTACKER_ID: NodeId = 'attacker'

/**
 * 1つのネットワーク図を、ステップごとに育てていく。
 * appearsAt は「このステップから図に出る」という意味。
 *
 * 配置は横長（およそ 4:1）に保つ。会話バーとトラックが下に固定で入るため、
 * 図に使える高さは横幅に比べて小さく、縦に広い配置だと 13 インチで
 * 縮みすぎる（＝文字が読めなくなる）。
 */
export const diagramNodes: DiagramNodeSpec[] = [
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'メーカーA 製',
    deviceInstance: AHU_DEVICE_INSTANCE,
    ip: '192.168.222.130',
    appearsAt: 1,
    position: { x: 0, y: 0 },
  },
  {
    id: NETWORK_NODE_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: '同じネットワーク',
    ip: '192.168.222.0/24',
    appearsAt: 2,
    position: { x: 390, y: 180 },
  },
  {
    id: 'lighting',
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'メーカーB 製',
    deviceInstance: 100201,
    ip: '192.168.222.131',
    appearsAt: 3,
    position: { x: 260, y: 0 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'メーカーC 製',
    deviceInstance: 100305,
    ip: '192.168.222.132',
    appearsAt: 3,
    position: { x: 520, y: 0 },
  },
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'スーパーバイザ',
    deviceInstance: 260001,
    ip: '192.168.222.10',
    appearsAt: 3,
    position: { x: 800, y: 0 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '認証なしで会話に入れる',
    ip: '192.168.222.128',
    appearsAt: 4,
    position: { x: 800, y: 180 },
  },
]

export const diagramEdges: DiagramEdgeSpec[] = [
  { id: 'e-ahu-net', source: AHU_ID, target: NETWORK_NODE_ID, appearsAt: 2 },
  {
    id: 'e-lighting-net',
    source: 'lighting',
    target: NETWORK_NODE_ID,
    appearsAt: 3,
  },
  { id: 'e-meter-net', source: 'meter', target: NETWORK_NODE_ID, appearsAt: 3 },
  {
    id: 'e-supervisor-net',
    source: SUPERVISOR_ID,
    target: NETWORK_NODE_ID,
    appearsAt: 3,
  },
  {
    id: 'e-attacker-net',
    source: ATTACKER_ID,
    target: NETWORK_NODE_ID,
    appearsAt: 4,
  },
]
