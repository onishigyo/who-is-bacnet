import type {
  DiagramEdgeSpec,
  DiagramNodeSpec,
  NodeId,
  World,
} from '../domain/types'
import { bbmdDiagramEdges, bbmdDiagramNodes, SWITCH_A_ID } from './diagram-bbmd'
import { diagramEdges, diagramNodes, NETWORK_NODE_ID } from './diagram'
import { mixedDiagramEdges, mixedDiagramNodes } from './diagram-mixed'
import { SC_HUB_ID, scDiagramEdges, scDiagramNodes } from './diagram-sc'

/** 世界ごとの図と、ブロードキャストやハブ経由の中継点 */
export const worlds: Record<
  World,
  { nodes: DiagramNodeSpec[]; edges: DiagramEdgeSpec[]; networkNodeId: NodeId }
> = {
  ip: {
    nodes: diagramNodes,
    edges: diagramEdges,
    networkNodeId: NETWORK_NODE_ID,
  },
  sc: {
    nodes: scDiagramNodes,
    edges: scDiagramEdges,
    networkNodeId: SC_HUB_ID,
  },
  mixed: {
    nodes: mixedDiagramNodes,
    edges: mixedDiagramEdges,
    networkNodeId: SC_HUB_ID,
  },
  bbmd: {
    nodes: bbmdDiagramNodes,
    edges: bbmdDiagramEdges,
    networkNodeId: SWITCH_A_ID,
  },
}
