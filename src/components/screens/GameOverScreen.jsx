import { useGame } from '../../context/GameContext'

export default function GameOverScreen() {
  const { dispatch } = useGame()
  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-4 relative overflow-hidden">
      {/* Red vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#e0555530_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-bg-primary/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <h2 className="font-title text-4xl md:text-5xl font-bold text-danger mb-8 animate-defeat-shake">GAME OVER</h2>
        <div className="flex flex-col gap-3 items-center w-full max-w-xs">
          <button onClick={() => dispatch({ type: 'CONTINUE_AFTER_DEFEAT' })} className="btn-gold-solid w-full py-3 text-sm">Continuar</button>
          <button onClick={() => dispatch({ type: 'GO_TITLE' })} className="btn-tertiary text-sm mt-2">Tela Inicial</button>
        </div>
      </div>
    </div>
  )
}
