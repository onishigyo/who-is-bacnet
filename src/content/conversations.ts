import type { AttackAction, Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

export const NORMAL_CONVERSATION_ID = 'normal-operation'

/**
 * ステップ3（正常運用）とステップ4（攻撃）の会話は、意図的に同じ形をしている。
 * 変わるのは from（話し手）だけ。この対比が「無認証」の本質そのもの。
 */
export const conversations: Conversation[] = [
  {
    id: NORMAL_CONVERSATION_ID,
    title: '中央監視装置と設備機器の、ふだんの会話',
    messages: [
      {
        id: 'n1',
        from: SUPERVISOR_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Who-Is（ブロードキャスト / UDP 47808）',
      },
      {
        id: 'n2',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'I-Am device,3056930',
      },
      {
        id: 'n3',
        from: 'lighting',
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'こちらは照明コントローラ、ID 100201 です',
        protocol: 'I-Am device,100201',
        annotation: 'メーカーが違っても、同じ呼びかけに同じ形で答える',
      },
      {
        id: 'n4',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol: 'ReadProperty analog-input,0 present-value',
      },
      {
        id: 'n5',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol: 'ComplexACK → 22.0',
      },
      {
        id: 'n6',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 24.0 ℃にして',
        protocol: 'WriteProperty analog-value,0 present-value 24.0',
      },
      {
        id: 'n7',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'SimpleACK',
      },
    ],
  },
  {
    id: 'attack-discover',
    title: '持ち込まれた PC から「どなたかいますか？」',
    messages: [
      {
        id: 'a1',
        from: ATTACKER_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Who-Is（ブロードキャスト / UDP 47808）',
        annotation: '中央監視が送ったものと、1 ビットも変わらない要求',
      },
      {
        id: 'a2',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'I-Am device,3056930',
        annotation: '誰が尋ねたのかを確かめる手順がない',
        annotationTone: 'alert',
      },
      {
        id: 'a3',
        from: 'lighting',
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは照明コントローラ、ID 100201 です',
        protocol: 'I-Am device,100201',
      },
      {
        id: 'a4',
        from: 'meter',
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは電力計、ID 100305 です',
        protocol: 'I-Am device,100305',
        annotation: '呼びかけ 1 回で、ネットワーク上の機器一覧が手に入る',
        annotationTone: 'alert',
      },
    ],
  },
  {
    id: 'attack-read',
    title: '持ち込まれた PC から、室温を読む',
    messages: [
      {
        id: 'a5',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol: 'ReadProperty analog-input,0 present-value',
      },
      {
        id: 'a6',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol: 'ComplexACK → 22.0',
        annotation: '中央監視に返したのと同じ値を、そのまま返す',
        annotationTone: 'alert',
      },
    ],
  },
  {
    id: 'attack-write',
    title: '持ち込まれた PC から、設定温度を書き換える',
    messages: [
      {
        id: 'a7',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 99.0 ℃にして',
        protocol: 'WriteProperty analog-value,0 present-value 99.0',
      },
      {
        id: 'a8',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'SimpleACK',
        annotation:
          '認証の確認なし。中央監視からの指示とまったく同じ扱いで受け入れられた',
        annotationTone: 'alert',
      },
    ],
  },
]

/** ステップ4のガイド付き操作。上から順に開いていく */
export const attackActions: AttackAction[] = [
  {
    id: 'discover',
    label: '① 機器を探す（Who-Is）',
    hint: 'ネットワーク全体に呼びかけて、どんな機器がいるかを一覧にする。',
    requires: null,
    conversationId: 'attack-discover',
  },
  {
    id: 'read',
    label: '② 値を読む（ReadProperty）',
    hint: '見つけた空調コントローラに、いまの室温を尋ねる。',
    requires: 'discover',
    conversationId: 'attack-read',
  },
  {
    id: 'write',
    label: '③ 値を書き換える（WriteProperty）',
    hint: '設定温度を 99.0 ℃に書き換える。ここが「読むだけ」との決定的な違い。',
    requires: 'read',
    conversationId: 'attack-write',
  },
]
