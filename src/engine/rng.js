// Gerador pseudoaleatório com semente (mulberry32). O estado é um inteiro de 32 bits
// que pode ser salvo e restaurado, o que torna batalhas e atividades reproduzíveis.

export function criarRng(semente) {
  let estado = semente >>> 0;
  return {
    proximo() {
      estado = (estado + 0x6d2b79f5) >>> 0;
      let t = estado;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get estado() {
      return estado;
    },
  };
}

export function inteiro(rng, min, max) {
  return Math.floor(rng.proximo() * (max - min + 1)) + min;
}

export function chance(rng, probabilidade) {
  if (probabilidade >= 1) return true;
  if (probabilidade <= 0) return false;
  return rng.proximo() < probabilidade;
}

export function escolher(rng, lista) {
  return lista[Math.floor(rng.proximo() * lista.length)];
}

export function escolherPonderado(rng, lista, pesoDe = (item) => item.peso) {
  const total = lista.reduce((soma, item) => soma + pesoDe(item), 0);
  let alvo = rng.proximo() * total;
  for (const item of lista) {
    alvo -= pesoDe(item);
    if (alvo < 0) return item;
  }
  return lista[lista.length - 1];
}

// Identificador de 32 caracteres hexadecimais derivado do RNG (formato de UUID)
export function gerarId(rng) {
  let hex = "";
  for (let i = 0; i < 4; i++) {
    hex += Math.floor(rng.proximo() * 4294967296)
      .toString(16)
      .padStart(8, "0");
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
