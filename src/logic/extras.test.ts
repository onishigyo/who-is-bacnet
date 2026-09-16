import { describe, expect, it } from 'vitest'
import { bbmdConversations } from '../content/conversations-bbmd'
import { extras } from '../content/extras'
import { worlds } from '../content/worlds'
import { conversationById } from './conversation'
import { buildDiagramState, extraContentById } from './steps'

/**
 * 読み物（BBMD）は、ステップ 1〜7 とは別の画面としてメニューから開く。
 * 中の場面は順に進む流れではなく、条件を変えて見比べる並び。
 * ここでは「どの場面も図と会話が壊れずに引ける」ことを見る。
 */
describe('読み物の場面', () => {
  const bbmd = extraContentById(extras, 'bbmd')

  it('BBMD なし / あり / BACnet/SC なら、の 3 場面を持つ', () => {
    expect(bbmd.stages.map((stage) => stage.navLabel)).toEqual([
      'BBMD なし',
      'BBMD あり',
      'BACnet/SC なら',
    ])
  })

  it('場面の id は重複しない', () => {
    const ids = bbmd.stages.map((stage) => stage.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const stage of bbmd.stages) {
    describe(stage.navLabel, () => {
      const world = worlds[stage.world]
      const diagram = buildDiagramState(world.nodes, world.edges, stage.order)
      const conversation = conversationById(
        bbmdConversations,
        stage.conversationId,
      )

      it('図にノードと配線が出る', () => {
        expect(diagram.nodes.length).toBeGreaterThan(0)
        expect(diagram.edges.length).toBeGreaterThan(0)
      })

      it('会話の話し手・宛先が、その場面の図にいる', () => {
        const shown = new Set(diagram.nodes.map((node) => node.id))
        for (const message of conversation.messages) {
          expect(shown.has(message.from)).toBe(true)
          if (message.to !== 'broadcast') {
            expect(shown.has(message.to)).toBe(true)
          }
        }
      })
    })
  }

  it('BBMD なしの図には BBMD がいない。あり／SC ではそれぞれの中継が出る', () => {
    const kindsAt = (index: number) => {
      const stage = bbmd.stages[index]
      const world = worlds[stage.world]
      return new Set(
        buildDiagramState(world.nodes, world.edges, stage.order).nodes.map(
          (node) => node.kind,
        ),
      )
    }
    expect(kindsAt(0).has('bbmd')).toBe(false)
    expect(kindsAt(1).has('bbmd')).toBe(true)
    // SC なら BBMD は消え、代わりにハブが真ん中に来る
    expect(kindsAt(2).has('bbmd')).toBe(false)
    expect(kindsAt(2).has('hub')).toBe(true)
  })
})
