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
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-3 md:p-4 overflow-y-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-gold mb-2">Escolha sua Classe</h2>
      <p className="text-gray-400 mb-4 md:mb-6 text-xs md:text-sm">3 classes foram sorteadas para você. Esta escolha é permanente.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl w-full">
        {opcoes.map(c => (
          <div key={c.id} onClick={() => setSelected(c.id)} className={`bg-dark-700 p-5 rounded-xl cursor-pointer transition-all border-2 ${selected === c.id ? 'border-gold scale-105' : 'border-dark-600 hover:border-gray-500'}`}>
            <div className="text-4xl text-center mb-2">{c.emoji}</div>
            <h3 className="text-xl font-bold text-white text-center">{c.name}</h3>
            <p className="text-gray-400 text-sm text-center mb-3">{c.description}</p>
            <div className="space-y-1 text-sm">
              <StatRow label="Vida" value={c.baseStats.vida} max={160} color="bg-green-accent" />
              <StatRow label="Força" value={c.baseStats.forca} max={30} color="bg-red-accent" />
              <StatRow label="Defesa" value={c.baseStats.defesa} max={20} color="bg-blue-accent" />
              <StatRow label="Velocidade" value={c.baseStats.velocidade} max={26} color="bg-gold" />
            </div>
            <div className="mt-3 border-t border-dark-600 pt-2">
              <p className="text-xs text-purple-accent">{c.passivo.descricao}</p>
              <div className="mt-2 space-y-1">
                {c.attacks.map(a => <p key={a.name} className="text-xs text-gray-400">• {a.name} (F:{a.power} PP:{a.maxPP})</p>)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && !confirming && (
        <button onClick={() => setConfirming(true)} className="mt-6 px-8 py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold transition-all">Escolher {opcoes.find(c => c.id === selected)?.name}</button>
      )}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-dark-700 p-6 rounded-xl">
            <p className="text-white mb-4">Tem certeza? Esta escolha é permanente.</p>
            <div className="flex gap-4">
              <button onClick={confirmar} className="px-6 py-2 bg-red-accent rounded-lg text-white font-bold">Confirmar</button>
              <button onClick={() => setConfirming(false)} className="px-6 py-2 bg-dark-600 rounded-lg text-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, max, color }) {
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 w-20 text-xs">{label}</span>
      <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white text-xs w-8 text-right">{value}</span>
    </div>
  )
}
