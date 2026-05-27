import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'

export default function VictoryScreen() {
  const { state, dispatch } = useGame()
  const { character, areaAtual, batalha, victorySource } = state
  const area = areas.find(a => a.id === areaAtual)
  const isBossDefeated = batalha?.enemy?.isBoss

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-3 md:p-4">
      {isBossDefeated ? (
        <>
          <h2 className="text-2xl md:text-4xl font-bold text-gold mb-3 md:mb-4 animate-pulse">🏆 {victorySource === 'dungeon' ? 'Dungeon Concluída!' : 'Área Concluída!'}</h2>
          <p className="text-gray-300 text-sm md:text-base mb-2">{victorySource === 'dungeon' ? 'Dungeon dominada!' : `${area?.name} foi dominada!`}</p>
          <p className="text-green-accent text-sm md:text-base mb-4 md:mb-6">Boss {batalha.enemy.name} derrotado!</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-bold text-green-accent mb-3 md:mb-4">⚔️ Vitória!</h2>
          <p className="text-gray-300 text-sm md:text-base mb-2">{batalha?.enemy?.name} derrotado!</p>
          {batalha?.xpGanho && <p className="text-blue-accent text-sm md:text-base mb-4 md:mb-6">+{batalha.xpGanho} XP</p>}
        </>
      )}
      <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
        {isBossDefeated && victorySource === 'dungeon' ? (
          <button onClick={() => dispatch({ type: 'NEXT_DUNGEON' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-purple-accent hover:bg-purple-accent/80 rounded-lg text-white font-bold text-sm md:text-base">Próxima Dungeon</button>
        ) : isBossDefeated && victorySource === 'area' ? (
          <button onClick={() => dispatch({ type: 'NEXT_AREA' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-green-accent hover:bg-green-accent/80 rounded-lg text-white font-bold text-sm md:text-base">Próxima Área</button>
        ) : (
          <button onClick={() => dispatch({ type: 'NEXT_BATTLE' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold text-sm md:text-base">Próxima Batalha</button>
        )}
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 text-sm md:text-base">Voltar ao Mapa</button>
      </div>
    </div>
  )
}
