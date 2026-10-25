// Efeitos ativos no grupo (refeição e relíquias): [{ tipo, valor, elemento? }] (SPEC.md §3.7, §3.11).
// Efeitos do mesmo tipo se somam.

export function somaDosEfeitos(efeitos, tipo) {
  return efeitos.filter((e) => e.tipo === tipo).reduce((soma, e) => soma + e.valor, 0);
}

// { [elemento]: fração } dos efeitos de dano por elemento
export function bonusPorElemento(efeitos) {
  const bonus = {};
  for (const e of efeitos) {
    if (e.tipo === "danoElemento") bonus[e.elemento] = (bonus[e.elemento] || 0) + e.valor;
  }
  return bonus;
}
