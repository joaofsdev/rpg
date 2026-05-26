import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'

export default function DefeatScreen() {
  const { state, dispatch } = useGame()
  const { runAtiva, batalha, personagens, sessaoStats } = state
  const charId = runAtiva.personagemId
  const charData = characters.find(c => c.id === charId)
  const progresso = personagens[charId]

  return (
    <div className="h-full flex flex-col items-center justify-center bg-dark-900 p-4">
      <h2 className="text-4xl font-bold text-red-accent mb-6" style={{ fontFamily: 'Georgia, serif' }}>💀 DERROTA...</h2>
      <div className="bg-dark-700 rounded-xl p-6 mb-8 w-full max-w-sm">
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">🧑 Personagem: {charData.emoji} {charData.name}</p>
          <p className="text-gray-300">📊 Nível atingido: {progresso.nivel}</p>
          <p className="text-gray-300">⚔️ Batalhas vencidas: {runAtiva.batalhasVencidas}</p>
          <p className="text-gray-300">☠️ Derrotado por: {batalha.defeatedBy}</p>
          <p className="text-gray-300">📈 XP total acumulado: {progresso.xp}</p>
        </div>
      </div>
      <button
        onClick={() => dispatch({ type: 'GAME_OVER' })}
        className="py-3 px-8 bg-red-accent/80 text-white font-bold rounded-lg hover:bg-red-accent transition-colors cursor-pointer"
      >
        Continuar
      </button>
    </div>
  )
}
