import type {
  Conversation,
  ConversationMessage,
  MessageTarget,
  NodeId,
  PlaybackState,
} from '../domain/types'
import { BROADCAST } from '../domain/types'

export const IDLE_PLAYBACK: PlaybackState = {
  selected: null,
  phase: 'landed',
  nonce: 0,
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

/** index 番目のまとまり（無ければ空） */
export function groupAt(
  conversation: Conversation,
  index: number,
): ConversationMessage[] {
  return messageGroups(conversation)[index] ?? []
}

/** そのメッセージが属するまとまりの index（無ければ null） */
export function groupIndexOfMessage(
  conversation: Conversation,
  messageId: string,
): number | null {
  const index = messageGroups(conversation).findIndex((group) =>
    group.some((message) => message.id === messageId),
  )
  return index < 0 ? null : index
}

/** 先頭から index 番目のまとまりまでの、全メッセージ（機器状態の計算に使う） */
export function messagesUpToGroup(
  conversation: Conversation,
  index: number,
): ConversationMessage[] {
  if (index < 0) return []
  return messageGroups(conversation)
    .slice(0, index + 1)
    .flat()
}

/** いま選んでいるまとまりのメッセージ（帯・トラックの強調に使う） */
export function selectedMessages(
  conversation: Conversation,
  state: PlaybackState,
): ConversationMessage[] {
  return state.selected === null ? [] : groupAt(conversation, state.selected)
}

/** いま図を飛んでいるメッセージ（飛行中のときだけ） */
export function flyingMessages(
  conversation: Conversation,
  state: PlaybackState,
): ConversationMessage[] {
  return state.phase === 'flying' ? selectedMessages(conversation, state) : []
}

/** いま選んでいるメッセージのうち、そのキャプチャの行を指す番号（答え合わせで光らせる） */
export function highlightedFrames(
  conversation: Conversation | null,
  current: ConversationMessage[],
  captureId: string,
): number[] {
  if (conversation?.captureId !== captureId) return []
  return current.flatMap((message) => [
    ...(message.frame === undefined ? [] : [message.frame]),
    ...(message.relatedFrames ?? []),
  ])
}

/** 攻撃者が送った、または攻撃者に届く通信か（危険として赤で見せる） */
export function involvesAttacker(
  message: ConversationMessage,
  attackerId: NodeId,
): boolean {
  return message.from === attackerId || message.to === attackerId
}

/** 次に押してほしいまとまりの index。飛んでいる最中や、最後まで来たときは null */
export function nextGroupIndex(
  conversation: Conversation,
  state: PlaybackState,
): number | null {
  if (state.selected === null || state.phase === 'flying') return null
  const next = state.selected + 1
  return next < messageGroups(conversation).length ? next : null
}

/** そのまとまりを再生する状態へ進める */
export function playGroup(state: PlaybackState, index: number): PlaybackState {
  return { selected: index, phase: 'flying', nonce: state.nonce + 1 }
}

/** 飛行中のまとまりを着地させる */
export function landGroup(state: PlaybackState): PlaybackState {
  return { ...state, phase: 'landed' }
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
