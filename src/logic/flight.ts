import type { ConversationMessage, DiagramState, NodeId } from '../domain/types'
import {
  broadcastTargets,
  flightPath,
  involvesAttacker,
  isBroadcast,
  relayHubFor,
  relayNodeFor,
} from './conversation'
import { activeEdgeIds, flightWaypoints, type Point } from './layout'

/**
 * 1 区間（隣のノードへ 1 つ進む）にかける時間。
 *
 * 総時間を固定すると、1 区間だけのメッセージはだらだら遅く、何度も
 * 中継するメッセージは目で追えないほど速くなる。距離ではなく「何回
 * 中継したか」が読み手にとっての手数なので、区間あたりを固定する。
 */
export const MS_PER_HOP = 2080

/** まとめて飛ぶメッセージを、少しずつずらして出す間隔 */
const STAGGER_MS = 150

/** 経路が引けなかったときでも、間が持つ長さ */
const MIN_MS = MS_PER_HOP

function legDuration(points: Point[]): number {
  return Math.max(MIN_MS, (points.length - 1) * MS_PER_HOP)
}

/** 図の上を飛ぶ 1 通ぶんの計画（描画層はこれをそのまま描くだけ） */
export interface PlannedFlight {
  message: ConversationMessage
  /** ブロードキャストで、中継点から先へ広がるか */
  broadcasting: boolean
  /** 攻撃者が関わる通信か（赤で見せる） */
  danger: boolean
  /** 送信元から宛先（ブロードキャストなら中継点）までの経路 */
  main: Point[]
  /** 中継点から広がる先ぶんの経路 */
  fans: Point[][]
  /** 光らせるエッジの id */
  legs: string[]
  /** 飛び始めるまでの待ち */
  delayMs: number
  mainMs: number
  /** 広がりぶんの、いちばん長いものの長さ（0 なら広がらない） */
  fanMs: number
  /** 広がりぶん 1 本ずつの長さ */
  fanMsEach: number[]
}

/**
 * いま飛ぶメッセージを、図の上の経路と時間に落とす。
 * React も DOM も触らない純粋関数なので、描画層（経路を描く）と
 * App（着地のタイミングを計る）が同じ計画を共有できる。
 */
export function planFlights(
  diagram: DiagramState,
  messages: ConversationMessage[],
  networkNodeId: NodeId,
  attackerId: NodeId,
): PlannedFlight[] {
  return messages.map((message, index) => {
    const relayNode = relayNodeFor(
      message,
      diagram.nodes,
      diagram.edges,
      networkNodeId,
    )
    const path = flightPath(message, relayNode)
    const fanOut = isBroadcast(message.to)
      ? broadcastTargets(diagram.nodes, diagram.edges, message.from, relayNode)
      : []
    // SC では機器どうしが直接話さず、必ずハブを通る
    const viaHub = relayHubFor(diagram.nodes, path.from, path.to)

    const main = flightWaypoints(
      diagram.nodes,
      diagram.edges,
      path.from,
      path.to,
      relayNode,
      viaHub,
    )
    const fans = fanOut.map((target) =>
      flightWaypoints(
        diagram.nodes,
        diagram.edges,
        relayNode,
        target,
        relayNode,
      ),
    )
    const fanMsEach = fans.map(legDuration)

    return {
      message,
      broadcasting: fanOut.length > 0,
      danger: involvesAttacker(message, attackerId),
      main,
      fans,
      legs: activeEdgeIds(
        diagram.edges,
        path.from,
        path.to,
        relayNode,
        viaHub,
      ).concat(
        fanOut.flatMap((target) =>
          activeEdgeIds(diagram.edges, relayNode, target, relayNode),
        ),
      ),
      delayMs: index * STAGGER_MS,
      mainMs: legDuration(main),
      fanMs: fanMsEach.length > 0 ? Math.max(...fanMsEach) : 0,
      fanMsEach,
    }
  })
}

/** そのまとまり全体が飛び終わるまでの時間（着地のタイミング） */
export function totalFlightMs(flights: PlannedFlight[]): number {
  if (flights.length === 0) return MIN_MS
  return Math.max(
    ...flights.map((flight) => flight.delayMs + flight.mainMs + flight.fanMs),
  )
}
