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
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056930',
        transport: 'UDP → 192.168.222.10:47808（送信元 192.168.222.130）',
        action: '名乗る',
        groupId: 'normal-i-am',
        explain:
          '呼びかけを受け取った機器が、いっせいに名乗り返します。1 回の呼びかけで、3 台ぶんの返事がまとめて返ってくる ── これが Who-Is の正体です。なお I-Am の中身に IP は入っていません。「192.168.222.130 に device,3056930 がいる」と分かるのは、返事が届いたパケットの送信元アドレスからです。',
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
        id: 'n5',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol:
          'Confirmed-REQ   readProperty[  0] analog-input,0 present-value',
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '室温を聞く',
        explain:
          'ここからは名指しです。といっても要求の中身は「analog-input,0 の present-value を読ませて」だけで、相手が誰かは書かれていません。宛先 IP（192.168.222.130:47808）に直接送ることで、相手を決めています。',
      },
      {
        id: 'n6',
        from: AHU_ID,
        to: SUPERVISOR_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol:
          'Complex-ACK     readProperty[  0] analog-input,0 present-value',
        value: 'Present Value (real): 22',
        transport: 'UDP ユニキャスト → 192.168.222.10:47808',
        action: '室温を返す',
        explain:
          '機器が値を返します。読み取りの応答は、値を含んだ ComplexACK という形で、頼んできた IP へ返ります。',
      },
      {
        id: 'n7',
        from: SUPERVISOR_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 24.0 ℃にして',
        protocol:
          'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
        value: 'Present Value (real): 24',
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '書き換えを頼む',
        explain:
          '今度は書き込みです。analog-value,0 は設定値を持つオブジェクトで、そこに 24.0 を書きます。読むときと同じく、届け先は宛先 IP で決まります。',
      },
      {
        id: 'n8',
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
    id: 'attack-discover',
    title: '持ち込まれた PC から「どなたかいますか？」',
    messages: [
      {
        id: 'a1',
        from: ATTACKER_ID,
        to: BROADCAST,
        kind: 'request',
        plain: 'どなたかいますか？',
        protocol: 'Unconfirmed-REQ who-Is',
        frame: 1052,
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
        plain: 'はい、空調コントローラです。ID は 3056930 です',
        protocol: 'Unconfirmed-REQ i-Am device,3056930',
        frame: 1053,
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
    ],
  },
  {
    id: 'attack-read',
    title: '持ち込まれた PC から、室温を読む',
    messages: [
      {
        id: 'a6',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの室温を教えて',
        protocol:
          'Confirmed-REQ   readProperty[  0] analog-input,0 present-value',
        frame: 2306,
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '室温を聞く',
        explain:
          '返事から分かった IP へ、直接送ります。中身はステップ3で中央監視が送ったものと同じ。宛先 IP に届けば、それで相手は決まります。',
      },
      {
        id: 'a7',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '22.0 ℃です',
        protocol:
          'Complex-ACK     readProperty[  0] analog-input,0 present-value',
        value: 'Present Value (real): 22',
        frame: 2307,
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '室温を返す',
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
        id: 'a8',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: '設定温度を 99.0 ℃にして',
        protocol:
          'Confirmed-REQ   writeProperty[  1] analog-value,0 present-value',
        value: 'Present Value (real): 99',
        frame: 2727,
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '書き換えを頼む',
        explain:
          'ここからが書き込みです。読むのと同じ気軽さで、同じ宛先 IP に、今度は 99.0 を書きにいきます。',
      },
      {
        id: 'a9',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '了解しました',
        protocol: 'Simple-ACK      writeProperty[  1]',
        frame: 2728,
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
  {
    id: 'attack-verify',
    title: '持ち込まれた PC から、書き換わったか確かめる',
    messages: [
      {
        id: 'a10',
        from: ATTACKER_ID,
        to: AHU_ID,
        kind: 'request',
        plain: 'いまの設定温度を教えて',
        protocol:
          'Confirmed-REQ   readProperty[  2] analog-value,0 present-value',
        frame: 3089,
        transport: 'UDP ユニキャスト → 192.168.222.130:47808',
        action: '設定温度を読む',
        explain:
          'SimpleACK は「受け付けました」と言っているだけで、本当に値が変わったかまでは教えてくれません。そこで、書き換えた設定温度（analog-value,0）をもう一度読みにいきます。',
      },
      {
        id: 'a11',
        from: AHU_ID,
        to: ATTACKER_ID,
        kind: 'response',
        plain: '99.0 ℃です',
        protocol:
          'Complex-ACK     readProperty[  2] analog-value,0 present-value',
        value: 'Present Value (real): 99',
        frame: 3090,
        transport: 'UDP ユニキャスト → 192.168.222.128:47808',
        action: '設定温度を返す',
        explain:
          '99.0 ℃が返ってきました。書き換えは本当に効いています。しかも攻撃者は、それを中央監視を通さずに、自分の手元で確かめられます。',
        annotation:
          '書き換えは成功している。持ち込まれた PC から、それを確かめることもできる',
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
  {
    id: 'verify',
    label: '④ 書き換わったか確かめる（ReadProperty）',
    hint: '書き換えた設定温度を読み直して、本当に 99.0 ℃になったかを見る。',
    requires: 'write',
    conversationId: 'attack-verify',
  },
]
