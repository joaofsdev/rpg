import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'

export default function GameOverScreen() {
  const { state, dispatch } = useGame()
  const charId = state.runAtiva.personagemId
  const charData = characters.find(c => c.id === charId)

  return (
    <div className="h-full flex flex-col items-center justify-center bg-dark-900 p-4">
      <h2 className="text-3xl font-bold text-gray-300 mb-8" style={{ fontFamily: 'Georgia, serif' }}>Game Over</h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => dispatch({ type: 'RESTART_SAME' })}
          className="py-3 px-6 bg-gold/90 text-dark-900 font-bold rounded-lg hover:bg-gold transition-colors cursor-pointer"
        >
          Jogar Novamente com {charData.name}
        </button>
        <button
          onClick={() => dispatch({ type: 'CHANGE_CHARACTER' })}
          className="py-3 px-6 bg-dark-600 hover:bg-dark-700 rounded-lg transition-colors cursor-pointer"
        >
          Trocar de Personagem
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TITLE' })}
          className="py-3 px-6 bg-dark-600 hover:bg-dark-700 rounded-lg transition-colors cursor-pointer"
        >
          Tela Inicial
        </button>
      </div>
    </div>
  )
}
