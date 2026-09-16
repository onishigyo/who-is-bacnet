import type {
  Conversation,
  ConversationMessage,
  DiagramEdgeSpec,
  DiagramNodeSpec,
  MessageTarget,
  NodeId,
  NodeKind,
  PlaybackState,
} from '../domain/types'
import { BROADCAST } from '../domain/types'

/**
 * ブロードキャストをそのまま広げる中継。ここを通った先も同じ区画
 * （ブロードキャストドメイン）で、呼びかけは届く
 */
const SPREADING_KINDS = new Set<NodeKind>(['switch', 'hub'])

/**
 * ブロードキャストがそこで止まる境界。受け取りはするが、その先へは
 * 流さない。越えさせたければ、別のメッセージとして描く
 * （BBMD のユニキャスト転送がまさにそれ）
 */
const BOUNDARY_KINDS = new Set<NodeKind>(['router', 'bbmd'])

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

/** 配線（エッジ）から、双方向の隣接リストを作る */
function neighborsOf(edges: DiagramEdgeSpec[]): Map<NodeId, NodeId[]> {
  const neighbors = new Map<NodeId, NodeId[]>()
  const link = (a: NodeId, b: NodeId) => {
    neighbors.set(a, [...(neighbors.get(a) ?? []), b])
  }
  for (const edge of edges) {
    link(edge.source, edge.target)
    link(edge.target, edge.source)
  }
  return neighbors
}

/**
 * そのメッセージにとっての、ブロードキャストの出発点になる中継。
 * 送信元が中継そのもの（スイッチ・ハブ）ならそれ自身、そうでなければ
 * 送信元の隣にいる中継を使う。BBMD のように機器が中継の先にぶら下がる
 * 図では、world 固定の networkNodeId と実際の出発点が別になりうるため、
 * 配線から求める。隣に中継がいなければ world 固定の中継点に落とす。
 */
export function relayNodeFor(
  message: ConversationMessage,
  nodes: Pick<DiagramNodeSpec, 'id' | 'kind'>[],
  edges: DiagramEdgeSpec[],
  networkNodeId: NodeId,
): NodeId {
  const kindOf = new Map(nodes.map((node) => [node.id, node.kind]))
  const spreads = (id: NodeId) => {
    const kind = kindOf.get(id)
    return kind !== undefined && SPREADING_KINDS.has(kind)
  }

  if (spreads(message.from)) return message.from
  const adjacent = neighborsOf(edges).get(message.from) ?? []
  return adjacent.find(spreads) ?? networkNodeId
}

/**
 * メッセージが図のどの区間を飛ぶか。BACnet/IP ではブロードキャストも
 * 同じネットワーク（スイッチ）を経由するので、宛先を中継点に読み替える。
 */
export function flightPath(
  message: ConversationMessage,
  relayNode: NodeId,
): { from: NodeId; to: NodeId } {
  return {
    from: message.from,
    to: isBroadcast(message.to) ? relayNode : message.to,
  }
}

/**
 * ブロードキャストが、その区画のどこまで広がるか。
 * 中継点から配線をたどり、スイッチ・ハブは通り抜けて（同じ区画なので）、
 * 機器と境界（ルータ・BBMD）に届いたらそこで止める。境界自身は「受け取る
 * 相手」として返す ── BBMD がブロードキャストを受け取ることが、番外編で
 * 見せたい当のことだから。境界の先へは広げない。
 */
export function broadcastTargets(
  nodes: Pick<DiagramNodeSpec, 'id' | 'kind'>[],
  edges: DiagramEdgeSpec[],
  from: NodeId,
  networkId: NodeId,
): NodeId[] {
  const kindOf = new Map(nodes.map((node) => [node.id, node.kind]))
  const neighbors = neighborsOf(edges)

  const targets: NodeId[] = []
  const seen = new Set<NodeId>([networkId])
  let frontier: NodeId[] = [networkId]
  while (frontier.length > 0) {
    const next: NodeId[] = []
    for (const node of frontier) {
      for (const neighbor of neighbors.get(node) ?? []) {
        if (seen.has(neighbor)) continue
        seen.add(neighbor)
        const kind = kindOf.get(neighbor)
        // スイッチ・ハブの先も同じ区画。通り抜けて先を見る
        if (kind !== undefined && SPREADING_KINDS.has(kind)) {
          next.push(neighbor)
          continue
        }
        if (neighbor !== from) targets.push(neighbor)
      }
    }
    frontier = next
  }
  return targets
}

/** ブロードキャストをそこで止める境界のノードか（説明・テスト用） */
export function isBroadcastBoundary(kind: NodeKind): boolean {
  return BOUNDARY_KINDS.has(kind)
}

/** そのステップの会話に登場する話し手（図の強調に使う） */
export function speakersOf(conversation: Conversation): NodeId[] {
  return [...new Set(conversation.messages.map((message) => message.from))]
}
