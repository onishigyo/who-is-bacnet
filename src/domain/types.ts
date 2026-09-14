/**
 * ドメイン型のみを置く層。ロジックも描画もここには書かない。
 */

/** ステップの並び順（1 → 4）。学習順序そのもの */
export type StepOrder = 1 | 2 | 3 | 4

export type StepId =
  'what-is-bacnet' | 'bacnet-ip' | 'interoperability' | 'no-auth'

/** 記述の確からしさ。教材上、両者を視覚的に区別するために使う */
export type Confidence =
  /** 規格・一次情報で裏の取れている確立した事実 */
  | 'standard'
  /** 制作者の理解・解釈であり、検証が必要なもの */
  | 'interpretation'

export interface ContentNote {
  id: string
  confidence: Confidence
  text: string
  /** 一次情報の参照（規格番号・章など）。断定的な記述には可能な限り付ける */
  source?: string
}

export interface StepContent {
  id: StepId
  order: StepOrder
  navLabel: string
  title: string
  lead: string
  paragraphs: string[]
  notes: ContentNote[]
}

export type NodeId = string

export type NodeKind =
  /** 設備機器（空調・照明・電力計など） */
  | 'controller'
  /** 中央監視装置（スーパーバイザ） */
  | 'supervisor'
  /** ネットワーク（スイッチ） */
  | 'switch'
  /** 攻撃者（同じネットワークに持ち込まれた PC） */
  | 'attacker'

export interface DiagramNodeSpec {
  id: NodeId
  kind: NodeKind
  label: string
  /** メーカー名など、ラベルの下に添える一行 */
  sublabel?: string
  /** BACnet のデバイスインスタンス番号 */
  deviceInstance?: number
  /** ステップ2以降に表示する IP アドレス */
  ip?: string
  /** このノードが図に現れるステップ */
  appearsAt: StepOrder
  position: { x: number; y: number }
}

export interface DiagramEdgeSpec {
  id: string
  source: NodeId
  target: NodeId
  appearsAt: StepOrder
}

/** 図の表示状態（純粋ロジックが組み立て、描画層はこれを描くだけ） */
export interface DiagramState {
  nodes: DiagramNodeSpec[]
  edges: DiagramEdgeSpec[]
  /** IP アドレスの札を出すか（ステップ2以降） */
  showIp: boolean
}

/** ブロードキャスト宛（特定の相手を指定しない呼びかけ） */
export const BROADCAST = 'broadcast' as const
export type MessageTarget = NodeId | typeof BROADCAST

export type MessageKind = 'request' | 'response'

/**
 * 会話の1メッセージ。意訳（初学者向け）と実コマンド（技術者向け）の二層を必ず持つ。
 * 正常運用（ステップ3）と攻撃（ステップ4）で、話し手だけが変わることを表現するための型。
 */
export interface ConversationMessage {
  id: string
  from: NodeId
  to: MessageTarget
  kind: MessageKind
  /** 意訳 */
  plain: string
  /** 実コマンド／プロトコル用語。Wireshark の Info 欄と同じ表記で書く */
  protocol: string
  /** 詳細ペインで見える値（Present Value など）。Info 欄には出ない */
  value?: string
  /** 実験キャプチャで対応するパケットの番号。実験にない通信なら持たない */
  frame?: number
  /** どこへ届くか。BACnet の要求自体に相手の識別子は入らず、宛先は IP が決める */
  transport: string
  /** このメッセージで話し手が何をするか（「▸ 〇〇が〜する」の後半） */
  action: string
  /**
   * 同じ値を持つ連続したメッセージは、まとめて同時に飛ぶ。
   * Who-Is への返事のように、実際が「一斉」であるものに使う。
   */
  groupId?: string
  /** いま何が起きているかの解説（1 通ずつ進めるときに読ませる） */
  explain: string
  /** 補足（「認証確認なし」など） */
  annotation?: string
  annotationTone?: 'neutral' | 'alert'
}

export interface Conversation {
  id: string
  title: string
  messages: ConversationMessage[]
}

export type PlaybackStatus = 'idle' | 'playing' | 'finished'

/**
 * 会話再生の状態。時間を持たない純粋な状態機械として扱う。
 * 進む単位はメッセージではなく「まとまり（group）」。
 */
export interface PlaybackState {
  status: PlaybackStatus
  /** 到達済みのまとまりの数 */
  deliveredGroups: number
  /** いま飛んでいるまとまりの index。飛んでいなければ null */
  inFlightGroup: number | null
}

export type AttackActionId = 'discover' | 'read' | 'write' | 'verify'

export interface AttackAction {
  id: AttackActionId
  label: string
  hint: string
  /** 先に済ませておく必要のある操作（ガイド付き進行） */
  requires: AttackActionId | null
  conversationId: string
}

export interface DeviceState {
  /** 攻撃者に発見されたか */
  discovered: boolean
  /** 室温（analog-input,0 present-value 相当） */
  presentValue: number
  /** 設定温度（analog-value,0 present-value 相当） */
  setpoint: number
  /** 書き換えられたか */
  compromised: boolean
}

export interface AttackState {
  completed: AttackActionId[]
  device: DeviceState
}

/** キャプチャの 1 行（Wireshark のパケット一覧と同じ列） */
export interface CaptureRow {
  no: number
  source: string
  destination: string
  protocol: string
  /** Info 欄。tshark の出力そのまま（空白の数も含めて手を加えない） */
  info: string
  /** 詳細ペインで見える値（Present Value など）。一覧の Info 欄には出ない */
  value?: string
}

/** 実験で取得した Wireshark キャプチャによる答え合わせ素材 */
export interface CaptureEvidence {
  id: string
  title: string
  caption: string
  /** 一覧を絞った Wireshark の表示フィルタ */
  filter: string
  /** どこで・何を使って取った／出したか */
  provenance: string
  rows: CaptureRow[]
  /** 同じ範囲を Wireshark で表示したスクリーンショット（任意） */
  imageSrc?: string
  alt: string
}
