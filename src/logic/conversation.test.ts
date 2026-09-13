import { describe, expect, it } from 'vitest'
import { conversations, NORMAL_CONVERSATION_ID } from '../content/conversations'
import { NETWORK_NODE_ID } from '../content/diagram'
import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import {
  advancePlayback,
  canSendNext,
  conversationById,
  currentMessage,
  deliveredMessages,
  flightPath,
  IDLE_PLAYBACK,
  inFlightMessage,
  isPlaybackFinished,
  lastDeliveredMessage,
  playbackProgress,
  speakersOf,
} from './conversation'

const normal = conversationById(conversations, NORMAL_CONVERSATION_ID)

describe('会話データ', () => {
  it('すべてのメッセージが意訳と実コマンドの二層、および解説を持つ', () => {
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        expect(message.plain.length).toBeGreaterThan(0)
        expect(message.protocol.length).toBeGreaterThan(0)
        expect(message.explain.length).toBeGreaterThan(0)
      }
    }
  })

  it('Who-Is には、図に出ている機器が全台返事をする', () => {
    const responders = (id: string) =>
      conversationById(conversations, id)
        .messages.filter((message) => message.protocol.startsWith('I-Am'))
        .map((message) => message.from)
        .sort()

    expect(responders(NORMAL_CONVERSATION_ID)).toEqual([
      'ahu',
      'lighting',
      'meter',
    ])
    // 攻撃側でも同じ顔ぶれが返事をする（違うのは話し手だけ）
    expect(responders('attack-discover')).toEqual(['ahu', 'lighting', 'meter'])
  })

  it('メッセージ id はアプリ全体で一意', () => {
    const ids = conversations.flatMap((c) => c.messages.map((m) => m.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('正常運用と攻撃で、同じ要求が話し手だけ変えて現れる', () => {
    const normalWrite = normal.messages.find((m) =>
      m.protocol.startsWith('WriteProperty'),
    )
    const attackWrite = conversationById(
      conversations,
      'attack-write',
    ).messages.find((m) => m.protocol.startsWith('WriteProperty'))
    expect(normalWrite?.from).toBe('supervisor')
    expect(attackWrite?.from).toBe('attacker')
    expect(normalWrite?.to).toBe(attackWrite?.to)
    expect(normalWrite?.kind).toBe(attackWrite?.kind)
  })

  it('存在しない会話 id は例外', () => {
    expect(() => conversationById(conversations, 'nope')).toThrow()
  })
})

describe('会話の再生', () => {
  it('1通ごとに「飛ぶ → 着く」の2コマで進む', () => {
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(flying.status).toBe('playing')
    expect(flying.inFlight).toBe(0)
    expect(deliveredMessages(flying, normal)).toHaveLength(0)
    expect(inFlightMessage(flying, normal)?.id).toBe('n1')

    const landed = advancePlayback(flying, normal)
    expect(landed.inFlight).toBeNull()
    expect(deliveredMessages(landed, normal).map((m) => m.id)).toEqual(['n1'])
  })

  it('最後まで進めると finished になり、それ以上は変化しない', () => {
    let state = IDLE_PLAYBACK
    for (let i = 0; i < normal.messages.length * 2; i += 1) {
      state = advancePlayback(state, normal)
    }
    expect(state.status).toBe('finished')
    expect(isPlaybackFinished(state, normal)).toBe(true)
    expect(deliveredMessages(state, normal)).toHaveLength(
      normal.messages.length,
    )

    const again = advancePlayback(state, normal)
    expect(again).toEqual(state)
  })

  it('空の会話はすぐ finished', () => {
    const empty: Conversation = { id: 'empty', title: '', messages: [] }
    expect(advancePlayback(IDLE_PLAYBACK, empty).status).toBe('finished')
  })
})

describe('図の上の飛び方', () => {
  it('ブロードキャストはネットワーク（スイッチ）宛として飛ぶ', () => {
    const path = flightPath(
      {
        id: 'x',
        from: 'supervisor',
        to: BROADCAST,
        kind: 'request',
        plain: '',
        protocol: '',
        explain: '',
      },
      NETWORK_NODE_ID,
    )
    expect(path).toEqual({ from: 'supervisor', to: NETWORK_NODE_ID })
  })

  it('宛先が決まっているメッセージはそのまま飛ぶ', () => {
    const path = flightPath(
      {
        id: 'x',
        from: 'attacker',
        to: 'ahu',
        kind: 'request',
        plain: '',
        protocol: '',
        explain: '',
      },
      NETWORK_NODE_ID,
    )
    expect(path).toEqual({ from: 'attacker', to: 'ahu' })
  })

  it('話し手を重複なく取り出せる', () => {
    expect(speakersOf(normal)).toEqual([
      'supervisor',
      'ahu',
      'lighting',
      'meter',
    ])
  })
})

describe('1 通ずつ進める操作', () => {
  it('飛んでいる最中は次を送れない', () => {
    expect(canSendNext(IDLE_PLAYBACK, normal)).toBe(true)
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(canSendNext(flying, normal)).toBe(false)
    expect(canSendNext(advancePlayback(flying, normal), normal)).toBe(true)
  })

  it('最後まで送ったら、それ以上は送れない', () => {
    let state = IDLE_PLAYBACK
    for (let i = 0; i < normal.messages.length * 2; i += 1) {
      state = advancePlayback(state, normal)
    }
    expect(canSendNext(state, normal)).toBe(false)
  })

  it('進み具合は「飛んでいる分」も送信済みに数える', () => {
    expect(playbackProgress(IDLE_PLAYBACK, normal)).toEqual({
      sent: 0,
      total: normal.messages.length,
    })
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(playbackProgress(flying, normal).sent).toBe(1)
    expect(playbackProgress(advancePlayback(flying, normal), normal).sent).toBe(
      1,
    )
  })

  it('解説は、飛んでいる間はそのメッセージ、着いたあとも消えない', () => {
    expect(currentMessage(IDLE_PLAYBACK, normal)).toBeNull()

    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(currentMessage(flying, normal)?.id).toBe('n1')

    const landed = advancePlayback(flying, normal)
    expect(inFlightMessage(landed, normal)).toBeNull()
    expect(lastDeliveredMessage(landed, normal)?.id).toBe('n1')
    expect(currentMessage(landed, normal)?.id).toBe('n1')
  })
})
