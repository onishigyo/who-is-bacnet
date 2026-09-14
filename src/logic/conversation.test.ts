import { describe, expect, it } from 'vitest'
import {
  ATTACK_CONVERSATION_ID,
  conversations,
  NORMAL_CONVERSATION_ID,
} from '../content/conversations'
import { diagramNodes, NETWORK_NODE_ID } from '../content/diagram'
import type { ConversationMessage } from '../domain/types'
import { BROADCAST } from '../domain/types'
import {
  broadcastTargets,
  conversationById,
  flightPath,
  flyingMessages,
  groupAt,
  groupIndexOfMessage,
  IDLE_PLAYBACK,
  landGroup,
  messageGroups,
  messagesUpToGroup,
  playGroup,
  selectedMessages,
  speakersOf,
} from './conversation'

const normal = conversationById(conversations, NORMAL_CONVERSATION_ID)
const attack = conversationById(conversations, ATTACK_CONVERSATION_ID)

describe('会話データ', () => {
  it('すべてのメッセージが意訳・実コマンド・解説を持つ', () => {
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        expect(message.plain.length).toBeGreaterThan(0)
        expect(message.protocol.length).toBeGreaterThan(0)
        expect(message.explain.length).toBeGreaterThan(0)
      }
    }
  })

  it('メッセージ id はアプリ全体で一意', () => {
    const ids = conversations.flatMap((c) => c.messages.map((m) => m.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('Who-Is には、その時点で図にいる BACnet 機器が、送信元を除いて全台返事をする', () => {
    const expected = (order: number, asker: string) =>
      diagramNodes
        .filter(
          (node) =>
            node.appearsAt <= order &&
            node.deviceInstance !== undefined &&
            node.id !== asker,
        )
        .map((node) => node.id)
        .sort()

    const responders = (id: string) =>
      conversationById(conversations, id)
        .messages.filter((message) => message.protocol.includes('i-Am'))
        .map((message) => message.from)
        .sort()

    expect(responders(NORMAL_CONVERSATION_ID)).toEqual(
      expected(3, 'supervisor'),
    )
    expect(responders(ATTACK_CONVERSATION_ID)).toEqual(expected(4, 'attacker'))
  })

  it('正常運用と攻撃で、同じ要求が話し手だけ変えて現れる', () => {
    const normalWrite = normal.messages.find((m) =>
      m.protocol.includes('writeProperty'),
    )
    const attackWrite = attack.messages.find((m) =>
      m.protocol.includes('writeProperty'),
    )
    expect(normalWrite?.from).toBe('supervisor')
    expect(attackWrite?.from).toBe('attacker')
    expect(normalWrite?.to).toBe(attackWrite?.to)
    expect(normalWrite?.protocol).toBe(attackWrite?.protocol)
  })
})

describe('まとまり（同時に飛ぶ単位）', () => {
  it('groupId のないメッセージは 1 通ずつのまとまり', () => {
    const groups = messageGroups(normal)
    expect(groups[0].map((m) => m.id)).toEqual(['n1'])
    expect(groups.at(-1)?.map((m) => m.id)).toEqual(['n10'])
  })

  it('攻撃側の i-Am は 4 台がひとまとまり、以降は 1 通ずつ', () => {
    const groups = messageGroups(attack)
    expect(groups[0]).toHaveLength(1)
    expect(groups[1]).toHaveLength(4)
    expect(groups.slice(2).every((group) => group.length === 1)).toBe(true)
  })

  it('メッセージ id から、属するまとまりの index を引ける', () => {
    // i-Am の 1 つを選ぶと、そのまとまり（4 台）
    const index = groupIndexOfMessage(attack, 'a3')
    expect(index).not.toBeNull()
    expect(groupAt(attack, index!).map((m) => m.id)).toEqual([
      'a2',
      'a3',
      'a4',
      'a5',
    ])
    expect(groupIndexOfMessage(attack, 'nope')).toBeNull()
  })

  it('先頭からそのまとまりまでの全メッセージを取れる（機器状態の計算に使う）', () => {
    const upto = messagesUpToGroup(normal, 1)
    // n1（who-Is）と n2〜n4（i-Am まとまり）
    expect(upto.map((m) => m.id)).toEqual(['n1', 'n2', 'n3', 'n4'])
    expect(messagesUpToGroup(normal, -1)).toEqual([])
  })
})

describe('再生（選んで飛ばすモデル）', () => {
  it('まとまりを選ぶと飛行中になり、着地で止まる', () => {
    const flying = playGroup(IDLE_PLAYBACK, 0)
    expect(flying.selected).toBe(0)
    expect(flying.phase).toBe('flying')
    expect(flyingMessages(normal, flying).map((m) => m.id)).toEqual(['n1'])

    const landed = landGroup(flying)
    expect(landed.phase).toBe('landed')
    // 着地後は図を飛んでいないが、選択（帯の表示）は残る
    expect(flyingMessages(normal, landed)).toEqual([])
    expect(selectedMessages(normal, landed).map((m) => m.id)).toEqual(['n1'])
  })

  it('同じまとまりを選び直しても、nonce が変わってアニメがやり直せる', () => {
    const a = playGroup(IDLE_PLAYBACK, 2)
    const b = playGroup(landGroup(a), 2)
    expect(b.selected).toBe(2)
    expect(b.nonce).toBeGreaterThan(a.nonce)
  })

  it('未選択なら、帯にも図にも何も出ない', () => {
    expect(selectedMessages(normal, IDLE_PLAYBACK)).toEqual([])
    expect(flyingMessages(normal, IDLE_PLAYBACK)).toEqual([])
  })
})

describe('図の上の飛び方', () => {
  const msg = (over: Partial<ConversationMessage>): ConversationMessage => ({
    id: 'x',
    from: 'supervisor',
    to: BROADCAST,
    kind: 'request',
    plain: '',
    protocol: '',
    transport: '',
    action: '',
    explain: '',
    ...over,
  })

  it('ブロードキャストはネットワーク（スイッチ）宛として飛ぶ', () => {
    expect(flightPath(msg({ to: BROADCAST }), NETWORK_NODE_ID)).toEqual({
      from: 'supervisor',
      to: NETWORK_NODE_ID,
    })
  })

  it('宛先が決まっているメッセージはそのまま飛ぶ', () => {
    expect(
      flightPath(msg({ from: 'attacker', to: 'ahu' }), NETWORK_NODE_ID),
    ).toEqual({ from: 'attacker', to: 'ahu' })
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

describe('ブロードキャストの広がり', () => {
  it('ネットワークから、送信元以外のすべての機器へ広がる', () => {
    expect(
      broadcastTargets(diagramNodes, 'supervisor', NETWORK_NODE_ID),
    ).toEqual(['ahu', 'lighting', 'meter', 'attacker'])
  })

  it('送信元とネットワーク自身は含まない', () => {
    const targets = broadcastTargets(diagramNodes, 'attacker', NETWORK_NODE_ID)
    expect(targets).not.toContain('attacker')
    expect(targets).not.toContain(NETWORK_NODE_ID)
  })
})
