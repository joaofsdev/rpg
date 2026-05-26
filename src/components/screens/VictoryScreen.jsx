import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'

export default function VictoryScreen() {
  const { state, dispatch } = useGame()
  const { runAtiva, batalha } = state
  const charData = characters.find(c => c.id === runAtiva.personagemId)

  return (
    <div className="h-full flex flex-col items-center justify-center bg-dark-900 p-4">
      <h2 className="text-5xl font-bold text-gold mb-4" style={{ fontFamily: 'Georgia, serif' }}>🏆 VITÓRIA!</h2>
      <div className="bg-dark-700 rounded-xl p-6 text-center mb-8">
        <p className="text-gray-300 mb-2">+{batalha?.xpGanho || state.levelUpData?.xpGanho || '??'} XP ganho</p>
        <p className="text-gray-400 text-sm">HP restante: {runAtiva.hpAtual}/{state.personagens[runAtiva.personagemId].atributos.vida}</p>
        <p className="text-gray-400 text-sm">Batalhas vencidas: {runAtiva.batalhasVencidas}</p>
      </div>
      <button
        onClick={() => dispatch({ type: 'NEXT_BATTLE' })}
        className="py-3 px-8 bg-gold/90 text-dark-900 font-bold rounded-lg hover:bg-gold transition-colors text-lg cursor-pointer"
      >
        Próxima Batalha →
      </button>
    </div>
  )
}
