import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function LevelUpScreen() {
  const { state, dispatch } = useGame()
  const { levelUpData, character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const statsAtuais = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)
  const d = levelUpData.pontosDistribuidos

  const ganhos = { vida: '+10 HP', forca: '+2', defesa: '+2', velocidade: '+1' }
  const stats = [
    { key: 'vida', label: 'Vida', icon: '❤️', atual: statsAtuais.vida, bonus: d.vida * 10 },
    { key: 'forca', label: 'Força', icon: '⚔️', atual: statsAtuais.forca, bonus: d.forca * 2 },
    { key: 'defesa', label: 'Defesa', icon: '🛡️', atual: statsAtuais.defesa, bonus: d.defesa * 2 },
    { key: 'velocidade', label: 'Velocidade', icon: '💨', atual: statsAtuais.velocidade, bonus: d.velocidade * 1 },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-3 md:p-4 relative noise-bg">
      {/* Gold flash overlay */}
      <div className="absolute inset-0 bg-accent-gold/20 animate-flash-gold pointer-events-none z-20" />

      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <h2 className="font-title text-3xl md:text-4xl font-bold text-accent-gold mb-2">LEVEL UP!</h2>
        <p className="font-mono text-text-primary text-lg mb-1">Nível {character.nivel}</p>
        <p className="font-title text-sm text-accent-gold-light mb-6">
          Pontos disponíveis: <span className="font-mono text-lg">{levelUpData.pontosDisponiveis}</span>
        </p>

        <div className="card p-5 md:p-6 w-full max-w-md space-y-4">
          {stats.map(s => (
            <div key={s.key} className="flex items-center gap-2 md:gap-3">
              <span className="text-base">{s.icon}</span>
              <span className="font-title text-text-primary text-sm w-20">{s.label}</span>
              <span className="font-mono text-text-primary text-sm w-12">
                {s.atual}
              </span>
              {s.bonus > 0 && <span className="font-mono text-success text-xs">+{s.bonus}</span>}
              <span className="font-mono text-text-muted text-[10px] hidden sm:inline">{ganhos[s.key]}/pt</span>
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={() => dispatch({ type: 'UNDISTRIBUTE_POINT', payload: { stat: s.key } })}
                  disabled={d[s.key] <= 0}
                  className="w-7 h-7 rounded border border-border-subtle bg-bg-elevated text-text-primary text-sm font-bold disabled:opacity-20 transition-all hover:border-accent-gold"
                >
                  −
                </button>
                <span className="font-mono w-6 text-center text-accent-gold text-sm leading-7">{d[s.key]}</span>
                <button
                  onClick={() => dispatch({ type: 'DISTRIBUTE_POINT', payload: { stat: s.key } })}
                  disabled={levelUpData.pontosDisponiveis <= 0}
                  className="w-7 h-7 rounded border border-border-subtle bg-bg-elevated text-text-primary text-sm font-bold disabled:opacity-20 transition-all hover:border-accent-gold"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: 'CONFIRM_LEVEL_UP' })}
          disabled={levelUpData.pontosDisponiveis > 0}
          className={`mt-6 px-8 py-3 rounded-lg font-title font-bold text-sm transition-all ${
            levelUpData.pontosDisponiveis > 0
              ? 'bg-bg-elevated text-text-muted border border-border-subtle cursor-not-allowed'
              : 'btn-gold-solid'
          }`}
        >
          Confirmar
        </button>
      </div>
    </div>
  )
}
