import type {
  DiagramEdgeSpec,
  DiagramNodeSpec,
  DiagramState,
  StepContent,
  StepOrder,
} from '../domain/types'

export const FIRST_STEP: StepOrder = 1
export const LAST_STEP: StepOrder = 7
export const STEP_ORDERS: StepOrder[] = [1, 2, 3, 4, 5, 6, 7]

/** IP アドレスの札が出るステップ（BACnet/IP の説明以降） */
const IP_VISIBLE_FROM: StepOrder = 2

function clampOrder(value: number): StepOrder {
  if (value <= FIRST_STEP) return FIRST_STEP
  if (value >= LAST_STEP) return LAST_STEP
  return value as StepOrder
}

export function canGoNext(order: StepOrder): boolean {
  return order < LAST_STEP
}

export function canGoPrev(order: StepOrder): boolean {
  return order > FIRST_STEP
}

export function nextStep(order: StepOrder): StepOrder {
  return clampOrder(order + 1)
}

export function prevStep(order: StepOrder): StepOrder {
  return clampOrder(order - 1)
}

export function stepByOrder(
  steps: StepContent[],
  order: StepOrder,
): StepContent {
  const step = steps.find((s) => s.order === order)
  if (!step) throw new Error(`ステップ ${order} の内容が見つかりません`)
  return step
}

export function showIp(order: StepOrder): boolean {
  return order >= IP_VISIBLE_FROM
}

export function visibleNodes(
  specs: DiagramNodeSpec[],
  order: StepOrder,
): DiagramNodeSpec[] {
  return specs.filter((node) => node.appearsAt <= order)
}

/**
 * 表示中のエッジ。両端のノードが figure に出ていないエッジは、
 * コンテンツ側の指定に関わらず描かない（図が壊れないようにする）。
 */
export function visibleEdges(
  nodeSpecs: DiagramNodeSpec[],
  edgeSpecs: DiagramEdgeSpec[],
  order: StepOrder,
): DiagramEdgeSpec[] {
  const shown = new Set(visibleNodes(nodeSpecs, order).map((node) => node.id))
  return edgeSpecs.filter(
    (edge) =>
      edge.appearsAt <= order &&
      shown.has(edge.source) &&
      shown.has(edge.target),
  )
}

/** そのステップで図に出ているものを、まとめて組み立てる */
export function buildDiagramState(
  nodeSpecs: DiagramNodeSpec[],
  edgeSpecs: DiagramEdgeSpec[],
  order: StepOrder,
): DiagramState {
  return {
    nodes: visibleNodes(nodeSpecs, order),
    edges: visibleEdges(nodeSpecs, edgeSpecs, order),
    showIp: showIp(order),
  }
}
