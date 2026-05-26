export function xpParaProximoNivel(nivel) {
  return Math.floor(100 * nivel * (1 + nivel * 0.05))
}

export function xpGanhoPorVitoria(nivelInimigo) {
  return Math.floor(50 * nivelInimigo * (1 + nivelInimigo * 0.1))
}

export function calcularNivelInimigo(batalhasVencidas, nivelPersonagem = 1) {
  const base = Math.max(nivelPersonagem - 1, 0)
  return Math.min(100, Math.floor(batalhasVencidas * 1.5) + base + 1)
}

export function escalarAtributoInimigo(atributoBase, nivelInimigo) {
  return Math.floor(atributoBase * (1 + (nivelInimigo - 1) * 0.08))
}
