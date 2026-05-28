import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'
import { classes } from '../../data/classes'

export default function AreaMapScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const classeData = classes.find(c => c.id === character.classeId)

  function getStatus(area) {
    if (character.areasConcluidas.includes(area.id)) return 'concluida'
    if (character.areasDesbloqueadas.includes(area.id)) return 'disponivel'
    return 'bloqueada'
  }

  const xpPct = (character.xp / character.xpProximoNivel) * 100

  return (
    <div className="flex flex-col h-full bg-bg-primary p-3 md:p-6 relative noise-bg">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{classeData.emoji}</span>
              <span className="font-title text-text-primary font-bold text-sm">{state.currentUser}</span>
              <span className="font-mono text-accent-gold text-xs">Nv.{character.nivel}</span>
            </div>
            <div className="w-32 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent-gold to-accent-amber rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="font-mono text-accent-gold text-xs mt-0.5">🪙 {character.ouro || 0}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'SHOP' })} className="btn-secondary px-3 py-1.5 text-xs" title="Loja">🏪 Loja</button>
            <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'DUNGEON_SELECT' })} className="btn-secondary px-3 py-1.5 text-xs" title="Dungeons">⚔️ Dungeons</button>
            <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'INVENTORY' })} className="btn-secondary px-3 py-1.5 text-xs" title="Inventário">🎒</button>
            <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'PROFILE' })} className="btn-secondary px-3 py-1.5 text-xs" title="Perfil">👤</button>
            <button onClick={() => dispatch({ type: 'LOGOUT' })} className="btn-tertiary px-2 py-1.5 text-xs">🚪</button>
          </div>
        </div>

        {/* Map title */}
        <h2 className="font-title text-xl md:text-2xl font-bold text-accent-gold text-center mb-4">Mapa de Áreas</h2>

        {/* Area nodes */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex flex-col items-center gap-3 md:gap-4 w-full max-w-xs mx-auto">
            {areas.map((area, idx) => {
              const status = getStatus(area)
              const blocked = status === 'bloqueada'
              return (
                <div key={area.id} className="w-full flex flex-col items-center">
                  {idx > 0 && <div className="w-px h-4 border-l border-dashed border-border-subtle mb-2" />}
                  <div
                    onClick={() => !blocked && dispatch({ type: 'ENTER_AREA', payload: { areaId: area.id } })}
                    className={`card w-full p-4 text-center transition-all duration-200 ${
                      blocked
                        ? 'opacity-40 border-border-subtle'
                        : status === 'concluida'
                        ? 'border-success/50'
                        : 'animate-gold-pulse cursor-pointer hover:scale-[1.02]'
                    }`}
                  >
                    <div className="text-2xl md:text-3xl mb-1">{area.emoji}</div>
                    <h3 className="font-title text-text-primary font-bold text-sm">{area.name}</h3>
                    <p className="font-mono text-text-muted text-xs">Nv. {area.nivelMin}–{area.nivelMax}</p>
                    <p className="text-sm mt-1">
                      {blocked ? '🔒' : status === 'concluida' ? <span className="text-success">✓</span> : <span className="text-accent-gold">⚔️</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
