import { useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { areas } from '../../data/areas'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function BattleScreen() {
  const { state, dispatch } = useGame()
  const { batalha, character, areaAtual } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const stats = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)
  const area = areas.find(a => a.id === areaAtual)
  const enemy = batalha.enemy

  useEffect(() => {
    if (batalha.turn === 'enemy' && batalha.animating) {
      const t = setTimeout(() => dispatch({ type: 'ENEMY_ATTACK' }), 1000)
      return () => clearTimeout(t)
    }
  }, [batalha.turn, batalha.animating])

  const hpPct = (character.hpAtual / stats.vida) * 100
  const enemyHpPct = (enemy.hpAtual / enemy.stats.vida) * 100
  const isBoss = enemy.isBoss

  return (
    <div className={`flex flex-col h-full p-3 md:p-4 max-w-2xl mx-auto ${isBoss ? 'bg-dark-900 border-4 border-red-accent/50' : 'bg-dark-900'}`}>
      <div className="text-center mb-2">
        <span className="text-gray-400 text-xs md:text-sm">{area?.emoji} {area?.name} · Batalha #{state.batalhaNumero}</span>
        {isBoss && <span className="ml-2 text-red-accent font-bold text-xs md:text-sm animate-pulse">💀 BOSS</span>}
      </div>

      <div className="bg-dark-700 rounded-xl p-3 md:p-4 mb-2 md:mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-bold text-sm md:text-base">{enemy.emoji} {enemy.name} <span className="text-gray-400 text-xs md:text-sm">Nv.{enemy.nivel}</span></span>
          <span className="text-gray-400 text-xs md:text-sm">{enemy.hpAtual}/{enemy.stats.vida}</span>
        </div>
        <div className="h-2.5 md:h-3 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-accent rounded-full transition-all duration-300" style={{ width: `${enemyHpPct}%` }} />
        </div>
      </div>

      <div className="bg-dark-700 rounded-xl p-3 md:p-4 mb-2 md:mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-bold text-sm md:text-base">{classeData.emoji} {classeData.name} <span className="text-gray-400 text-xs md:text-sm">Nv.{character.nivel}</span></span>
          <span className="text-gray-400 text-xs md:text-sm">{character.hpAtual}/{stats.vida}</span>
        </div>
        <div className="h-2.5 md:h-3 bg-dark-800 rounded-full overflow-hidden mb-1.5 md:mb-2">
          <div className="h-full bg-green-accent rounded-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="h-1.5 md:h-2 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-accent rounded-full" style={{ width: `${(character.xp / character.xpProximoNivel) * 100}%` }} />
        </div>
        <p className="text-[10px] md:text-xs text-gray-500 mt-1">XP: {character.xp}/{character.xpProximoNivel}</p>
        {batalha.buffs?.length > 0 && (
          <div className="flex gap-1 md:gap-2 mt-1.5 md:mt-2 flex-wrap">
            {batalha.buffs.map((b, i) => <span key={i} className="text-[10px] md:text-xs bg-purple-accent/20 text-purple-accent px-1.5 md:px-2 py-0.5 rounded">+{b.valor} {b.stat} ({b.turnos}t)</span>)}
          </div>
        )}
      </div>

      <div className="flex-1 bg-dark-800 rounded-xl p-2 md:p-3 mb-2 md:mb-3 overflow-y-auto max-h-28 md:max-h-40">
        {batalha.log.slice(-6).map((msg, i) => <p key={i} className="text-xs md:text-sm text-gray-300 mb-0.5 md:mb-1">{msg}</p>)}
      </div>

      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
        {batalha.playerAttacks.map((atk, i) => (
          <button key={i} disabled={batalha.turn !== 'player' || atk.currentPP <= 0}
            onClick={() => dispatch({ type: 'PLAYER_ATTACK', payload: { attackIndex: i } })}
            className={`p-2 md:p-3 rounded-lg text-xs md:text-sm font-bold transition-all ${atk.currentPP <= 0 ? 'bg-dark-800 text-gray-600 cursor-not-allowed' : batalha.turn !== 'player' ? 'bg-dark-700 text-gray-500' : 'bg-dark-600 hover:bg-dark-700 text-white hover:scale-105'}`}>
            {atk.name}
            <span className="block text-[10px] md:text-xs text-gray-400">F:{atk.power} · PP: {atk.currentPP}/{atk.maxPP}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
