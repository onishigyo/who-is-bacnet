import type { Conversation } from '../domain/types'
import { BROADCAST } from '../domain/types'
import { AHU_ID, ATTACKER_ID, SUPERVISOR_ID } from './diagram'

export const NORMAL_CONVERSATION_ID = 'normal-operation'
export const ATTACK_CONVERSATION_ID = 'attack'

/**
 * ステップ3（正常運用）とステップ4（攻撃）の会話は、意図的に同じ形をしている。
 * 変わるのは from（話し手）だけ。この対比が「無認証」の本質そのもの。
 *
 * 流れは「探す → 室温を読む → 今の設定温度を読む → 書き換える → 確かめる」。
 * 実験（tshark）で取った通信と同じ順序で、attack-* 側のメッセージは
 * frame 番号でキャプチャの行と結びつく（logic/capture.test.ts で照合）。
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
          '中央監視が、ネットワーク全体に向けて一斉に呼びかけます。この 1 通だけは宛先を決め打ちせず、サブネット全体に飛ばします。どの IP に誰がいるかを、まだ知らないからです。',
      },
      {
        id: 'n2',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056526 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056526',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.130）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain:
          '呼びかけを受け取った機器が、いっせいに名乗り返します。1 回の呼びかけで、3 台ぶんの返事がまとめて返ってくる ── これが Who-Is の正体です。なお I-Am の中身に IP は入っていません。「192.168.222.130 に device,3056526 がいる」と分かるのは、返事が届いたパケットの送信元アドレスからです。',
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
        protocol: 'Unconfirmed-REQ i-Am device,100305',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.132）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain:
          '電力計も返事をします。呼びかけ 1 回で「どの IP に、どの ID の機器がいるか」の対応表ができあがりました。',
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
        explain:
          '書き換える前に、今の設定温度を読んでおきます。設定値を持つオブジェクト（analog-value,0）の present-value です。',
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
        explain: '今の設定は 24.0 ℃。これを別の値に変えてみます。',
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
          '今度は書き込みです。さっき読んだ設定温度（analog-value,0）に、26.0 を書きます。読むときと同じく、届け先は宛先 IP で決まります。',
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
          '書き込みが成功すると SimpleACK が返ります。これだけで、中央監視から設備の設定を変えられました。',
      },
    ],
  },
  {
    id: ATTACK_CONVERSATION_ID,
    title: '持ち込まれた PC から、機器を操作する',
    messages: [
      {
        id: 'a1',
        from: ATTACKER_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        transport: 'UDP ブロードキャスト → 192.168.222.255:47808',
        action: '全員に呼びかける',
        explain:
          'ステップ3で中央監視が送ったものと、まったく同じ呼びかけです。違うのは、送り出した機械だけ。',
        annotation: '中央監視が送ったものと、1 ビットも変わらない要求',
      },
      {
        id: 'a2',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: 'はい、空調コントローラです。ID は 3056526 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056526',
        transport: 'UDP → 192.168.222.128:47808（送信元 192.168.222.130）',
        action: '名乗る',
        groupId: 'attack-i-am',
        explain:
          '機器は「誰が尋ねたのか」を確かめる手順を持っていません。中央監視に返すのとまったく同じ返事が、4 台ぶんまとめて持ち込まれた PC に届きます。呼びかけ 1 回で、監視している側の居場所まで含めた一覧が手に入りました。',
        annotation: '誰が尋ねたのかを確かめる手順がない',
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
        explain: '照明コントローラも同じように名乗ります。',
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
        explain:
          '中央監視装置も BACnet 機器なので、同じように名乗ります。呼びかけ 1 回で「どの IP に、どの ID の機器がいるか」の対応表ができあがりました。監視している側がどこにいるかまで、そこに載っています。',
        annotation: '呼びかけ 1 回で、中央監視まで含めた機器一覧が手に入る',
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
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '設定温度を聞く',
        explain:
          '書き換える前に、今の設定温度を読みます。ステップ3で中央監視がやったのと同じ手順。設定値（analog-value,0）も、正しく尋ねれば読めてしまいます。',
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
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '設定温度を返す',
        explain:
          '今の設定は 24.0 ℃。これも、正しく尋ねれば持ち込まれた PC にそのまま返ってきます。',
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
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '書き換えを頼む',
        explain:
          'ここからが書き込みです。読むのと同じ気軽さで、さっき 24.0 と読んだ設定温度に、今度は 99.0 を書きにいきます。',
      },
      {
        id: 'a11',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty[  1]',
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '受け入れる',
        explain:
          '機器は受け入れました。送ってきたのが 192.168.222.10（中央監視）だろうと 192.168.222.128（持ち込まれた PC）だろうと、中央監視からの指示と区別する材料がないので、断る理由がありません。',
        annotation:
          '認証の確認なし。中央監視からの指示とまったく同じ扱いで受け入れられた',
        annotationTone: 'alert',
      },
    ],
  },
]
