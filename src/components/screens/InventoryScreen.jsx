import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { corRaridade } from '../../data/itemGeneration'
import { podeEquipar } from '../../utils/itemRestrictions'
import { calcularPrecoVenda } from '../../data/shop'

export default function InventoryScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const [selectedItem, setSelectedItem] = useState(null)

  const slots = ['capacete', 'peitoral', 'luvas', 'botas', 'arma']

  return (
    <div className="flex flex-col h-full bg-bg-primary p-3 md:p-5 lg:p-6 overflow-y-auto relative noise-bg">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-title text-xl md:text-2xl lg:text-3xl font-bold text-accent-gold">🎒 Inventário</h2>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: state.lootData ? 'LOOT' : 'AREA_MAP' })} className="btn-secondary px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm">← Voltar</button>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-5 md:space-y-6">
          {/* Equipped */}
          <div className="card p-4 md:p-6">
            <h3 className="font-title text-sm md:text-base text-text-secondary mb-3 md:mb-4">Equipado</h3>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {slots.map(slot => {
                const item = character.equipamentos[slot]
                return (
                  <div
                    key={slot}
                    onClick={() => item && setSelectedItem({ ...item, equipped: true, slot })}
                    className="bg-bg-elevated p-3 md:p-4 rounded-lg text-center cursor-pointer border border-border-subtle hover:border-accent-gold/50 transition-all min-h-16 md:min-h-20 lg:min-h-24 flex flex-col items-center justify-center"
                  >
                    <p className="text-xs md:text-sm text-text-muted capitalize font-title">{slot}</p>
                    {item ? (
                      <p className="text-xs md:text-sm mt-1 font-bold truncate w-full" style={{ color: corRaridade[item.raridade] }}>{item.nome.split(' ')[0]}</p>
                    ) : (
                      <p className="text-text-muted text-xl md:text-2xl">—</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inventory grid */}
          <div className="card p-4 md:p-6 flex-1">
            <h3 className="font-title text-sm md:text-base text-text-secondary mb-3 md:mb-4">Itens <span className="font-mono">({character.inventario.length}/30)</span></h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
              {character.inventario.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-bg-elevated p-2.5 md:p-3 rounded-lg text-center cursor-pointer border transition-all hover:border-accent-gold/50 gold-hover min-h-14 md:min-h-16"
                  style={{ borderColor: corRaridade[item.raridade] + '40' }}
                >
                  <p className="text-xs md:text-sm truncate font-bold" style={{ color: corRaridade[item.raridade] }}>{item.nome.split(' ')[0]}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.tipo}</p>
                </div>
              ))}
              {Array.from({ length: 30 - character.inventario.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-bg-elevated/30 p-2.5 md:p-3 rounded-lg min-h-14 md:min-h-16 border border-dashed border-border-subtle" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Item detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
          <div className="card p-6 md:p-8 max-w-md w-full border-2 animate-slide-up" style={{ borderColor: corRaridade[selectedItem.raridade] }} onClick={e => e.stopPropagation()}>
            <p className="font-title text-lg md:text-xl font-bold" style={{ color: corRaridade[selectedItem.raridade] }}>{selectedItem.nome}</p>
            <p className="text-sm md:text-base text-text-secondary mb-4">{selectedItem.raridade} · {selectedItem.tipo} · Nv.{selectedItem.nivel}</p>
            <div className="space-y-1.5 text-sm md:text-base mb-5">
              {selectedItem.bonusVida > 0 && <p className="text-success font-mono">+{selectedItem.bonusVida} Vida</p>}
              {selectedItem.bonusForca > 0 && <p className="text-danger font-mono">+{selectedItem.bonusForca} Força</p>}
              {selectedItem.bonusDefesa > 0 && <p className="text-epic-blue font-mono">+{selectedItem.bonusDefesa} Defesa</p>}
              {selectedItem.bonusVelocidade > 0 && <p className="text-accent-gold font-mono">+{selectedItem.bonusVelocidade} Velocidade</p>}
            </div>
            {!podeEquipar(classeData, selectedItem) && <p className="text-warning text-sm mb-3">⚠️ Sua classe não pode usar este equipamento.</p>}
            <div className="flex gap-3 flex-wrap">
              {selectedItem.equipped ? (
                <button onClick={() => { dispatch({ type: 'UNEQUIP_ITEM', payload: { slot: selectedItem.slot } }); setSelectedItem(null) }}
                  className="btn-secondary px-5 py-2.5 text-sm border-epic-blue text-epic-blue">Desequipar</button>
              ) : (
                podeEquipar(classeData, selectedItem) && (
                  <button onClick={() => { dispatch({ type: 'EQUIP_ITEM', payload: { itemId: selectedItem.id } }); setSelectedItem(null) }}
                    className="btn-gold-solid px-5 py-2.5 text-sm">Equipar</button>
                )
              )}
              {!selectedItem.equipped && (
                <button onClick={() => { dispatch({ type: 'SELL_ITEM', payload: { itemId: selectedItem.id } }); setSelectedItem(null) }}
                  className="btn-gold-solid px-5 py-2.5 text-xs">🪙 Vender ({calcularPrecoVenda(selectedItem)})</button>
              )}
              {!selectedItem.equipped && (
                <button onClick={() => { dispatch({ type: 'DISCARD_ITEM', payload: { itemId: selectedItem.id } }); setSelectedItem(null) }}
                  className="btn-secondary px-5 py-2.5 text-sm border-danger text-danger">Descartar</button>
              )}
              <button onClick={() => setSelectedItem(null)} className="btn-tertiary px-5 py-2.5 text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
