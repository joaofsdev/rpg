import { useGame } from '../../context/GameContext'
import { corRaridade } from '../../data/itemGeneration'
import { classes } from '../../data/classes'
import { podeEquipar } from '../../utils/itemRestrictions'

export default function LootScreen() {
  const { state, dispatch } = useGame()
  const { lootData, character } = state
  const classeData = classes.find(c => c.id === character.classeId)

  if (!lootData || lootData.length === 0) {
    dispatch({ type: 'SET_SCREEN', payload: 'VICTORY' })
    return null
  }

  const item = lootData[0]
  const compativel = podeEquipar(classeData, item)
  const inventarioCheio = character.inventario.length >= 30

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900 p-3 md:p-4">
      <h2 className="text-xl md:text-2xl font-bold text-gold mb-3 md:mb-4 animate-pulse">🎁 Item Encontrado!</h2>
      <div className="bg-dark-700 p-4 md:p-6 rounded-xl max-w-sm w-full border-2" style={{ borderColor: corRaridade[item.raridade] }}>
        <p className="text-base md:text-lg font-bold text-white mb-1">{item.nome}</p>
        <p className="text-xs md:text-sm mb-2" style={{ color: corRaridade[item.raridade] }}>{item.raridade} · Nv.{item.nivel}</p>
        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3">Slot: {item.tipo}{item.tipoArma ? ` (${item.tipoArma})` : ''}</p>
        <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm">
          {item.bonusVida > 0 && <p className="text-green-accent">+{item.bonusVida} Vida</p>}
          {item.bonusForca > 0 && <p className="text-red-accent">+{item.bonusForca} Força</p>}
          {item.bonusDefesa > 0 && <p className="text-blue-accent">+{item.bonusDefesa} Defesa</p>}
          {item.bonusVelocidade > 0 && <p className="text-gold">+{item.bonusVelocidade} Velocidade</p>}
        </div>
        {!compativel && <p className="text-red-accent text-[10px] md:text-xs mt-2 md:mt-3">⚠️ Sua classe não pode equipar este item</p>}
        {inventarioCheio && <p className="text-red-accent text-[10px] md:text-xs mt-1.5 md:mt-2">🎒 Inventário cheio! Descarte um item primeiro.</p>}
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3 mt-4 md:mt-6 justify-center">
        {compativel && (
          <button onClick={() => dispatch({ type: 'EQUIP_LOOT', payload: { itemIndex: 0 } })}
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base bg-gold/20 hover:bg-gold/30 text-gold">⚔️ Equipar</button>
        )}
        <button disabled={inventarioCheio} onClick={() => dispatch({ type: 'COLLECT_LOOT', payload: { itemIndex: 0 } })}
          className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base ${inventarioCheio ? 'bg-dark-600 text-gray-600 cursor-not-allowed' : 'bg-green-accent/20 hover:bg-green-accent/30 text-green-accent'}`}>Guardar</button>
        <button onClick={() => dispatch({ type: 'DISCARD_LOOT', payload: { itemIndex: 0 } })}
          className="px-4 md:px-6 py-2 md:py-3 bg-dark-600 hover:bg-dark-700 rounded-lg text-gray-300 text-sm md:text-base">Descartar</button>
      </div>
      <div className="flex gap-3 mt-3 md:mt-4">
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'INVENTORY' })}
          className="px-4 md:px-5 py-1.5 md:py-2 bg-blue-accent/20 hover:bg-blue-accent/30 rounded-lg text-blue-accent text-xs md:text-sm">🎒 Inventário</button>
      </div>
      {lootData.length > 1 && <p className="text-gray-500 text-xs md:text-sm mt-2 md:mt-3">+{lootData.length - 1} item(ns) restante(s)</p>}
    </div>
  )
}
