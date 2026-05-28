import { useEffect, useState } from 'react'
import { useGame } from '../../context/GameContext'
import { classes } from '../../data/classes'
import { dungeons } from '../../data/dungeons'
import { calcularAtributosFinais } from '../../utils/battleFormulas'

export default function DungeonBattleScreen() {
  const { state, dispatch } = useGame()
  const { batalha, character, dungeonState } = state
  const classeData = classes.find(c => c.id === character.classeId)
  const stats = calcularAtributosFinais(classeData.baseStats, character.pontosDistribuidos, character.equipamentos)
  const dungeon = dungeons.find(d => d.id === dungeonState?.dungeonId)
  const enemy = batalha.enemy
  const [shaking, setShaking] = useState(null)

  useEffect(() => {
    if (batalha.turn === 'enemy' && batalha.animating) {
      const t = setTimeout(() => dispatch({ type: 'ENEMY_ATTACK' }), 1000)
      return () => clearTimeout(t)
    }
  }, [batalha.turn, batalha.animating])

  useEffect(() => {
    if (batalha.log.length > 0) {
      setShaking('enemy')
      setTimeout(() => setShaking(null), 300)
    }
  }, [batalha.log.length])

  const hpPct = (character.hpAtual / stats.vida) * 100
  const enemyHpPct = (enemy.hpAtual / enemy.stats.vida) * 100
  const isBoss = enemy.isBoss

  function hpColor(pct) {
    if (pct > 60) return 'from-success to-success'
    if (pct > 25) return 'from-warning to-accent-amber'
    return 'from-danger to-danger'
  }

  return (
    <div className={`flex flex-col h-full p-3 md:p-4 max-w-2xl mx-auto bg-bg-primary relative noise-bg ${isBoss ? 'border-l-2 border-r-2 border-danger/30' : ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="text-center mb-2">
          <span className="text-text-secondary text-xs font-body">{dungeon?.emoji} {dungeon?.name} · Horda {dungeonState?.hordaAtual}/{dungeon?.hordas + 1}</span>
          {isBoss && <span className="ml-2 text-danger font-title font-bold text-xs animate-defeat-shake inline-block">💀 BOSS</span>}
        </div>

        {/* Enemy */}
        <div className={`card p-3 md:p-4 mb-2 ${shaking === 'enemy' ? 'animate-shake' : ''}`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-title text-text-primary font-bold text-sm md:text-base">
              <span className="animate-float inline-block">{enemy.emoji}</span> {enemy.name}
              <span className="font-mono text-text-muted text-xs ml-1">Nv.{enemy.nivel}</span>
            </span>
            <span className="font-mono text-text-secondary text-xs">{enemy.hpAtual}/{enemy.stats.vida}</span>
          </div>
          <div className="h-2.5 md:h-3 bg-bg-elevated rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${hpColor(enemyHpPct)} transition-all duration-500 ease-out`} style={{ width: `${enemyHpPct}%` }} />
          </div>
        </div>

        {/* Player */}
        <div className="card p-3 md:p-4 mb-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-title text-text-primary font-bold text-sm md:text-base">
              {classeData.emoji} {classeData.name}
              <span className="font-mono text-text-muted text-xs ml-1">Nv.{character.nivel}</span>
            </span>
            <span className="font-mono text-text-secondary text-xs">{character.hpAtual}/{stats.vida}</span>
          </div>
          <div className="h-2.5 md:h-3 bg-bg-elevated rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${hpColor(hpPct)} transition-all duration-500 ease-out`} style={{ width: `${hpPct}%` }} />
          </div>
          {batalha.buffs?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {batalha.buffs.map((b, i) => <span key={i} className="text-[10px] bg-rare-purple/20 text-rare-purple px-2 py-0.5 rounded font-mono">+{b.valor} {b.stat} ({b.turnos}t)</span>)}
            </div>
          )}
        </div>

        {/* Log */}
        <div className="flex-1 bg-bg-elevated rounded-xl border border-border-subtle p-2 md:p-3 mb-2 overflow-y-auto max-h-28 md:max-h-40">
          {batalha.log.slice(-6).map((msg, i) => (
            <p key={i} className={`text-xs md:text-sm mb-0.5 animate-fade-in ${
              msg.includes('⚔') || msg.includes('usou') ? 'text-accent-gold' :
              msg.includes('recebeu') || msg.includes('dano') ? 'text-danger/80' :
              'text-text-secondary'
            }`}>{msg}</p>
          ))}
        </div>

        {/* Attacks */}
        <div className="grid grid-cols-2 gap-2">
          {batalha.playerAttacks.map((atk, i) => {
            const disabled = batalha.turn !== 'player' || atk.currentPP <= 0
            const lowPP = atk.currentPP === 1 && atk.currentPP > 0
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => dispatch({ type: 'PLAYER_ATTACK', payload: { attackIndex: i } })}
                className={`p-2.5 md:p-3 rounded-lg text-xs md:text-sm font-title font-bold transition-all duration-200 border ${
                  atk.currentPP <= 0
                    ? 'bg-bg-elevated text-text-muted border-border-subtle cursor-not-allowed'
                    : disabled
                    ? 'bg-bg-surface text-text-muted border-border-subtle'
                    : lowPP
                    ? 'bg-bg-surface text-text-primary border-warning gold-hover hover:scale-[1.03] active:scale-95'
                    : 'bg-bg-surface text-text-primary border-border-accent gold-hover hover:scale-[1.03] active:scale-95'
                }`}
              >
                {atk.name}
                <span className="block font-mono text-[10px] md:text-xs text-text-muted mt-0.5">F:{atk.power} · PP: {atk.currentPP}/{atk.maxPP}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
