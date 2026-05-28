import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function ProfileScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const stats = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)

  return (
    <div className="flex flex-col h-full bg-bg-primary p-3 md:p-4 overflow-y-auto relative noise-bg">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-title text-xl md:text-2xl font-bold text-accent-gold">👤 Perfil</h2>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="btn-secondary px-3 py-1.5 text-xs">← Voltar</button>
        </div>

        <div className="card p-5 md:p-6 max-w-md mx-auto w-full">
          <div className="text-center mb-5">
            <span className="text-4xl">{classeData.emoji}</span>
            <h3 className="font-title text-xl font-bold text-text-primary mt-2">{state.currentUser}</h3>
            <p className="text-text-secondary text-sm">{classeData.name} · Nível <span className="font-mono text-accent-gold">{character.nivel}</span></p>
            <p className="font-mono text-xs text-epic-blue mt-1">XP: {character.xp}/{character.xpProximoNivel}</p>
          </div>

          <div className="border-t border-border-subtle pt-4 space-y-2">
            <h4 className="font-title text-xs text-text-muted mb-2">Atributos</h4>
            <p className="text-success text-sm">❤️ Vida: <span className="font-mono">{stats.vida}</span></p>
            <p className="text-danger text-sm">⚔️ Força: <span className="font-mono">{stats.forca}</span></p>
            <p className="text-epic-blue text-sm">🛡️ Defesa: <span className="font-mono">{stats.defesa}</span></p>
            <p className="text-accent-gold text-sm">💨 Velocidade: <span className="font-mono">{stats.velocidade}</span></p>
          </div>

          <div className="border-t border-border-subtle pt-4 mt-4 space-y-1">
            <h4 className="font-title text-xs text-text-muted mb-2">Ataques</h4>
            {classeData.attacks.map(a => (
              <p key={a.name} className="text-text-secondary text-sm">• {a.name} <span className="font-mono text-text-muted text-xs">F:{a.power} PP:{a.maxPP}</span></p>
            ))}
          </div>

          <div className="border-t border-border-subtle pt-4 mt-4">
            <h4 className="font-title text-xs text-text-muted mb-2">Passivo</h4>
            <p className="text-rare-purple text-sm italic">{classeData.passivo.descricao}</p>
          </div>

          <div className="border-t border-border-subtle pt-4 mt-4 space-y-1">
            <h4 className="font-title text-xs text-text-muted mb-2">Estatísticas</h4>
            <p className="text-text-secondary text-sm">Batalhas vencidas: <span className="font-mono text-text-primary">{character.batalhasVencidas}</span></p>
            <p className="text-text-secondary text-sm">Áreas concluídas: <span className="font-mono text-text-primary">{character.areasConcluidas.length}</span></p>
            <p className="text-text-secondary text-sm">Bosses derrotados: <span className="font-mono text-text-primary">{character.bossesDerotados.length}</span></p>
            <p className="text-text-secondary text-sm">Itens no inventário: <span className="font-mono text-text-primary">{character.inventario.length}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
