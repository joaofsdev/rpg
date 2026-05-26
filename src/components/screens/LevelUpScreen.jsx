import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'
import AttributeControl from '../ui/AttributeControl'

export default function LevelUpScreen() {
  const { state, dispatch } = useGame()
  const { levelUpData, runAtiva, personagens } = state
  const charId = runAtiva.personagemId
  const progresso = personagens[charId]
  const charData = characters.find(c => c.id === charId)
  const { nivelAnterior, nivelNovo, pontosDisponiveis, pontosDistribuidos } = levelUpData

  const preview = {
    vida: progresso.atributos.vida + pontosDistribuidos.vida * 8,
    forca: progresso.atributos.forca + pontosDistribuidos.forca * 2,
    defesa: progresso.atributos.defesa + pontosDistribuidos.defesa * 2,
    velocidade: progresso.atributos.velocidade + pontosDistribuidos.velocidade * 1,
  }

  const stats = [
    { key: 'vida', label: '❤️ Vida', gain: '+8/pt' },
    { key: 'forca', label: '⚔️ Força', gain: '+2/pt' },
    { key: 'defesa', label: '🛡️ Defesa', gain: '+2/pt' },
    { key: 'velocidade', label: '💨 Velocidade', gain: '+1/pt' },
  ]

  return (
    <div className="h-full flex flex-col items-center justify-center bg-dark-900 p-4">
      <h2 className="text-4xl font-bold text-gold mb-1" style={{ fontFamily: 'Georgia, serif' }}>⬆️ LEVEL UP!</h2>
      <p className="text-gray-300 mb-1">{charData.emoji} {charData.name}</p>
      <p className="text-gray-400 mb-4">Nível {nivelAnterior} → <span className="text-gold font-bold">{nivelNovo}</span></p>
      <p className="text-yellow-400 font-bold mb-6">Pontos disponíveis: {pontosDisponiveis}</p>

      <div className="w-full max-w-sm space-y-3 mb-6">
        {stats.map(s => (
          <div key={s.key} className="flex items-center justify-between bg-dark-800 rounded-lg px-4 py-3">
            <div>
              <span className="text-gray-300 text-sm">{s.label}</span>
              <span className="text-gray-500 text-xs ml-2">({s.gain})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">{progresso.atributos[s.key]}</span>
              <span className="text-gray-500">→</span>
              <span className="text-gold font-bold text-sm w-8 text-center">{preview[s.key]}</span>
              <button
                onClick={() => dispatch({ type: 'UNDISTRIBUTE_POINT', payload: { stat: s.key } })}
                disabled={pontosDistribuidos[s.key] <= 0}
                className="w-7 h-7 bg-red-accent/20 text-red-accent rounded-full text-sm font-bold disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >−</button>
              <button
                onClick={() => dispatch({ type: 'DISTRIBUTE_POINT', payload: { stat: s.key } })}
                disabled={pontosDisponiveis <= 0}
                className="w-7 h-7 bg-green-accent/20 text-green-accent rounded-full text-sm font-bold disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: 'CONFIRM_LEVEL_UP' })}
        disabled={pontosDisponiveis > 0}
        className="py-3 px-8 bg-gold/90 text-dark-900 font-bold rounded-lg hover:bg-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        Confirmar
      </button>
    </div>
  )
}
