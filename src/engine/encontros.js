import { inteiro, escolherPonderado } from "./rng";

export function nivelMedio(herois) {
  if (herois.length === 0) return 1;
  return Math.round(herois.reduce((soma, h) => soma + h.nivel, 0) / herois.length);
}

// Sorteia um encontro da zona (SPEC.md §3.4). Retorna [{ id, nivel }].
export function gerarEncontro(zona, nivelMedioGrupo, rng) {
  const encontro = escolherPonderado(rng, zona.encontros);
  return encontro.inimigos.map((id) => ({
    id,
    nivel: Math.min(
      zona.nivelMax,
      Math.max(zona.nivelMin, nivelMedioGrupo + inteiro(rng, -1, 1)),
    ),
  }));
}

export function encontroDeChefe(zona) {
  return [{ id: zona.chefe, nivel: zona.nivelMax }];
}
