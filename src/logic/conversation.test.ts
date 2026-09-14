import { describe, expect, it } from 'vitest'
import { conversations, NORMAL_CONVERSATION_ID } from '../content/conversations'
import { diagramNodes, NETWORK_NODE_ID } from '../content/diagram'
import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import {
  advancePlayback,
  broadcastTargets,
  canSendNext,
  conversationById,
  currentGroup,
  deliveredMessages,
  groupOf,
  flightPath,
  IDLE_PLAYBACK,
  inFlightMessages,
  isPlaybackFinished,
  lastDeliveredGroup,
  messageGroups,
  nextGroup,
  playbackProgress,
  previewOf,
  speakersOf,
} from './conversation'

const nameOf = (id: string) =>
  diagramNodes.find((node) => node.id === id)?.label ?? id

const normal = conversationById(conversations, NORMAL_CONVERSATION_ID)

describe('会話データ', () => {
  it('すべてのメッセージが意訳と実コマンドの二層、および解説を持つ', () => {
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        expect(message.plain.length).toBeGreaterThan(0)
        expect(message.protocol.length).toBeGreaterThan(0)
        expect(message.explain.length).toBeGreaterThan(0)
        expect(message.transport.length).toBeGreaterThan(0)
        // ボタンは「〇〇が{action}」と読ませるので、主語を含めない短い動作にする
        expect(message.action.length).toBeGreaterThan(0)
        expect(message.action.length).toBeLessThan(25)
      }
    }
  })

  it('宛先に書かれた IP は、図にいる機器のものか、サブネットのブロードキャストである', () => {
    const known = new Set(
      diagramNodes.flatMap((node) => (node.ip ? [node.ip] : [])),
    )
    // 192.168.222.0/24 の指向性ブロードキャスト（実験と同じネットワーク）
    known.add('192.168.222.255')

    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        const addresses = message.transport.match(/\d+\.\d+\.\d+\.\d+/g) ?? []
        expect(addresses.length).toBeGreaterThan(0)
        for (const address of addresses) {
          expect(known).toContain(address)
        }
      }
    }
  })

  it('ブロードキャストで送るのは Who-Is だけで、あとは宛先 IP を名指しする', () => {
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        const broadcast = message.transport.includes('192.168.222.255')
        expect(broadcast).toBe(message.protocol.includes('who-Is'))
      }
    }
  })

  it('Who-Is には、その時点で図にいる BACnet 機器が、送信元を除いて全台返事をする', () => {
    // 攻撃者は BACnet 機器ではない（デバイスインスタンスを持たない）ので名乗らない
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

    // ステップ3では中央監視が尋ねる側なので、返すのは機器 3 台
    expect(responders(NORMAL_CONVERSATION_ID)).toEqual(
      expected(3, 'supervisor'),
    )
    // ステップ4では攻撃者が尋ねるので、中央監視も返す
    expect(responders('attack-discover')).toEqual(expected(4, 'attacker'))
  })

  it('メッセージ id はアプリ全体で一意', () => {
    const ids = conversations.flatMap((c) => c.messages.map((m) => m.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('正常運用と攻撃で、同じ要求が話し手だけ変えて現れる', () => {
    const normalWrite = normal.messages.find((m) =>
      m.protocol.includes('writeProperty'),
    )
    const attackWrite = conversationById(
      conversations,
      'attack-overwrite',
    ).messages.find((m) => m.protocol.includes('writeProperty'))
    expect(normalWrite?.from).toBe('supervisor')
    expect(attackWrite?.from).toBe('attacker')
    expect(normalWrite?.to).toBe(attackWrite?.to)
    // Wireshark で見える要求は一字一句同じ。違うのは話し手と、書く値だけ
    expect(normalWrite?.protocol).toBe(attackWrite?.protocol)
    expect(normalWrite?.kind).toBe(attackWrite?.kind)
    // ボタンの予告も同じ文言にして、「違うのは話し手だけ」を画面上でも揃える
    expect(normalWrite?.action).toBe(attackWrite?.action)
  })

  it('存在しない会話 id は例外', () => {
    expect(() => conversationById(conversations, 'nope')).toThrow()
  })
})

describe('会話の再生', () => {
  it('ひとまとまりごとに「飛ぶ → 着く」の2コマで進む', () => {
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(flying.status).toBe('playing')
    expect(flying.inFlightGroup).toBe(0)
    expect(deliveredMessages(flying, normal)).toHaveLength(0)
    expect(inFlightMessages(flying, normal).map((m) => m.id)).toEqual(['n1'])

    const landed = advancePlayback(flying, normal)
    expect(landed.inFlightGroup).toBeNull()
    expect(deliveredMessages(landed, normal).map((m) => m.id)).toEqual(['n1'])
  })

  it('Who-Is への返事は 1 回の操作でまとめて飛ぶ', () => {
    // 1 通目（Who-Is）を送って着信させる
    let state = advancePlayback(IDLE_PLAYBACK, normal)
    state = advancePlayback(state, normal)

    // 次の操作で I-Am が 3 台ぶんまとめて飛ぶ
    state = advancePlayback(state, normal)
    const flying = inFlightMessages(state, normal)
    expect(flying.map((m) => m.id)).toEqual(['n2', 'n3', 'n4'])
    expect(new Set(flying.map((m) => m.groupId)).size).toBe(1)

    state = advancePlayback(state, normal)
    expect(deliveredMessages(state, normal).map((m) => m.id)).toEqual([
      'n1',
      'n2',
      'n3',
      'n4',
    ])
  })

  it('攻撃側も同じく、返事は 4 台ぶんまとめて飛ぶ', () => {
    const discover = conversationById(conversations, 'attack-discover')
    const groups = messageGroups(discover)
    expect(groups.map((group) => group.length)).toEqual([1, 4])
  })

  it('まとまりの数だけ操作すれば終わる', () => {
    const groups = messageGroups(normal)
    let state = IDLE_PLAYBACK
    for (let i = 0; i < groups.length * 2; i += 1) {
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

  it('進み具合は、まとめて飛んだ分も通数で数える', () => {
    let state = advancePlayback(IDLE_PLAYBACK, normal)
    state = advancePlayback(state, normal)
    state = advancePlayback(state, normal)
    expect(playbackProgress(state, normal)).toEqual({
      sent: 4,
      total: normal.messages.length,
    })
  })

  it('空の会話はすぐ finished', () => {
    const empty: Conversation = { id: 'empty', title: '', messages: [] }
    expect(advancePlayback(IDLE_PLAYBACK, empty).status).toBe('finished')
  })

  it('groupId のないメッセージは 1 通ずつのまとまりになる', () => {
    const groups = messageGroups(normal)
    expect(groups[0].map((m) => m.id)).toEqual(['n1'])
    expect(groups.at(-1)?.map((m) => m.id)).toEqual(['n10'])
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
        transport: '',
        action: '',
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
        transport: '',
        action: '',
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

describe('進める操作', () => {
  it('飛んでいる最中は次を送れない', () => {
    expect(canSendNext(IDLE_PLAYBACK, normal)).toBe(true)
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(canSendNext(flying, normal)).toBe(false)
    expect(canSendNext(advancePlayback(flying, normal), normal)).toBe(true)
  })

  it('最後まで送ったら、それ以上は送れない', () => {
    let state = IDLE_PLAYBACK
    for (let i = 0; i < messageGroups(normal).length * 2; i += 1) {
      state = advancePlayback(state, normal)
    }
    expect(canSendNext(state, normal)).toBe(false)
    expect(nextGroup(state, normal)).toEqual([])
  })

  it('解説は、飛んでいる間はそのまとまり、着いたあとも消えない', () => {
    expect(currentGroup(IDLE_PLAYBACK, normal)).toEqual([])

    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(currentGroup(flying, normal).map((m) => m.id)).toEqual(['n1'])

    const landed = advancePlayback(flying, normal)
    expect(inFlightMessages(landed, normal)).toEqual([])
    expect(lastDeliveredGroup(landed, normal).map((m) => m.id)).toEqual(['n1'])
    expect(currentGroup(landed, normal).map((m) => m.id)).toEqual(['n1'])
  })
})

describe('次に何が起きるかの予告', () => {
  it('1 通なら「話し手が〜する」', () => {
    expect(previewOf(nextGroup(IDLE_PLAYBACK, normal), nameOf)).toBe(
      '中央監視装置が全員に呼びかける',
    )
  })

  it('まとめて飛ぶものは台数で言う', () => {
    let state = advancePlayback(IDLE_PLAYBACK, normal)
    state = advancePlayback(state, normal)
    expect(previewOf(nextGroup(state, normal), nameOf)).toBe('3 台が名乗る')
  })

  it('送れないときは空', () => {
    const flying = advancePlayback(IDLE_PLAYBACK, normal)
    expect(previewOf(nextGroup(flying, normal), nameOf)).toBe('')
  })

  it('予告は「話し手 + が + 動作」として読める（動作に主語を含めない）', () => {
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        const speaker = nameOf(message.from)
        expect(message.action).not.toContain(speaker)
        expect(message.action.startsWith('が')).toBe(false)
        // ボタンは「▸ 〇〇が〜する」の 1 行。長いと折り返して不格好になる
        expect(`▸ ${speaker}が${message.action}`.length).toBeLessThanOrEqual(20)
      }
    }
  })
})

describe('ブロードキャストの広がり', () => {
  it('ネットワークから、送信元以外のすべての機器へ広がる', () => {
    const targets = broadcastTargets(
      diagramNodes,
      'supervisor',
      NETWORK_NODE_ID,
    )
    expect(targets).toEqual(['ahu', 'lighting', 'meter', 'attacker'])
  })

  it('送信元とネットワーク自身は含まない', () => {
    const targets = broadcastTargets(diagramNodes, 'attacker', NETWORK_NODE_ID)
    expect(targets).not.toContain('attacker')
    expect(targets).not.toContain(NETWORK_NODE_ID)
  })

  it('図に出ているノードだけが対象（ステップごとに変わる）', () => {
    const step2Nodes = diagramNodes.filter((node) => node.appearsAt <= 2)
    expect(broadcastTargets(step2Nodes, 'supervisor', NETWORK_NODE_ID)).toEqual(
      ['ahu'],
    )
  })
})

describe('読み直しの単位', () => {
  const transcript = conversationById(conversations, 'attack-discover').messages

  it('まとめて飛んだ 1 通を選ぶと、まとまり全体が返る', () => {
    expect(groupOf(transcript, 'a3').map((m) => m.id)).toEqual([
      'a2',
      'a3',
      'a4',
      'a5',
    ])
  })

  it('まとまりに属さないメッセージは、それ 1 通だけ', () => {
    expect(groupOf(transcript, 'a1').map((m) => m.id)).toEqual(['a1'])
  })

  it('会話をまたいで積んだ記録でも、まとまりを取り違えない', () => {
    const mixed = [
      ...conversationById(conversations, 'attack-discover').messages,
      ...conversationById(conversations, 'attack-read').messages,
    ]
    expect(groupOf(mixed, 'a5').map((m) => m.id)).toEqual([
      'a2',
      'a3',
      'a4',
      'a5',
    ])
    expect(groupOf(mixed, 'a6').map((m) => m.id)).toEqual(['a6'])
  })

  it('知らない id なら空', () => {
    expect(groupOf(transcript, 'nope')).toEqual([])
  })
})
