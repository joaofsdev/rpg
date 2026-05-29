export function xpParaProximoNivel(nivel) {
  return Math.floor(150 * nivel * (1 + nivel * 0.05));
}

export function xpGanhoPorVitoria(nivelInimigo) {
  return Math.floor(45 * nivelInimigo * (1 + nivelInimigo * 0.1));
}

export function calcularNivelInimigo(nivelJogador) {
  const offset = Math.floor(Math.random() * 5) - 2;
  return Math.max(1, Math.min(100, nivelJogador + offset));
}

export function escalarAtributoInimigo(atributoBase, nivelInimigo) {
  return Math.floor(atributoBase * (1 + (nivelInimigo - 1) * 0.1));
}

export function escalarAtributoBoss(atributoBase, nivelBoss) {
  return Math.floor(atributoBase * (1 + (nivelBoss - 1) * 0.06));
}

export function escalarAtributoDungeon(atributoBase, nivelDungeon) {
  return Math.floor(atributoBase * (1 + (nivelDungeon - 1) * 0.14));
}

export function escalarAtributoBossDungeon(atributoBase, nivelDungeon) {
  return Math.floor(atributoBase * (1 + (nivelDungeon - 1) * 0.18));
}
