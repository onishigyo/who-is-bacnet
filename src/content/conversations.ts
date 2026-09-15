import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { ipCapture } from './captures'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

export const NORMAL_CONVERSATION_ID = 'normal-operation'
export const ATTACK_CONVERSATION_ID = 'attack'

/**
 * ステップ3（正常運用）とステップ4（攻撃）の会話は、意図的に同じ形をしている。
 * 変わるのは from（話し手）だけ。この対比が「無認証」の本質そのもの。
 *
 * 流れは「探す → 今の設定温度を読む → 書き換える」。実験（tshark）で
 * 取った通信と同じ順序で、attack-* 側のメッセージは frame 番号で
 * キャプチャの行と結びつく（logic/capture.test.ts で照合）。
 *
 * protocol は Wireshark の Info 欄と同じ表記（空白の数も含めて）で書く。
 * value は詳細ペインで見える present-value。
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
        protocol: 'Unconfirmed-REQ who-Is',
        transport: 'UDP ブロードキャスト → 192.168.222.255:47808',
        action: '全員に呼びかける',
        explain:
          '中央監視が LAN 全体に呼びかけます。誰がどの IP にいるか、まだ知らないからです。',
      },
      {
        id: 'n2',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056489 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056489',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.130）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain:
          '呼びかけを聞いた 3 台が、それぞれ名乗り返します。I-Am の中身に IP は入っておらず、どの機器がどの IP にいるかは、返事の送信元アドレスで分かります。',
      },
      {
        id: 'n3',
        from: 'lighting',
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'こちらは照明コントローラ、ID 100201 です',
        protocol: 'Unconfirmed-REQ i-Am device,100201',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.131）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain: '照明コントローラも名乗ります。',
        annotation: 'メーカーが違っても、同じ呼びかけに同じ形で答える',
      },
      {
        id: 'n4',
        from: 'meter',
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'こちらは電力計、ID 100305 です',
        protocol: 'Unconfirmed-REQ i-Am device,100305',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.132）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain: '電力計も名乗ります。',
      },
      {
        id: 'n7',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの設定温度を教えて',
        protocol:
          'Confirmed-REQ   readProperty[  0] analog-value,0 present-value',
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '設定温度を聞く',
        explain: '書き換える前に、今の設定温度（analog-value,0）を読みます。',
      },
      {
        id: 'n8',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '24.0 ℃です',
        protocol:
          'Complex-ACK     readProperty[  0] analog-value,0 present-value',
        value: 'Present Value (real): 24',
        transport: 'UDP ユニキャスト → 192.168.222.10:47808',
        action: '設定温度を返す',
        explain: '今の設定は 24.0 ℃です。',
      },
      {
        id: 'n9',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 26.0 ℃にして',
        protocol:
          'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
        value: 'Present Value (real): 26',
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '書き換えを頼む',
        explain:
          '設定温度に 26.0 を書き込みます。届け先は、読むときと同じく宛先の IP で決まります。',
      },
      {
        id: 'n10',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty[  1]',
        transport: 'UDP ユニキャスト → 192.168.222.10:47808',
        action: '受け入れる',
        explain:
          '書き込めると SimpleACK が返ります。中央監視から設定を変えられました。',
      },
    ],
  },
  {
    id: ATTACK_CONVERSATION_ID,
    title: '持ち込まれた PC から、機器を操作する',
    captureId: ipCapture.id,
    messages: [
      {
        id: 'a1',
        from: ATTACKER_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        frame: 550,
        transport: 'UDP ブロードキャスト → 192.168.222.255:47808',
        action: '全員に呼びかける',
        explain:
          'ステップ3で中央監視が送ったのと同じ呼びかけです。違うのは送り主だけ。',
        annotation: '中央監視と中身がまったく同じ要求',
      },
      {
        id: 'a2',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056489 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056489',
        frame: 551,
        transport: 'UDP → 192.168.222.128:47808（送信元 192.168.222.130）',
        action: '名乗る',
        groupId: 'attack-i-am',
        explain:
          '機器は、誰が尋ねたかを確かめません。中央監視に返すのと同じ返事が、中央監視自身も含めた 4 台ぶん PC に届きます。',
        annotation: '誰が尋ねたかを確かめる仕組みがない',
        annotationTone: 'alert',
      },
      {
        id: 'a3',
        from: 'lighting',
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは照明コントローラ、ID 100201 です',
        protocol: 'Unconfirmed-REQ i-Am device,100201',
        transport: 'UDP → 192.168.222.128:47808（送信元 192.168.222.131）',
        action: '名乗る',
        groupId: 'attack-i-am',
        explain: '照明コントローラも名乗ります。',
      },
      {
        id: 'a4',
        from: 'meter',
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは電力計、ID 100305 です',
        protocol: 'Unconfirmed-REQ i-Am device,100305',
        transport: 'UDP → 192.168.222.128:47808（送信元 192.168.222.132）',
        action: '名乗る',
        groupId: 'attack-i-am',
        explain: '電力計も名乗ります。',
      },
      {
        id: 'a5',
        from: SUPERVISOR_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'こちらは中央監視装置、ID 260001 です',
        protocol: 'Unconfirmed-REQ i-Am device,260001',
        transport: 'UDP → 192.168.222.128:47808（送信元 192.168.222.10）',
        action: '名乗る',
        groupId: 'attack-i-am',
        explain: '中央監視装置も名乗ります。',
        annotation: '呼びかけ 1 回で、中央監視まで含めた機器の一覧が手に入る',
        annotationTone: 'alert',
      },
      {
        id: 'a8',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの設定温度を教えて',
        protocol:
          'Confirmed-REQ   readProperty[  0] analog-value,0 present-value',
        frame: 997,
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '設定温度を聞く',
        explain: 'ステップ3と同じく、まず今の設定温度を読みます。',
      },
      {
        id: 'a9',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '24.0 ℃です',
        protocol:
          'Complex-ACK     readProperty[  0] analog-value,0 present-value',
        value: 'Present Value (real): 24',
        frame: 998,
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '設定温度を返す',
        explain: '設定温度が、そのまま PC に返ってきます。',
        annotation: '設定温度も、そのまま読めてしまう',
        annotationTone: 'alert',
      },
      {
        id: 'a10',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 99.0 ℃にして',
        protocol:
          'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
        value: 'Present Value (real): 99',
        frame: 1509,
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '書き換えを頼む',
        explain: 'さっき読んだ設定温度に、今度は 99.0 を書き込みます。',
      },
      {
        id: 'a11',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty[  1]',
        frame: 1510,
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '受け入れる',
        explain:
          '機器は受け入れました。送り主が本物の中央監視かを確かめる仕組みがないので、断る理由がありません。',
        annotation: '認証なし。中央監視の指示と同じように受け入れられた',
        annotationTone: 'alert',
      },
    ],
  },
]
