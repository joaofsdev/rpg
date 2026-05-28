import { useGame } from '../../context/GameContext'
import { dungeons } from '../../data/dungeons'

export default function DungeonSelectScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const nivelJogador = character.nivel || 1

  return (
    <div className="flex flex-col h-full bg-bg-primary p-3 md:p-6 relative noise-bg">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-title text-xl md:text-2xl font-bold text-accent-gold">⚔️ Dungeons</h2>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="btn-secondary px-3 py-1.5 text-xs">← Voltar</button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-4xl">
            {dungeons.map(d => {
              const disponivel = nivelJogador >= d.nivel
              const concluida = (character.dungeonsConcluidas || []).includes(d.id)
              return (
                <div
                  key={d.id}
                  onClick={() => disponivel && dispatch({ type: 'ENTER_DUNGEON', payload: { dungeonId: d.id } })}
                  className={`card p-4 text-center transition-all duration-200 ${
                    !disponivel
                      ? 'opacity-40 border-border-subtle'
                      : concluida
                      ? 'border-success/50 cursor-pointer hover:scale-[1.03]'
                      : 'animate-gold-pulse cursor-pointer hover:scale-[1.03]'
                  }`}
                >
                  <div className="text-2xl md:text-3xl mb-1 animate-float">{d.emoji}</div>
                  <h3 className="font-title text-text-primary font-bold text-xs md:text-sm">{d.name}</h3>
                  <p className="font-mono text-text-muted text-[10px] md:text-xs">Nv. {d.nivel}</p>
                  <p className="text-sm mt-1">{!disponivel ? '🔒' : concluida ? <span className="text-success">✓</span> : <span className="text-accent-gold">⚔️</span>}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
