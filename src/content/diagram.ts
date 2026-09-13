import type { DiagramEdgeSpec, DiagramNodeSpec, NodeId } from '../domain/types'

/** 会話がブロードキャストのとき、経由地として使うノード */
export const NETWORK_NODE_ID: NodeId = 'net'

export const AHU_ID: NodeId = 'ahu'
export const SUPERVISOR_ID: NodeId = 'supervisor'
export const ATTACKER_ID: NodeId = 'attacker'

/**
 * 1つのネットワーク図を、ステップごとに育てていく。
 * appearsAt は「このステップから図に出る」という意味。
 */
export const diagramNodes: DiagramNodeSpec[] = [
  {
    id: AHU_ID,
    kind: 'controller',
    label: '空調コントローラ',
    sublabel: 'メーカーA 製',
    deviceInstance: 3056930,
    ip: '192.168.1.11',
    appearsAt: 1,
    position: { x: 60, y: 180 },
  },
  {
    id: NETWORK_NODE_ID,
    kind: 'switch',
    label: 'L2 スイッチ',
    sublabel: '同じネットワーク（192.168.1.0/24）',
    appearsAt: 2,
    position: { x: 400, y: 300 },
  },
  {
    id: 'lighting',
    kind: 'controller',
    label: '照明コントローラ',
    sublabel: 'メーカーB 製',
    deviceInstance: 100201,
    ip: '192.168.1.12',
    appearsAt: 3,
    position: { x: 60, y: 440 },
  },
  {
    id: 'meter',
    kind: 'controller',
    label: '電力計',
    sublabel: 'メーカーC 製',
    deviceInstance: 100305,
    ip: '192.168.1.13',
    appearsAt: 3,
    position: { x: 400, y: 560 },
  },
  {
    id: SUPERVISOR_ID,
    kind: 'supervisor',
    label: '中央監視装置',
    sublabel: 'スーパーバイザ',
    deviceInstance: 260001,
    ip: '192.168.1.10',
    appearsAt: 3,
    position: { x: 740, y: 180 },
  },
  {
    id: ATTACKER_ID,
    kind: 'attacker',
    label: '持ち込まれた PC',
    sublabel: '認証なしで会話に入れる',
    ip: '192.168.1.66',
    appearsAt: 4,
    position: { x: 740, y: 470 },
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
