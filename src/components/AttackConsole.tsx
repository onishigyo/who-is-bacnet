import type { AttackAction, AttackActionId, AttackState } from '../domain/types'
import {
  isAttackComplete,
  isCompleted,
  isUnlocked,
  nextActionId,
} from '../logic/attack'

interface Props {
  actions: AttackAction[]
  state: AttackState
  /** 再生中は操作を止める */
  busy: boolean
  onRun: (id: AttackActionId) => void
  onReset: () => void
}

export function AttackConsole({ actions, state, busy, onRun, onReset }: Props) {
  const next = nextActionId(actions, state)
  const done = isAttackComplete(actions, state)

  return (
    <section className="console">
      <h3 className="console__title">持ち込まれた PC のコンソール</h3>
      <p className="console__note">
        上から順に選べます。選ぶと 1 通目が飛び、あとは「次へ」で 1
        通ずつ進みます。特別な道具も、パスワードも要りません。
      </p>

      <ol className="console__list">
        {actions.map((action) => {
          const unlocked = isUnlocked(action, state)
          const completed = isCompleted(state, action.id)
          return (
            <li key={action.id} className="console__item">
              <button
                type="button"
                className={`console__button ${completed ? 'is-done' : ''} ${
                  action.id === next && !busy ? 'is-next' : ''
                }`}
                disabled={!unlocked || completed || busy}
                onClick={() => onRun(action.id)}
              >
                <span className="console__label">{action.label}</span>
                <span className="console__hint">{action.hint}</span>
                {completed && <span className="console__state">実行済み</span>}
                {!unlocked && (
                  <span className="console__state">前の操作が必要</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {done && (
        <div className="console__verdict">
          <p>
            設定温度は {state.device.setpoint.toFixed(1)} ℃になりました。
            機器は「誰が書いたのか」を一度も確かめていません。
          </p>
          <p>
            止められたのは「同じネットワークに入れないこと」だけでした。入られた時点で、
            設備は操作できる状態にあります。
          </p>
        </div>
      )}

      <button
        type="button"
        className="console__reset"
        onClick={onReset}
        disabled={busy}
      >
        最初からやり直す
      </button>
    </section>
  )
}
