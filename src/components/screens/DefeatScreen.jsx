import { useGame } from '../../context/GameContext'
import { areas } from '../../data/areas'

export default function DefeatScreen() {
  const { state, dispatch } = useGame()
  const { batalha, character, areaAtual } = state
  const area = areas.find(a => a.id === areaAtual)
  const isDungeon = batalha?.isDungeon

  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-3 md:p-4 relative overflow-hidden">
      {/* Red vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#e0555530_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-bg-primary/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <h2 className="font-title text-3xl md:text-4xl font-bold text-danger mb-4 animate-defeat-shake">DERROTA</h2>

        <div className="card p-5 md:p-6 max-w-sm w-full mb-6 border-danger/30">
          {isDungeon && <p className="text-text-secondary mb-2">Dungeon falhou!</p>}
          {!isDungeon && <p className="text-text-secondary mb-2">Área: {area?.name}</p>}
          <p className="text-text-secondary mb-2">Nível: <span className="font-mono text-text-primary">{character.nivel}</span></p>
          <p className="text-text-secondary mb-2">Derrotado por: <span className="text-danger">{batalha?.enemy?.name}</span></p>
          <p className="text-text-secondary">Batalhas vencidas: <span className="font-mono text-text-primary">{character.batalhasVencidas}</span></p>
        </div>

        <div className="flex flex-col gap-3 items-center w-full max-w-xs">
          {isDungeon ? (
            <>
              <button onClick={() => dispatch({ type: 'RETRY_DUNGEON' })} className="btn-gold-solid w-full py-3 text-sm">Tentar Novamente</button>
              <button onClick={() => dispatch({ type: 'DUNGEON_DEFEAT' })} className="btn-secondary w-full py-3 text-sm">Voltar às Dungeons</button>
            </>
          ) : (
            <>
              <button onClick={() => dispatch({ type: 'RETRY_AREA' })} className="btn-gold-solid w-full py-3 text-sm">Continuar</button>
              <button onClick={() => dispatch({ type: 'CONTINUE_AFTER_DEFEAT' })} className="btn-secondary w-full py-3 text-sm">Voltar às Áreas</button>
            </>
          )}
        </div>
        <p className="text-text-muted text-xs mt-4">Seu progresso foi mantido (nível, XP e itens).</p>
      </div>
    </div>
  )
}
