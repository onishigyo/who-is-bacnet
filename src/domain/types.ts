/**
 * ドメイン型のみを置く層。ロジックも描画もここには書かない。
 */

/** ステップの並び順（1 → 7）。学習順序そのもの。1〜4 が IP 編、5〜7 が SC 編 */
export type StepOrder = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StepId =
  | 'what-is-bacnet'
  | 'bacnet-ip'
  | 'interoperability'
  | 'no-auth'
  | 'bacnet-sc'
  | 'sc-defense'
  | 'sc-limits'

/** ステップが属する「世界」。IP 編と SC 編で図もコンテンツも別セット */
export type World = 'ip' | 'sc'

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
  /** この章の見出し（ナビでグループを分ける）。'IP 編' / 'SC 編' */
  chapter: string
  world: World
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
  /** BACnet/SC ハブ（証明書を持つ機器だけが繋がる集線点） */
  | 'hub'
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
  /** SC 編で、この機器が証明書を持つか（持たない攻撃者はハブに入れない） */
  hasCertificate?: boolean
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
  /** frame と一緒に答え合わせで光らせる行（前後の TCP の ACK など、チップにしない行） */
  relatedFrames?: number[]
  /** どこへ届くか。BACnet の要求自体に相手の識別子は入らず、宛先は IP が決める */
  transport: string
  /**
   * TLS で暗号化されて中身が見えない通信か（SC 編）。
   * true のとき、傍受しても Wireshark には Application Data としか映らない。
   */
  encrypted?: boolean
  /**
   * ハブに拒否された応答か（SC 編）。証明書がないノードの門前払いを表す。
   * この印が付いたメッセージで会話が止まる。
   */
  rejected?: boolean
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
  /** messages の frame が指す答え合わせキャプチャの id */
  captureId?: string
}

export type PlaybackPhase = 'flying' | 'landed'

/**
 * 会話再生の状態。トラックのどのまとまりを、いま図で再生しているか。
 * 順送りではなく、利用者が選んだまとまりを 1 回ずつ再生するモデル。
 */
export interface PlaybackState {
  /** いま選んでいるまとまりの index。未選択なら null */
  selected: number | null
  /** そのまとまりが図を飛んでいる最中か、着いたか */
  phase: PlaybackPhase
  /** 再生ごとに増える。同じまとまりを選び直してもアニメをやり直すため */
  nonce: number
}

export interface DeviceState {
  /** 設定温度（analog-value,0 present-value 相当） */
  setpoint: number
  /** 書き換えられたか */
  compromised: boolean
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
  /** 接続の生存時間を強調表示したいときの見出し（例: "接続時間 24.0 秒"） */
  durationLabel?: string
  /** durationLabel の調子（正常なら neutral、異常の強調なら alert） */
  durationTone?: 'neutral' | 'alert'
}
