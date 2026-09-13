import { describe, expect, it } from 'vitest'
import { confidenceDescriptions, confidenceLabels } from '../content/confidence'
import { diagramEdges, diagramNodes } from '../content/diagram'
import { steps } from '../content/steps'
import {
  buildDiagramState,
  canGoNext,
  canGoPrev,
  nextStep,
  prevStep,
  showIp,
  stepByOrder,
  visibleEdges,
  visibleNodes,
} from './steps'
import type { DiagramEdgeSpec, DiagramNodeSpec } from '../domain/types'

describe('ステップの移動', () => {
  it('最初のステップでは戻れず、最後のステップでは進めない', () => {
    expect(canGoPrev(1)).toBe(false)
    expect(canGoNext(1)).toBe(true)
    expect(canGoPrev(4)).toBe(true)
    expect(canGoNext(4)).toBe(false)
  })

  it('端でクランプされる', () => {
    expect(prevStep(1)).toBe(1)
    expect(nextStep(4)).toBe(4)
    expect(nextStep(2)).toBe(3)
    expect(prevStep(3)).toBe(2)
  })
})

describe('ステップ内容', () => {
  it('1〜4 のすべてが定義され、順序が重複しない', () => {
    const orders = steps.map((step) => step.order)
    expect([...orders].sort()).toEqual([1, 2, 3, 4])
  })

  it('order で引ける', () => {
    expect(stepByOrder(steps, 3).id).toBe('interoperability')
  })

  it('存在しない order は例外', () => {
    expect(() => stepByOrder([], 1)).toThrow()
  })
})

describe('注記の確からしさ', () => {
  it('本文に添える注記は、すべてバッジの種類を持つ', () => {
    for (const step of steps) {
      for (const note of step.notes) {
        expect(['standard', 'interpretation']).toContain(note.confidence)
        expect(confidenceLabels[note.confidence].length).toBeGreaterThan(0)
        expect(confidenceDescriptions[note.confidence].length).toBeGreaterThan(
          0,
        )
      }
    }
  })

  it('規格として書く注記には、必ず出典を添える', () => {
    const standards = steps.flatMap((step) =>
      step.notes.filter((note) => note.confidence === 'standard'),
    )
    expect(standards.length).toBeGreaterThan(0)
    for (const note of standards) {
      expect(note.source).toBeTruthy()
    }
  })

  it('注記の id はアプリ全体で一意', () => {
    const ids = steps.flatMap((step) => step.notes.map((note) => note.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('図の育ち方', () => {
  it('ステップ1は機器が1台だけで、線はまだない', () => {
    const state = buildDiagramState(diagramNodes, diagramEdges, 1)
    expect(state.nodes.map((node) => node.id)).toEqual(['ahu'])
    expect(state.edges).toHaveLength(0)
    expect(state.showIp).toBe(false)
  })

  it('ステップ2で IP の札が出て、ネットワーク線が引かれる', () => {
    const state = buildDiagramState(diagramNodes, diagramEdges, 2)
    expect(state.showIp).toBe(true)
    expect(state.nodes.map((node) => node.id)).toContain('net')
    expect(state.edges.map((edge) => edge.id)).toEqual(['e-ahu-net'])
  })

  it('ステップが進むほどノードは増え、減らない', () => {
    const counts = ([1, 2, 3, 4] as const).map(
      (order) => visibleNodes(diagramNodes, order).length,
    )
    expect(counts).toEqual([...counts].sort((a, b) => a - b))
    expect(counts[0]).toBeLessThan(counts[3])
  })

  it('攻撃者はステップ4になるまで現れない', () => {
    expect(visibleNodes(diagramNodes, 3).map((n) => n.id)).not.toContain(
      'attacker',
    )
    expect(visibleNodes(diagramNodes, 4).map((n) => n.id)).toContain('attacker')
  })

  it('片端が出ていないエッジは描かない', () => {
    const nodes: DiagramNodeSpec[] = [
      {
        id: 'a',
        kind: 'controller',
        label: 'A',
        appearsAt: 1,
        position: { x: 0, y: 0 },
      },
      {
        id: 'b',
        kind: 'controller',
        label: 'B',
        appearsAt: 3,
        position: { x: 0, y: 0 },
      },
    ]
    const edges: DiagramEdgeSpec[] = [
      { id: 'e', source: 'a', target: 'b', appearsAt: 1 },
    ]
    expect(visibleEdges(nodes, edges, 1)).toHaveLength(0)
    expect(visibleEdges(nodes, edges, 3)).toHaveLength(1)
  })

  it('IP の札はステップ2以降にだけ出る', () => {
    expect([showIp(1), showIp(2), showIp(3), showIp(4)]).toEqual([
      false,
      true,
      true,
      true,
    ])
  })
})
