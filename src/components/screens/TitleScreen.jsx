import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import Modal from '../ui/Modal'

export default function TitleScreen() {
  const { dispatch } = useGame()
  const [modal, setModal] = useState(null)

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden bg-dark-900">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-purple-accent)_0%,_transparent_50%)] animate-pulse" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      {/* Fog overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900 opacity-60" />

      <div className="relative z-10 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold text-gold mb-2 animate-bounce" style={{ animationDuration: '3s', fontFamily: 'Georgia, serif' }}>
          ⚔️ Dark Realms
        </h1>
        <p className="text-gray-400 mb-12 text-lg tracking-widest">Batalhas por Turnos</p>

        <div className="flex flex-col gap-4 w-64 mx-auto">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'CHARACTER_SELECT' })} className="py-3 px-6 bg-gold/90 text-dark-900 font-bold rounded-lg hover:bg-gold hover:scale-105 transition-all text-lg cursor-pointer">
            ▶ Jogar Agora
          </button>
          <button onClick={() => setModal('about')} className="py-2 px-6 bg-dark-600 hover:bg-dark-700 rounded-lg transition-colors cursor-pointer">
            Sobre
          </button>
          <button onClick={() => setModal('credits')} className="py-2 px-6 bg-dark-600 hover:bg-dark-700 rounded-lg transition-colors cursor-pointer">
            Créditos
          </button>
        </div>
      </div>

      {modal === 'about' && (
        <Modal title="Sobre" onClose={() => setModal(null)}>
          <p>Dark Realms é um RPG de batalhas por turnos no estilo Pokémon. Escolha seu herói, enfrente inimigos cada vez mais poderosos, ganhe XP e evolua seus atributos. Sobreviva o máximo que puder!</p>
        </Modal>
      )}
      {modal === 'credits' && (
        <Modal title="Créditos" onClose={() => setModal(null)}>
          <ul className="space-y-2">
            <li>🎮 Game Design — Studio Fictício</li>
            <li>🎨 Arte & UI — Pixel Dreams</li>
            <li>🎵 Trilha Sonora — Chiptune Labs</li>
            <li>💻 Programação — React Heroes</li>
            <li>📖 Roteiro — Dark Ink Writers</li>
          </ul>
        </Modal>
      )}
    </div>
  )
}
