import { useGame } from '../../context/GameContext'

export default function TitleScreen() {
  const { dispatch } = useGame()
  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-accent/10 to-dark-900" />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gold mb-2 animate-pulse">⚔️ MagiChill</h1>
        <p className="text-gray-400 mb-8 md:mb-12 text-base md:text-lg">RPG de Batalhas por Turnos</p>
        <div className="flex flex-col gap-3 md:gap-4">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AUTH' })} className="px-6 md:px-8 py-2.5 md:py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold text-base md:text-lg transition-all hover:scale-105">Jogar Agora</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'about' })} className="px-6 md:px-8 py-2.5 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 transition-all">Sobre</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'credits' })} className="px-6 md:px-8 py-2.5 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 transition-all">Créditos</button>
        </div>
      </div>
      {/* Modais */}
      <Modal type="about" />
      <Modal type="credits" />
    </div>
  )
}

function Modal({ type }) {
  const { state, dispatch } = useGame()
  if (state.modal !== type) return null
  const content = type === 'about'
    ? { title: 'Sobre', text: 'MagiChill é um RPG de batalhas por turnos onde você escolhe sua classe, equipa itens e progride por áreas temáticas enfrentando inimigos e bosses.' }
    : { title: 'Créditos', text: 'Desenvolvido com React + Vite + Tailwind CSS. Um projeto de RPG por turnos feito com amor.' }
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => dispatch({ type: 'SET_MODAL', payload: null })}>
      <div className="bg-dark-700 p-8 rounded-xl max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gold mb-4">{content.title}</h2>
        <p className="text-gray-300 mb-6">{content.text}</p>
        <button onClick={() => dispatch({ type: 'SET_MODAL', payload: null })} className="px-6 py-2 bg-dark-600 hover:bg-dark-800 rounded-lg text-white">Fechar</button>
      </div>
    </div>
  )
}
