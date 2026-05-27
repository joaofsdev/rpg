import { useGame } from '../../context/GameContext'

export default function GameOverScreen() {
  const { state, dispatch } = useGame()
  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-4">
      <h2 className="text-4xl font-bold text-red-accent mb-6">GAME OVER</h2>
      <div className="flex flex-col gap-4">
        <button onClick={() => dispatch({ type: 'CONTINUE_AFTER_DEFEAT' })} className="px-8 py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold">Continuar desta área</button>
        <button onClick={() => dispatch({ type: 'GO_TITLE' })} className="px-8 py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300">Tela Inicial</button>
      </div>
    </div>
  )
}
