import { useState } from 'react'
import { useGame, getUsers } from '../../context/GameContext'
import { classes } from '../../data/classes'

export default function ClassSelectScreen() {
  const { state, dispatch } = useGame()
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const users = getUsers()
  const user = users[state.currentUser]
  const classesSorteadas = user?.classesSorteadas || classes.slice(0, 3).map(c => c.id)
  const opcoes = classesSorteadas.map(id => classes.find(c => c.id === id))

  function confirmar() {
    dispatch({ type: 'SELECT_CLASS', payload: { classeId: selected } })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-3 md:p-4 overflow-y-auto relative noise-bg">
      <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-6">
          <h2 className="font-title text-2xl md:text-4xl font-bold text-accent-gold mb-1">Escolha seu Destino</h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-3" />
          <p className="text-text-secondary text-sm italic">3 classes foram sorteadas para você. Esta escolha é permanente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {opcoes.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`card p-5 cursor-pointer transition-all duration-200 ${selected === c.id ? 'border-accent-gold shadow-[0_0_24px_#f0a50040] scale-[1.02]' : 'hover:border-accent-gold/60'}`}
            >
              <div className="text-4xl md:text-5xl text-center mb-3 animate-float">{c.emoji}</div>
              <h3 className="font-title text-xl font-bold text-text-primary text-center">{c.name}</h3>
              <p className="text-text-secondary text-sm text-center mb-4 italic">{c.description}</p>
              <div className="space-y-2 text-sm">
                <StatRow label="Vida" value={c.baseStats.vida} max={160} />
                <StatRow label="Força" value={c.baseStats.forca} max={30} />
                <StatRow label="Defesa" value={c.baseStats.defesa} max={20} />
                <StatRow label="Velocidade" value={c.baseStats.velocidade} max={26} />
              </div>
              <div className="mt-4 border-t border-border-subtle pt-3">
                <p className="text-xs text-rare-purple italic">{c.passivo.descricao}</p>
                <div className="mt-2 space-y-1">
                  {c.attacks.map(a => <p key={a.name} className="text-xs text-text-muted">• {a.name} <span className="font-mono text-text-secondary">F:{a.power} PP:{a.maxPP}</span></p>)}
                </div>
              </div>
              {selected === c.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                  className="btn-gold-solid w-full py-2.5 text-sm mt-4"
                >
                  Escolher {c.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="card p-6 mx-4 animate-slide-up">
            <p className="text-text-primary font-title mb-4">Tem certeza? Esta escolha é permanente.</p>
            <div className="flex gap-3">
              <button onClick={confirmar} className="btn-gold-solid px-6 py-2.5 text-sm">Confirmar</button>
              <button onClick={() => setConfirming(false)} className="btn-secondary px-6 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, max }) {
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-secondary w-20 text-xs font-title">{label}</span>
      <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-gold to-accent-amber transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-text-primary text-xs w-8 text-right">{value}</span>
    </div>
  )
}
