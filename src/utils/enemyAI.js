const BASIC_ATTACK = { name: 'Ataque Básico', power: 5, maxPP: Infinity, currentPP: Infinity }

export function escolherAtaqueInimigo(attacks) {
  const disponiveis = attacks.filter(a => a.currentPP > 0)
  if (disponiveis.length === 0) return BASIC_ATTACK
  return disponiveis[Math.floor(Math.random() * disponiveis.length)]
}
