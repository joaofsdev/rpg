export function calcularDano(ataque, atacante, defensor) {
  let dano = Math.floor((ataque.power * atacante.forca / 10) - (defensor.defesa / 2))
  dano = Math.max(1, dano + Math.floor(Math.random() * 5) - 2)
  return dano
}
