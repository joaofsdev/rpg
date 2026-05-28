import { useGame } from '../../context/GameContext'
import { corRaridade } from '../../data/itemGeneration'
import { classes } from '../../data/classes'
import { podeEquipar } from '../../utils/itemRestrictions'
import { calcularPrecoVenda } from '../../data/shop'

const rarityClass = {
  'Comum': '',
  'Incomum': 'border-success',
  'Raro': 'border-rare-purple',
  'Épico': 'border-epic-blue',
  'Lendário': 'animate-legendary-glow',
}

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
  const rClass = rarityClass[item.raridade] || ''

  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-3 md:p-4 relative noise-bg">
      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <h2 className="font-title text-xl md:text-2xl font-bold text-accent-gold mb-4">🎁 Item Encontrado!</h2>

        <div className={`card p-5 md:p-6 max-w-sm w-full border-2 ${rClass}`} style={{ borderColor: rClass ? undefined : corRaridade[item.raridade] }}>
          <p className="font-title text-lg font-bold" style={{ color: corRaridade[item.raridade] }}>{item.nome}</p>
          <p className="text-xs mb-3 text-text-secondary">{item.raridade} · Nv.{item.nivel} · {item.tipo}{item.tipoArma ? ` (${item.tipoArma})` : ''}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {item.bonusVida > 0 && <p className="text-success flex items-center gap-1"><span>❤️</span> <span className="font-mono">+{item.bonusVida}</span> Vida</p>}
            {item.bonusForca > 0 && <p className="text-danger flex items-center gap-1"><span>⚔️</span> <span className="font-mono">+{item.bonusForca}</span> Força</p>}
            {item.bonusDefesa > 0 && <p className="text-epic-blue flex items-center gap-1"><span>🛡️</span> <span className="font-mono">+{item.bonusDefesa}</span> Defesa</p>}
            {item.bonusVelocidade > 0 && <p className="text-accent-gold flex items-center gap-1"><span>💨</span> <span className="font-mono">+{item.bonusVelocidade}</span> Velocidade</p>}
          </div>

          {!compativel && <p className="text-warning text-xs mt-3 flex items-center gap-1"><span>⚠️</span> Sua classe não pode equipar este item</p>}
          {inventarioCheio && <p className="text-danger text-xs mt-2">🎒 Inventário cheio! Descarte um item primeiro.</p>}
        </div>

        <div className="flex flex-wrap gap-3 mt-5 justify-center">
          {compativel && (
            <button onClick={() => dispatch({ type: 'EQUIP_LOOT', payload: { itemIndex: 0 } })} className="btn-gold-solid px-5 py-2.5 text-sm">⚔️ Equipar</button>
          )}
          <button
            disabled={inventarioCheio}
            onClick={() => dispatch({ type: 'COLLECT_LOOT', payload: { itemIndex: 0 } })}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${inventarioCheio ? 'bg-bg-elevated text-text-muted cursor-not-allowed' : 'btn-secondary border-success text-success hover:bg-success/10'}`}
          >
            Guardar
          </button>
          <button onClick={() => dispatch({ type: 'SELL_LOOT', payload: { itemIndex: 0 } })}
            className="btn-secondary px-5 py-2.5 text-sm border-accent-gold text-accent-gold">🪙 Vender ({calcularPrecoVenda(item)})</button>
          <button onClick={() => dispatch({ type: 'DISCARD_LOOT', payload: { itemIndex: 0 } })} className="btn-secondary px-5 py-2.5 text-sm">Descartar</button>
        </div>

        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'INVENTORY' })} className="btn-tertiary mt-4 text-sm">🎒 Inventário</button>
        {lootData.length > 1 && <p className="text-text-muted text-xs mt-3">+{lootData.length - 1} item(ns) restante(s)</p>}
      </div>
    </div>
  )
}
