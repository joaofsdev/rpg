import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { corRaridade } from '../../data/itemGeneration'
import { podeEquipar } from '../../utils/itemRestrictions'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function InventoryScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const [selectedItem, setSelectedItem] = useState(null)
  const stats = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)

  const slots = ['capacete', 'peitoral', 'luvas', 'botas', 'arma']

  return (
    <div className="flex flex-col h-full bg-dark-900 p-3 md:p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gold">🎒 Inventário</h2>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: state.lootData ? 'LOOT' : 'AREA_MAP' })} className="px-3 py-1.5 md:px-4 md:py-2 bg-dark-600 hover:bg-dark-700 rounded-lg text-xs md:text-sm text-gray-300">← Voltar</button>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-dark-700 p-3 md:p-4 rounded-xl mb-3 md:mb-4">
          <h3 className="text-xs md:text-sm font-bold text-gray-400 mb-2">Equipado</h3>
          <div className="grid grid-cols-5 gap-1.5 md:gap-2">
            {slots.map(slot => {
              const item = character.equipamentos[slot]
              return (
                <div key={slot} onClick={() => item && setSelectedItem({ ...item, equipped: true, slot })}
                  className="bg-dark-800 p-1.5 md:p-2 rounded-lg text-center cursor-pointer hover:bg-dark-600 min-h-12 md:min-h-16">
                  <p className="text-[10px] md:text-xs text-gray-500 capitalize">{slot}</p>
                  {item ? <p className="text-[10px] md:text-xs mt-1" style={{ color: corRaridade[item.raridade] }}>{item.nome.split(' ')[0]}</p> : <p className="text-gray-600 text-base md:text-lg">-</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-dark-700 p-3 md:p-4 rounded-xl flex-1">
          <h3 className="text-xs md:text-sm font-bold text-gray-400 mb-2">Itens ({character.inventario.length}/30)</h3>
          <div className="grid grid-cols-5 md:grid-cols-6 gap-1.5 md:gap-2">
            {character.inventario.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)}
                className="bg-dark-800 p-1.5 md:p-2 rounded-lg text-center cursor-pointer hover:bg-dark-600 border" style={{ borderColor: corRaridade[item.raridade] + '40' }}>
                <p className="text-[10px] md:text-xs truncate" style={{ color: corRaridade[item.raridade] }}>{item.nome.split(' ')[0]}</p>
                <p className="text-[10px] md:text-xs text-gray-500">{item.tipo}</p>
              </div>
            ))}
            {Array.from({ length: 30 - character.inventario.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-dark-800/50 p-1.5 md:p-2 rounded-lg min-h-10 md:min-h-12" />
            ))}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-dark-700 p-4 md:p-6 rounded-xl max-w-sm w-full border-2" style={{ borderColor: corRaridade[selectedItem.raridade] }} onClick={e => e.stopPropagation()}>
            <p className="text-base md:text-lg font-bold text-white">{selectedItem.nome}</p>
            <p className="text-xs md:text-sm mb-2 md:mb-3" style={{ color: corRaridade[selectedItem.raridade] }}>{selectedItem.raridade} · {selectedItem.tipo} · Nv.{selectedItem.nivel}</p>
            <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm mb-3 md:mb-4">
              {selectedItem.bonusVida > 0 && <p className="text-green-accent">+{selectedItem.bonusVida} Vida</p>}
              {selectedItem.bonusForca > 0 && <p className="text-red-accent">+{selectedItem.bonusForca} Força</p>}
              {selectedItem.bonusDefesa > 0 && <p className="text-blue-accent">+{selectedItem.bonusDefesa} Defesa</p>}
              {selectedItem.bonusVelocidade > 0 && <p className="text-gold">+{selectedItem.bonusVelocidade} Velocidade</p>}
            </div>
            {!podeEquipar(classeData, selectedItem) && <p className="text-red-accent text-[10px] md:text-xs mb-2 md:mb-3">⚠️ Sua classe não pode usar este equipamento.</p>}
            <div className="flex gap-2 flex-wrap">
              {selectedItem.equipped ? (
                <button onClick={() => { dispatch({ type: 'UNEQUIP_ITEM', payload: { slot: selectedItem.slot } }); setSelectedItem(null) }}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-accent/20 text-blue-accent rounded-lg text-xs md:text-sm">Desequipar</button>
              ) : (
                podeEquipar(classeData, selectedItem) && (
                  <button onClick={() => { dispatch({ type: 'EQUIP_ITEM', payload: { itemId: selectedItem.id } }); setSelectedItem(null) }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-green-accent/20 text-green-accent rounded-lg text-xs md:text-sm">Equipar</button>
                )
              )}
              {!selectedItem.equipped && (
                <button onClick={() => { dispatch({ type: 'DISCARD_ITEM', payload: { itemId: selectedItem.id } }); setSelectedItem(null) }}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-red-accent/20 text-red-accent rounded-lg text-xs md:text-sm">Descartar</button>
              )}
              <button onClick={() => setSelectedItem(null)} className="px-3 md:px-4 py-1.5 md:py-2 bg-dark-600 text-gray-300 rounded-lg text-xs md:text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
