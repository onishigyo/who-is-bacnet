import type {
  Conversation,
  ConversationMessage,
  MessageTarget,
  NodeId,
  PlaybackState,
} from '../domain/types'
import { BROADCAST } from '../domain/types'

export const IDLE_PLAYBACK: PlaybackState = {
  status: 'idle',
  deliveredGroups: 0,
  inFlightGroup: null,
}

export function resetPlayback(): PlaybackState {
  return IDLE_PLAYBACK
}

export function conversationById(
  conversations: Conversation[],
  id: string,
): Conversation {
  const conversation = conversations.find((c) => c.id === id)
  if (!conversation) throw new Error(`会話 ${id} が見つかりません`)
  return conversation
}

/**
 * 同時に飛ぶメッセージのまとまり。
 * groupId が同じメッセージが連続していれば 1 つにまとめ、それ以外は 1 通ずつ。
 * Who-Is への返事は実際にも台数ぶんがほぼ同時に返るので、まとめて扱う。
 */
export function messageGroups(
  conversation: Conversation,
): ConversationMessage[][] {
  const groups: ConversationMessage[][] = []

  for (const message of conversation.messages) {
    const last = groups[groups.length - 1]
    if (message.groupId && last && last[0].groupId === message.groupId) {
      last.push(message)
    } else {
      groups.push([message])
    }
  }

  return groups
}

/**
 * 再生をひとコマ進める。時間は持たず、呼ばれた回数だけ進む純粋関数。
 *
 * idle → 1 つ目のまとまりが飛ぶ → 着信してログに載る → 次が飛ぶ → … → finished
 */
export function advancePlayback(
  state: PlaybackState,
  conversation: Conversation,
): PlaybackState {
  const groups = messageGroups(conversation)
  if (groups.length === 0) {
    return { status: 'finished', deliveredGroups: 0, inFlightGroup: null }
  }

  // 飛んでいるまとまりがあるなら、それを着信させる
  if (state.inFlightGroup !== null) {
    const delivered = state.inFlightGroup + 1
    return {
      status: delivered >= groups.length ? 'finished' : 'playing',
      deliveredGroups: delivered,
      inFlightGroup: null,
    }
  }

  if (state.deliveredGroups >= groups.length) {
    return {
      status: 'finished',
      deliveredGroups: groups.length,
      inFlightGroup: null,
    }
  }

  return {
    status: 'playing',
    deliveredGroups: state.deliveredGroups,
    inFlightGroup: state.deliveredGroups,
  }
}

export function isPlaybackFinished(
  state: PlaybackState,
  conversation: Conversation,
): boolean {
  return state.deliveredGroups >= messageGroups(conversation).length
}

/** ログに出す（＝すでに着信した）メッセージ */
export function deliveredMessages(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  return messageGroups(conversation).slice(0, state.deliveredGroups).flat()
}

/** いま飛んでいるメッセージ。飛んでいなければ空 */
export function inFlightMessages(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  if (state.inFlightGroup === null) return []
  return messageGroups(conversation)[state.inFlightGroup] ?? []
}

/** 直前に着信したまとまり。なければ空 */
export function lastDeliveredGroup(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  if (state.deliveredGroups === 0) return []
  return messageGroups(conversation)[state.deliveredGroups - 1] ?? []
}

/**
 * いま画面で解説すべきまとまり。飛んでいるならそれ、
 * 止まっているなら直前に着信したもの（読む時間を確保するため消さない）。
 */
export function currentGroup(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  const flying = inFlightMessages(state, conversation)
  return flying.length > 0 ? flying : lastDeliveredGroup(state, conversation)
}

/** 送信済み（飛んでいる分を含む）と総数。進み具合の表示に使う */
export function playbackProgress(
  state: PlaybackState,
  conversation: Conversation,
): { sent: number; total: number } {
  return {
    sent:
      deliveredMessages(state, conversation).length +
      inFlightMessages(state, conversation).length,
    total: conversation.messages.length,
  }
}

/** 次を送れるか。飛んでいる最中と、終わったあとは送れない */
export function canSendNext(
  state: PlaybackState,
  conversation: Conversation,
): boolean {
  return (
    state.inFlightGroup === null &&
    state.deliveredGroups < messageGroups(conversation).length
  )
}

/** 次に送られるまとまり。送れないときは空 */
export function nextGroup(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  if (!canSendNext(state, conversation)) return []
  return messageGroups(conversation)[state.deliveredGroups] ?? []
}

/**
 * ボタンに出す予告。まとめて飛ぶものは「3 台が名乗る」のように台数で言う。
 */
export function previewOf(
  group: ConversationMessage[],
  nameOf: (id: NodeId) => string,
): string {
  const [first] = group
  if (!first) return ''
  if (group.length === 1) return `${nameOf(first.from)}が${first.action}`

  const sameAction = group.every((message) => message.action === first.action)
  return sameAction
    ? `${group.length} 台が${first.action}`
    : `${group.length} 通のやり取り`
}

export function isBroadcast(target: MessageTarget): boolean {
  return target === BROADCAST
}

/**
 * メッセージが図のどの区間を飛ぶか。BACnet/IP ではブロードキャストも
 * 同じネットワーク（スイッチ）を経由するので、宛先をスイッチに読み替える。
 */
export function flightPath(
  message: ConversationMessage,
  networkNodeId: NodeId,
): { from: NodeId; to: NodeId } {
  return {
    from: message.from,
    to: isBroadcast(message.to) ? networkNodeId : message.to,
  }
}

/**
 * ブロードキャストが、ネットワークから先どこへ広がるか。
 * 送信元とネットワーク自身を除いた、図に出ているすべてのノード。
 */
export function broadcastTargets(
  nodes: { id: NodeId }[],
  from: NodeId,
  networkId: NodeId,
): NodeId[] {
  return nodes
    .map((node) => node.id)
    .filter((id) => id !== from && id !== networkId)
}

/** そのステップの会話に登場する話し手（図の強調に使う） */
export function speakersOf(conversation: Conversation): NodeId[] {
  return [...new Set(conversation.messages.map((message) => message.from))]
}
