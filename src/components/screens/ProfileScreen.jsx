import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function ProfileScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const stats = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)

  return (
    <div className="flex flex-col h-full bg-dark-900 p-3 md:p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gold">👤 Perfil</h2>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">← Voltar</button>
      </div>
      <div className="bg-dark-700 p-4 md:p-6 rounded-xl max-w-md mx-auto w-full">
        <div className="text-center mb-4">
          <span className="text-3xl md:text-4xl">{classeData.emoji}</span>
          <h3 className="text-lg md:text-xl font-bold text-white mt-2">{state.currentUser}</h3>
          <p className="text-gray-400 text-sm md:text-base">{classeData.name} · Nível {character.nivel}</p>
          <p className="text-xs md:text-sm text-blue-accent">XP: {character.xp}/{character.xpProximoNivel}</p>
        </div>
        <div className="border-t border-dark-600 pt-3 md:pt-4 space-y-1.5 md:space-y-2">
          <h4 className="text-xs md:text-sm font-bold text-gray-400">Atributos (base + equip)</h4>
          <p className="text-green-accent text-xs md:text-sm">Vida: {stats.vida}</p>
          <p className="text-red-accent text-xs md:text-sm">Força: {stats.forca}</p>
          <p className="text-blue-accent text-xs md:text-sm">Defesa: {stats.defesa}</p>
          <p className="text-gold text-xs md:text-sm">Velocidade: {stats.velocidade}</p>
        </div>
        <div className="border-t border-dark-600 pt-3 md:pt-4 mt-3 md:mt-4 space-y-1">
          <h4 className="text-xs md:text-sm font-bold text-gray-400">Ataques</h4>
          {classeData.attacks.map(a => <p key={a.name} className="text-gray-300 text-xs md:text-sm">• {a.name} (F:{a.power} PP:{a.maxPP})</p>)}
        </div>
        <div className="border-t border-dark-600 pt-3 md:pt-4 mt-3 md:mt-4 space-y-1">
          <h4 className="text-xs md:text-sm font-bold text-gray-400">Passivo</h4>
          <p className="text-purple-accent text-xs md:text-sm">{classeData.passivo.descricao}</p>
        </div>
        <div className="border-t border-dark-600 pt-3 md:pt-4 mt-3 md:mt-4 space-y-1">
          <h4 className="text-xs md:text-sm font-bold text-gray-400">Estatísticas</h4>
          <p className="text-gray-300 text-xs md:text-sm">Batalhas vencidas: {character.batalhasVencidas}</p>
          <p className="text-gray-300 text-xs md:text-sm">Áreas concluídas: {character.areasConcluidas.length}</p>
          <p className="text-gray-300 text-xs md:text-sm">Bosses derrotados: {character.bossesDerotados.length}</p>
          <p className="text-gray-300 text-xs md:text-sm">Itens no inventário: {character.inventario.length}</p>
        </div>
      </div>
    </div>
  )
}
