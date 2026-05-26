import { useEffect, useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'
import StatBar from '../ui/StatBar'

export default function BattleScreen() {
  const { state, dispatch } = useGame()
  const { batalha, runAtiva, personagens } = state
  const { enemy, playerAttacks, log, turn, battleNumber, animating } = batalha
  const charId = runAtiva.personagemId
  const charData = characters.find(c => c.id === charId)
  const progresso = personagens[charId]
  const logRef = useRef(null)

  // Enemy turn
  useEffect(() => {
    if (turn === 'enemy') {
      const timer = setTimeout(() => {
        dispatch({ type: 'ENEMY_ATTACK' })
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [turn, dispatch])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const hpPct = runAtiva.hpAtual / progresso.atributos.vida
  const hpColor = hpPct > 0.5 ? 'bg-green-accent' : hpPct > 0.25 ? 'bg-yellow-400' : 'bg-red-accent'

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Header */}
      <div className="px-4 py-2 bg-dark-800 flex justify-between items-center text-sm">
        <span className="text-gray-400">Batalha #{battleNumber}</span>
        <span className="text-gray-400">Inimigo Nível {enemy.nivel}</span>
      </div>

      {/* Enemy area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className={`text-center transition-transform ${turn === 'player' && log.length > 0 ? 'animate-[shake_0.3s]' : ''}`}>
          <span className="text-7xl block">{enemy.emoji}</span>
          <h3 className="text-lg font-bold mt-2">{enemy.name}</h3>
          <div className="w-52 mt-2">
            <StatBar label="HP" current={enemy.hpAtual} max={enemy.stats.vida} color="bg-red-accent" />
          </div>
        </div>
      </div>

      {/* Player area */}
      <div className="px-4 pb-2">
        <div className={`flex items-center gap-3 mb-2 ${turn === 'enemy' && log.length > 0 ? 'animate-[shake_0.3s]' : ''}`}>
          <span className="text-4xl">{charData.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold">{charData.name}</span>
              <span className="text-gray-400">Nv.{progresso.nivel}</span>
            </div>
            <StatBar label="HP" current={runAtiva.hpAtual} max={progresso.atributos.vida} color={hpColor} />
            <div className="mt-1">
              <StatBar label="XP" current={progresso.xp} max={progresso.xpProximoNivel} color="bg-purple-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div ref={logRef} className="mx-4 h-24 bg-dark-800 rounded-lg p-3 overflow-y-auto text-xs text-gray-300 mb-3">
        {log.slice(-5).map((msg, i) => <p key={i} className="mb-1">{msg}</p>)}
        {log.length === 0 && <p className="text-gray-500 italic">A batalha começou!</p>}
      </div>

      {/* Turn indicator */}
      <div className="px-4 mb-2">
        <p className={`text-center text-xs font-bold ${turn === 'player' ? 'text-green-accent' : 'text-red-accent'}`}>
          {turn === 'player' ? '⚡ Seu turno' : '⏳ Turno do inimigo...'}
        </p>
      </div>

      {/* Attack buttons */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {playerAttacks.map((atk, i) => (
          <button
            key={i}
            disabled={turn !== 'player' || atk.currentPP <= 0 || animating}
            onClick={() => dispatch({ type: 'PLAYER_ATTACK', payload: { attackIndex: i } })}
            className="py-3 px-3 bg-dark-700 border border-dark-600 hover:border-gold rounded-lg text-left disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className="text-sm font-medium text-white block">{atk.name}</span>
            <span className={`text-xs ${atk.currentPP <= 0 ? 'text-red-accent' : 'text-gray-400'}`}>PP: {atk.currentPP}/{atk.maxPP}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
