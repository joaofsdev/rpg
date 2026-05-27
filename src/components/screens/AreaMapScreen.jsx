import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'
import { classes } from '../../data/classes'

export default function AreaMapScreen() {
  const { state, dispatch } = useGame()
  const { character } = state

  function getStatus(area) {
    if (character.areasConcluidas.includes(area.id)) return 'concluida'
    if (character.areasDesbloqueadas.includes(area.id)) return 'disponivel'
    return 'bloqueada'
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 p-3 md:p-6">
      <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gold">Mapa de Áreas</h2>
          <p className="text-gray-400 text-xs md:text-sm">{classes.find(c => c.id === character.classeId)?.emoji} {classes.find(c => c.id === character.classeId)?.name} · Nível {character.nivel}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'DUNGEON_SELECT' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">⚔️ Dungeons</button>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'INVENTORY' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">🎒 Inventário</button>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'PROFILE' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">👤 Perfil</button>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">🚪 Sair</button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 w-full max-w-4xl">
          {areas.map(area => {
            const status = getStatus(area)
            const blocked = status === 'bloqueada'
            return (
              <div key={area.id} className={`p-3 md:p-4 rounded-xl border-2 transition-all ${blocked ? 'border-dark-600 opacity-50' : status === 'concluida' ? 'border-green-accent/50 bg-dark-700' : 'border-gold/50 bg-dark-700 animate-pulse cursor-pointer hover:scale-105'}`}
                onClick={() => !blocked && dispatch({ type: 'ENTER_AREA', payload: { areaId: area.id } })}>
                <div className="text-2xl md:text-3xl text-center mb-1 md:mb-2">{area.emoji}</div>
                <h3 className="text-white font-bold text-center text-xs md:text-sm">{area.name}</h3>
                <p className="text-gray-500 text-[10px] md:text-xs text-center">Nv. {area.nivelMin}–{area.nivelMax}</p>
                <p className="text-center mt-1 text-sm">
                  {blocked ? '🔒' : status === 'concluida' ? '✅' : '⚔️'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
