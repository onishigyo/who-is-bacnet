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
 * 配線をたどって最初に見つかるハブ。ハブとの間はふつうの TCP 接続なので、
 * L2 スイッチもルータも素通しして探す（IP のブロードキャストと違う）。
 */
function hubNear(
  kindOf: Map<NodeId, NodeKind>,
  neighbors: Map<NodeId, NodeId[]>,
  from: NodeId,
): NodeId | undefined {
  const passable = (id: NodeId) => {
    const kind = kindOf.get(id)
    return kind === 'switch' || kind === 'router'
  }

  const seen = new Set<NodeId>([from])
  let frontier: NodeId[] = [from]
  while (frontier.length > 0) {
    const next: NodeId[] = []
    for (const node of frontier) {
      for (const neighbor of neighbors.get(node) ?? []) {
        if (seen.has(neighbor)) continue
        seen.add(neighbor)
        if (kindOf.get(neighbor) === 'hub') return neighbor
        if (passable(neighbor)) next.push(neighbor)
      }
    }
    frontier = next
  }
  return undefined
}

/**
 * そのメッセージにとっての、ブロードキャストの出発点になる中継。
 *
 * BACnet/SC の世界（ハブがある図）では、配るのはハブ。機器はサブネットに
 * 関係なくハブへ接続しているので、ハブまで届けてから配り直す。
 * BACnet/IP の世界では、配るのは送信元のいる区画の L2 スイッチ。
 * どちらでもなければ world 固定の中継点に落とす。
 */
export function relayNodeFor(
  message: ConversationMessage,
  nodes: Pick<DiagramNodeSpec, 'id' | 'kind'>[],
  edges: DiagramEdgeSpec[],
  networkNodeId: NodeId,
): NodeId {
  const kindOf = new Map(nodes.map((node) => [node.id, node.kind]))
  const neighbors = neighborsOf(edges)

  if (kindOf.get(message.from) === 'hub') return message.from
  const hub = hubNear(kindOf, neighbors, message.from)
  if (hub) return hub

  const spreads = (id: NodeId) => {
    const kind = kindOf.get(id)
    return kind !== undefined && SPREADING_KINDS.has(kind)
  }
  if (spreads(message.from)) return message.from
  return (neighbors.get(message.from) ?? []).find(spreads) ?? networkNodeId
}

/**
 * その 1 対 1 の通信が、ハブを経由するか（経由するならハブの id）。
 *
 * BACnet/SC では、機器どうしが直接話すのではなく、それぞれがハブへ張った
 * 接続を通る。図の配線をそのままたどると、同じ L2 スイッチにぶら下がる
 * 機器どうしがハブを通らずに繋がって見えてしまうので、両端とも SC に
 * 参加している（証明書を持つ）機器なら、ハブを経由地として明示する。
 * 片方でも SC 非対応なら（旧来の区画の電力計や、持ち込まれた PC）、
 * ハブは通らない ── そこが SC の限界の話そのものなので、隠さない。
 */
export function relayHubFor(
  nodes: Pick<DiagramNodeSpec, 'id' | 'kind' | 'hasCertificate'>[],
  from: NodeId,
  to: NodeId,
): NodeId | undefined {
  const hub = nodes.find((node) => node.kind === 'hub')
  if (!hub || from === hub.id || to === hub.id) return undefined

  const joinsHub = (id: NodeId) =>
    nodes.find((node) => node.id === id)?.hasCertificate === true
  return joinsHub(from) && joinsHub(to) ? hub.id : undefined
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
 *
 * 中継点から配線をたどる。通り抜けられるものは、中継点が何かで変わる。
 *   L2 スイッチが配る（BACnet/IP）… スイッチだけ通り抜ける。ルータと
 *     BBMD は境界なので、そこで止める。ただし境界自身は受け取るので、
 *     送り先としては返す（BBMD が受け取ることが、読み物で見せたい当のこと）
 *   ハブが配る（BACnet/SC）… スイッチもルータも通り抜ける。ハブとの間は
 *     ふつうの TCP 接続で、ルータが素通しするため
 */
export function broadcastTargets(
  nodes: Pick<DiagramNodeSpec, 'id' | 'kind'>[],
  edges: DiagramEdgeSpec[],
  from: NodeId,
  networkId: NodeId,
): NodeId[] {
  const kindOf = new Map(nodes.map((node) => [node.id, node.kind]))
  const neighbors = neighborsOf(edges)
  const fromHub = kindOf.get(networkId) === 'hub'

  const passable = (kind: NodeKind | undefined) => {
    if (kind === undefined) return false
    if (SPREADING_KINDS.has(kind)) return true
    return fromHub && kind === 'router'
  }

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
        if (passable(kind)) {
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
