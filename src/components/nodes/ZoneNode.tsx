import { type Node, type NodeProps } from '@xyflow/react'
import type { DiagramZoneSpec } from '../../domain/types'

export type ZoneNodeData = { spec: DiagramZoneSpec }
export type ZoneFlowNode = Node<ZoneNodeData, 'zone'>

/**
 * サブネットなどの「囲い」。機器の後ろに敷く面で、押せない・動かせない。
 * IP アドレスを読めなくても、どれが同じまとまりかが目で分かるようにする。
 */
export function ZoneNode({ data }: NodeProps<ZoneFlowNode>) {
  const { spec } = data
  return (
    <div
      className="zone"
      style={{ width: spec.rect.width, height: spec.rect.height }}
    >
      <span className="zone__label">
        {spec.label}
        {spec.sublabel && <span className="zone__sub">{spec.sublabel}</span>}
      </span>
    </div>
  )
}
