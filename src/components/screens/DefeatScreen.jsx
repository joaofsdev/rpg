import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'

export default function DefeatScreen() {
  const { state, dispatch } = useGame()
  const { batalha, character, areaAtual } = state
  const area = areas.find(a => a.id === areaAtual)
  const isDungeon = batalha?.isDungeon

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-3 md:p-4">
      <h2 className="text-2xl md:text-4xl font-bold text-red-accent mb-3 md:mb-4">DERROTA...</h2>
      <div className="bg-dark-700 p-4 md:p-6 rounded-xl max-w-sm w-full mb-4 md:mb-6 text-sm md:text-base">
        {isDungeon && <p className="text-gray-300 mb-2">Dungeon falhou!</p>}
        {!isDungeon && <p className="text-gray-300 mb-2">Área: {area?.name}</p>}
        <p className="text-gray-300 mb-2">Nível: {character.nivel}</p>
        <p className="text-gray-300 mb-2">Derrotado por: {batalha?.enemy?.name}</p>
        <p className="text-gray-300">Batalhas vencidas: {character.batalhasVencidas}</p>
      </div>
      <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
        {isDungeon ? (
          <>
            <button onClick={() => dispatch({ type: 'RETRY_DUNGEON' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold text-sm md:text-base">Tentar Novamente</button>
            <button onClick={() => dispatch({ type: 'DUNGEON_DEFEAT' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 text-sm md:text-base">Voltar às Dungeons</button>
          </>
        ) : (
          <>
            <button onClick={() => dispatch({ type: 'RETRY_AREA' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold text-sm md:text-base">Tentar Novamente</button>
            <button onClick={() => dispatch({ type: 'CONTINUE_AFTER_DEFEAT' })} className="px-4 md:px-6 py-2.5 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 text-sm md:text-base">Voltar às Áreas</button>
          </>
        )}
      </div>
      <p className="text-gray-500 text-[10px] md:text-xs mt-3 md:mt-4">Seu progresso foi mantido (nível, XP e itens).</p>
    </div>
  )
}
