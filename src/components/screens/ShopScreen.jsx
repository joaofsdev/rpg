import { useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { getShop, getTimeUntilRefresh, calcularPrecoVenda } from '../../data/shop'
import { corRaridade } from '../../data/itemGeneration'
import { classes } from '../../data/classes'
import { podeEquipar } from '../../utils/itemRestrictions'

function formatTime(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function ShopScreen() {
  const { state, dispatch } = useGame()
  const { character } = state
  const [timeLeft, setTimeLeft] = useState(getTimeUntilRefresh())
  const [selectedItem, setSelectedItem] = useState(null)

  const shopData = getShop(character.nivel)
  const classeData = classes.find(c => c.id === character.classeId)

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilRefresh()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full bg-bg-primary p-3 md:p-5 lg:p-6 overflow-y-auto relative noise-bg">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
          <div>
            <h2 className="font-title text-xl md:text-2xl lg:text-3xl font-bold text-accent-gold">🏪 Loja</h2>
            <p className="text-text-muted text-xs md:text-sm font-mono mt-1">Renova em: {formatTime(timeLeft)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-accent-gold text-sm md:text-base font-bold">🪙 {character.ouro || 0}</span>
            <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'AREA_MAP' })} className="btn-secondary px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm">← Voltar</button>
          </div>
        </div>

        {/* Shop items */}
        <div className="max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {shopData.items.map((item, idx) => {
              const sold = shopData.sold[idx]
              const canAfford = (character.ouro || 0) >= item.preco
              const compativel = podeEquipar(classeData, item)
              return (
                <div
                  key={idx}
                  className={`card p-4 md:p-5 transition-all duration-200 ${sold ? 'opacity-40' : canAfford ? 'gold-hover cursor-pointer' : 'cursor-pointer'}`}
                  onClick={() => !sold && setSelectedItem({ ...item, slotIndex: idx })}
                >
                  {sold ? (
                    <div className="text-center py-6">
                      <p className="text-text-muted font-title text-sm">VENDIDO</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-title text-sm md:text-base font-bold truncate" style={{ color: corRaridade[item.raridade] }}>{item.nome}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{item.raridade} · {item.tipo} · Nv.{item.nivel}</p>
                      {!compativel && <p className="text-warning text-xs mt-1">⚠️ Incompatível com sua classe</p>}
                      <div className="mt-2 space-y-0.5 text-xs md:text-sm">
                        {item.bonusVida > 0 && <p className="text-success font-mono">+{item.bonusVida} Vida</p>}
                        {item.bonusForca > 0 && <p className="text-danger font-mono">+{item.bonusForca} Força</p>}
                        {item.bonusDefesa > 0 && <p className="text-epic-blue font-mono">+{item.bonusDefesa} Defesa</p>}
                        {item.bonusVelocidade > 0 && <p className="text-accent-gold font-mono">+{item.bonusVelocidade} Velocidade</p>}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center">
                        <span className={`font-mono text-sm font-bold ${canAfford ? 'text-accent-gold' : 'text-danger'}`}>🪙 {item.preco}</span>
                        {!canAfford && <span className="text-danger text-xs">Sem ouro</span>}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Buy confirmation modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
          <div className="card p-6 md:p-8 max-w-md w-full border-2 animate-slide-up" style={{ borderColor: corRaridade[selectedItem.raridade] }} onClick={e => e.stopPropagation()}>
            <p className="font-title text-lg md:text-xl font-bold" style={{ color: corRaridade[selectedItem.raridade] }}>{selectedItem.nome}</p>
            <p className="text-sm text-text-secondary mb-4">{selectedItem.raridade} · {selectedItem.tipo} · Nv.{selectedItem.nivel}</p>
            <div className="space-y-1.5 text-sm md:text-base mb-5">
              {selectedItem.bonusVida > 0 && <p className="text-success font-mono">+{selectedItem.bonusVida} Vida</p>}
              {selectedItem.bonusForca > 0 && <p className="text-danger font-mono">+{selectedItem.bonusForca} Força</p>}
              {selectedItem.bonusDefesa > 0 && <p className="text-epic-blue font-mono">+{selectedItem.bonusDefesa} Defesa</p>}
              {selectedItem.bonusVelocidade > 0 && <p className="text-accent-gold font-mono">+{selectedItem.bonusVelocidade} Velocidade</p>}
            </div>
            <p className="font-mono text-accent-gold text-lg mb-4">🪙 {selectedItem.preco}</p>
            {!podeEquipar(classeData, selectedItem) && <p className="text-warning text-sm mb-3">⚠️ Sua classe não pode equipar este item</p>}
            <div className="flex gap-3">
              {(character.ouro || 0) >= selectedItem.preco && character.inventario.length < 30 ? (
                <button
                  onClick={() => { dispatch({ type: 'BUY_SHOP_ITEM', payload: { slotIndex: selectedItem.slotIndex } }); setSelectedItem(null) }}
                  className="btn-gold-solid px-5 py-2.5 text-sm"
                >
                  Comprar
                </button>
              ) : (
                <p className="text-danger text-sm">{character.inventario.length >= 30 ? '🎒 Inventário cheio' : 'Ouro insuficiente'}</p>
              )}
              <button onClick={() => setSelectedItem(null)} className="btn-secondary px-5 py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
