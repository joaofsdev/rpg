import { useGame } from '../../context/GameContext'
import { dungeons } from '../../data/dungeons'

export default function DungeonSelectScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const desbloqueadas = character.dungeonsDesbloqueadas || [1]

  return (
    <div className="flex flex-col h-full bg-dark-900 p-3 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gold">⚔️ Dungeons</h2>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">← Voltar</button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 w-full max-w-4xl">
          {dungeons.map(d => {
            const disponivel = desbloqueadas.includes(d.id)
            const concluida = (character.dungeonsConcluidas || []).includes(d.id)
            return (
              <div key={d.id} onClick={() => disponivel && dispatch({ type: 'ENTER_DUNGEON', payload: { dungeonId: d.id } })}
                className={`p-3 md:p-4 rounded-xl border-2 transition-all text-center ${!disponivel ? 'border-dark-600 opacity-50' : concluida ? 'border-green-accent/50 bg-dark-700 cursor-pointer hover:scale-105' : 'border-gold/50 bg-dark-700 animate-pulse cursor-pointer hover:scale-105'}`}>
                <div className="text-2xl md:text-3xl mb-1">{d.emoji}</div>
                <h3 className="text-white font-bold text-xs md:text-sm">{d.name}</h3>
                <p className="text-gray-500 text-[10px] md:text-xs">Nv. {d.nivel}</p>
                <p className="text-xs mt-1">{!disponivel ? '🔒' : concluida ? '✅' : '⚔️'}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
