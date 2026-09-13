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
  delivered: 0,
  inFlight: null,
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
 * 再生をひとコマ進める。時間は持たず、呼ばれた回数だけ進む純粋関数。
 *
 * idle → 1通目が飛ぶ → 着信してログに載る → 2通目が飛ぶ → … → finished
 */
export function advancePlayback(
  state: PlaybackState,
  conversation: Conversation,
): PlaybackState {
  const total = conversation.messages.length
  if (total === 0) return { status: 'finished', delivered: 0, inFlight: null }

  // 飛んでいるメッセージがあるなら、それを着信させる
  if (state.inFlight !== null) {
    const delivered = state.inFlight + 1
    return {
      status: delivered >= total ? 'finished' : 'playing',
      delivered,
      inFlight: null,
    }
  }

  if (state.delivered >= total) {
    return { status: 'finished', delivered: total, inFlight: null }
  }

  return {
    status: 'playing',
    delivered: state.delivered,
    inFlight: state.delivered,
  }
}

export function isPlaybackFinished(
  state: PlaybackState,
  conversation: Conversation,
): boolean {
  return state.delivered >= conversation.messages.length
}

/** ログに出す（＝すでに着信した）メッセージ */
export function deliveredMessages(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage[] {
  return conversation.messages.slice(0, state.delivered)
}

/** いま飛んでいるメッセージ。なければ null */
export function inFlightMessage(
  state: PlaybackState,
  conversation: Conversation,
): ConversationMessage | null {
  if (state.inFlight === null) return null
  return conversation.messages[state.inFlight] ?? null
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

/** そのステップの会話に登場する話し手（図の強調に使う） */
export function speakersOf(conversation: Conversation): NodeId[] {
  return [...new Set(conversation.messages.map((message) => message.from))]
}
