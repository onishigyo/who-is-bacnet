import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { DeviceState, DiagramNodeSpec, NodeKind } from '../../domain/types'

export type BacnetNodeData = {
  spec: DiagramNodeSpec
  showIp: boolean
  /** いま喋っている（パケットの送信元）か */
  speaking: boolean
  /** 喋っている通信が、攻撃者の関わる危険な通信か */
  speakingDanger: boolean
  /** 値を表示する機器なら、その状態 */
  device: DeviceState | null
}

export type BacnetFlowNode = Node<BacnetNodeData, 'bacnet'>

const kindLabel: Record<NodeKind, string> = {
  controller: 'BACnet 機器',
  supervisor: '中央監視',
  switch: 'ネットワーク',
  hub: 'SC ハブ',
  router: 'ルータ',
  attacker: '攻撃者',
}

/** 描画だけを担当する。表示するかどうかの判断はロジック層が済ませている */
export function BacnetNode({ data }: NodeProps<BacnetFlowNode>) {
  const { spec, showIp, speaking, speakingDanger, device } = data
  const classes = [
    'node',
    `node--${spec.kind}`,
    speaking ? 'is-speaking' : '',
    speaking && speakingDanger ? 'is-danger' : '',
    device?.compromised ? 'is-compromised' : '',
    spec.certificateExpired ? 'is-expired' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Top} className="node__handle" />
      <Handle type="source" position={Position.Top} className="node__handle" />

      <span className="node__kind">{kindLabel[spec.kind]}</span>
      <span className="node__label">{spec.label}</span>
      {spec.sublabel && <span className="node__sub">{spec.sublabel}</span>}

      <span className="node__meta">
        {showIp && spec.ip && <code className="node__ip">{spec.ip}</code>}
        {spec.deviceInstance !== undefined && (
          <code className="node__instance">device,{spec.deviceInstance}</code>
        )}
      </span>

      {device && (
        <span className="node__readout">
          <span className={device.compromised ? 'is-alert' : ''}>
            設定温度 {device.setpoint.toFixed(1)} ℃
            {device.compromised && ' ← 書き換えられた'}
          </span>
        </span>
      )}
    </div>
  )
}
