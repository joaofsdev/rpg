import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'

export default function VictoryScreen() {
  const { state, dispatch } = useGame()
  const { areaAtual, batalha, victorySource } = state
  const area = areas.find(a => a.id === areaAtual)
  const isBossDefeated = batalha?.enemy?.isBoss

  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-3 md:p-4 relative noise-bg">
      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        {isBossDefeated ? (
          <>
            <h2 className="font-title text-2xl md:text-4xl font-bold text-accent-gold mb-3 animate-breathe">🏆 {victorySource === 'dungeon' ? 'Dungeon Concluída!' : 'Área Concluída!'}</h2>
            <p className="text-text-secondary text-sm mb-1">{victorySource === 'dungeon' ? 'Dungeon dominada!' : `${area?.name} foi dominada!`}</p>
            <p className="text-success text-sm mb-6">Boss {batalha.enemy.name} derrotado!</p>
          </>
        ) : (
          <>
            <h2 className="font-title text-2xl md:text-3xl font-bold text-success mb-3">⚔️ Vitória!</h2>
            <p className="text-text-secondary text-sm mb-1">{batalha?.enemy?.name} derrotado!</p>
            {batalha?.xpGanho && <p className="text-epic-blue font-mono text-sm mb-6">+{batalha.xpGanho} XP</p>}
          </>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          {isBossDefeated && victorySource === 'dungeon' ? (
            <button onClick={() => dispatch({ type: 'NEXT_DUNGEON' })} className="btn-gold-solid px-6 py-3 text-sm">Próxima Dungeon</button>
          ) : isBossDefeated && victorySource === 'area' ? (
            <button onClick={() => dispatch({ type: 'NEXT_AREA' })} className="btn-gold-solid px-6 py-3 text-sm">Próxima Área</button>
          ) : (
            <button onClick={() => dispatch({ type: 'NEXT_BATTLE' })} className="btn-gold-solid px-6 py-3 text-sm">Próxima Batalha</button>
          )}
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="btn-secondary px-6 py-3 text-sm">Voltar ao Mapa</button>
        </div>
      </div>
    </div>
  )
}
