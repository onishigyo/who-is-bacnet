import type { AttackAction, Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

export const NORMAL_CONVERSATION_ID = 'normal-operation'

/**
 * ステップ3（正常運用）とステップ4（攻撃）の会話は、意図的に同じ形をしている。
 * 変わるのは from（話し手）だけ。この対比が「無認証」の本質そのもの。
 *
 * explain は「いま何が起きているか」の解説。利用者が 1 通ずつ送りながら読む。
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
        explain:
          '中央監視が、ネットワーク全体に向けて一斉に呼びかけます。相手の IP を 1 台ずつ指定する必要はありません。',
      },
      {
        id: 'n2',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'I-Am device,3056930',
        explain:
          '呼びかけを受け取った機器が、自分の ID を名乗って返事をします。まず空調コントローラから。',
      },
      {
        id: 'n3',
        from: 'lighting',
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'こちらは照明コントローラ、ID 100201 です',
        protocol: 'I-Am device,100201',
        explain:
          '続いて照明コントローラ。メーカーが違っても、同じ呼びかけに同じ形で答えます。これが共通語であることの意味です。',
        annotation: 'メーカーが違っても、同じ呼びかけに同じ形で答える',
      },
      {
        id: 'n4',
        from: 'meter',
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'こちらは電力計、ID 100305 です',
        protocol: 'I-Am device,100305',
        explain:
          '電力計も返事をします。呼びかけ 1 回で、ネットワーク上にどんな機器がいるかの一覧ができあがりました。',
      },
      {
        id: 'n5',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol: 'ReadProperty analog-input,0 present-value',
        explain:
          '相手が分かったので、今度は名指しで頼みます。analog-input,0 は温度センサの入力、present-value はそのいまの値です。',
      },
      {
        id: 'n6',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol: 'ComplexACK → 22.0',
        explain:
          '機器が値を返します。読み取りの応答は、値を含んだ ComplexACK という形で返ってきます。',
      },
      {
        id: 'n7',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 24.0 ℃にして',
        protocol: 'WriteProperty analog-value,0 present-value 24.0',
        explain:
          '今度は書き込みです。analog-value,0 は設定値を持つオブジェクトで、そこに 24.0 を書きます。',
      },
      {
        id: 'n8',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'SimpleACK',
        explain:
          '書き込みが成功すると SimpleACK が返ります。これだけで、中央監視から設備の設定を変えられました。',
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
        explain:
          'ステップ3で中央監視が送ったものと、まったく同じ呼びかけです。違うのは、送り出した機械だけ。',
        annotation: '中央監視が送ったものと、1 ビットも変わらない要求',
      },
      {
        id: 'a2',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'I-Am device,3056930',
        explain:
          '機器は「誰が尋ねたのか」を確かめる手順を持っていません。中央監視に返したのと同じ返事を、そのまま返します。',
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
        explain: '照明コントローラも同じように名乗ります。',
      },
      {
        id: 'a4',
        from: 'meter',
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは電力計、ID 100305 です',
        protocol: 'I-Am device,100305',
        explain:
          '電力計も。呼びかけ 1 回で、どの IP にどんな機器がいるかが揃いました。次はこの中から狙いを決めるだけです。',
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
        explain:
          '見つけた空調コントローラを名指しして、値を尋ねます。ステップ3で中央監視がやったことと同じ手順です。',
      },
      {
        id: 'a6',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol: 'ComplexACK → 22.0',
        explain:
          '値がそのまま返ってきます。ここまでは「見ているだけ」ですが、建物がいまどういう状態かは筒抜けです。',
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
        explain:
          'ここからが書き込みです。読むのと同じ気軽さで、設定値のオブジェクトに 99.0 を書きにいきます。',
      },
      {
        id: 'a8',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'SimpleACK',
        explain:
          '機器は受け入れました。中央監視からの指示と区別する材料がないので、断る理由がありません。',
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
