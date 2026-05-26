import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { characters } from '../../data/characters'
import StatBar from '../ui/StatBar'

export default function CharacterSelectScreen() {
  const { state, dispatch } = useGame()
  const [selected, setSelected] = useState(null)

  const selectedChar = selected ? characters.find(c => c.id === selected) : null
  const selectedProgress = selected ? state.personagens[selected] : null

  return (
    <div className="h-full flex flex-col bg-dark-900 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => dispatch({ type: 'GO_TITLE' })} className="text-gray-400 hover:text-white transition-colors cursor-pointer">← Voltar</button>
        <h2 className="text-2xl font-bold text-gold" style={{ fontFamily: 'Georgia, serif' }}>Escolha seu Herói</h2>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {characters.map(char => {
          const prog = state.personagens[char.id]
          const isSelected = selected === char.id
          return (
            <button
              key={char.id}
              onClick={() => setSelected(char.id)}
              className={`bg-dark-700 border-2 rounded-xl p-4 text-center transition-all cursor-pointer ${isSelected ? 'border-gold scale-105' : 'border-dark-600 hover:border-gray-500'}`}
            >
              <span className="text-4xl block mb-2">{char.emoji}</span>
              <h3 className="font-bold text-white text-sm">{char.name}</h3>
              <p className="text-gray-500 text-xs">{char.title}</p>
              <p className="text-gold text-xs mt-1">Nv. {prog.nivel}</p>
            </button>
          )
        })}
      </div>

      {selectedChar && (
        <div className="bg-dark-700 rounded-xl p-5 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{selectedChar.emoji}</span>
            <div>
              <h3 className="text-xl font-bold">{selectedChar.name} — {selectedChar.title}</h3>
              <p className="text-gray-400 text-sm">Nível {selectedProgress.nivel} · XP: {selectedProgress.xp}/{selectedProgress.xpProximoNivel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBar label="❤️ Vida" current={selectedProgress.atributos.vida} max={300} color="bg-red-accent" />
            <StatBar label="⚔️ Força" current={selectedProgress.atributos.forca} max={80} color="bg-gold" />
            <StatBar label="🛡️ Defesa" current={selectedProgress.atributos.defesa} max={60} color="bg-blue-accent" />
            <StatBar label="💨 Velocidade" current={selectedProgress.atributos.velocidade} max={60} color="bg-green-accent" />
          </div>

          <h4 className="text-sm font-bold text-gray-300 mb-2">Ataques:</h4>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {selectedChar.attacks.map((atk, i) => (
              <div key={i} className="bg-dark-800 rounded-lg px-3 py-2 text-xs">
                <span className="text-white font-medium">{atk.name}</span>
                <span className="text-gray-500 ml-2">F:{atk.power} PP:{atk.maxPP}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => dispatch({ type: 'SELECT_CHARACTER', payload: selected })}
            className="w-full py-3 bg-gold/90 text-dark-900 font-bold rounded-lg hover:bg-gold transition-colors text-lg cursor-pointer"
          >
            Entrar na Arena
          </button>
        </div>
      )}

      {!selectedChar && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Selecione um personagem acima
        </div>
      )}
    </div>
  )
}
