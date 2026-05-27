import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function LevelUpScreen() {
  const { state, dispatch } = useGame()
  const { levelUpData, character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const statsAtuais = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)
  const d = levelUpData.pontosDistribuidos

  const ganhos = { vida: '+10 HP', forca: '+2', defesa: '+2', velocidade: '+1' }
  const stats = [
    { key: 'vida', label: 'Vida', atual: statsAtuais.vida, bonus: d.vida * 10, color: 'text-green-accent' },
    { key: 'forca', label: 'Força', atual: statsAtuais.forca, bonus: d.forca * 2, color: 'text-red-accent' },
    { key: 'defesa', label: 'Defesa', atual: statsAtuais.defesa, bonus: d.defesa * 2, color: 'text-blue-accent' },
    { key: 'velocidade', label: 'Velocidade', atual: statsAtuais.velocidade, bonus: d.velocidade * 1, color: 'text-gold' },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-3 md:p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-gold mb-2">🌟 Level Up!</h2>
      <p className="text-gray-400 text-sm md:text-base mb-1">Nível {character.nivel}</p>
      <p className="text-xs md:text-sm text-purple-accent mb-4 md:mb-6">Pontos disponíveis: {levelUpData.pontosDisponiveis}</p>
      <div className="bg-dark-700 p-4 md:p-6 rounded-xl w-full max-w-md space-y-3 md:space-y-4">
        {stats.map(s => (
          <div key={s.key} className="flex items-center gap-2 md:gap-3">
            <span className={`w-20 md:w-24 text-xs md:text-sm font-bold ${s.color}`}>{s.label}</span>
            <span className="text-white text-xs md:text-sm w-14 md:w-16">{s.atual}{s.bonus > 0 ? ` (+${s.bonus})` : ''}</span>
            <span className="text-gray-500 text-[10px] md:text-xs hidden sm:inline">{ganhos[s.key]}/pt</span>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => dispatch({ type: 'UNDISTRIBUTE_POINT', payload: { stat: s.key } })} disabled={d[s.key] <= 0}
                className="w-6 h-6 md:w-7 md:h-7 rounded bg-dark-600 text-white text-sm disabled:opacity-30">-</button>
              <span className="w-5 md:w-6 text-center text-white text-xs md:text-sm leading-6 md:leading-7">{d[s.key]}</span>
              <button onClick={() => dispatch({ type: 'DISTRIBUTE_POINT', payload: { stat: s.key } })} disabled={levelUpData.pontosDisponiveis <= 0}
                className="w-6 h-6 md:w-7 md:h-7 rounded bg-dark-600 text-white text-sm disabled:opacity-30">+</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => dispatch({ type: 'CONFIRM_LEVEL_UP' })} disabled={levelUpData.pontosDisponiveis > 0}
        className={`mt-4 md:mt-6 px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base ${levelUpData.pontosDisponiveis > 0 ? 'bg-dark-600 text-gray-600 cursor-not-allowed' : 'bg-red-accent hover:bg-red-accent/80 text-white'}`}>Confirmar</button>
    </div>
  )
}
