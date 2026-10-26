export function corDaVida(atual, maximo) {
  const pct = maximo > 0 ? atual / maximo : 0;
  if (pct > 0.5) return "var(--color-sucesso)";
  if (pct > 0.25) return "var(--color-vigor)";
  return "var(--color-perigo)";
}

const CLASSE_RARIDADE = {
  Comum: "text-raridade-comum",
  Incomum: "text-raridade-incomum",
  Raro: "text-raridade-raro",
  Épico: "text-raridade-epico",
  Lendário: "text-raridade-lendario",
};

export function classeRaridade(raridade) {
  return CLASSE_RARIDADE[raridade] || "text-texto";
}

// Faixa colorida ao lado do nome (decorativa: a raridade também aparece em texto)
const FUNDO_RARIDADE = {
  Comum: "bg-raridade-comum",
  Incomum: "bg-raridade-incomum",
  Raro: "bg-raridade-raro",
  Épico: "bg-raridade-epico",
  Lendário: "bg-raridade-lendario",
};

export function fundoRaridade(raridade) {
  return FUNDO_RARIDADE[raridade] || "bg-borda-forte";
}

export function corRecurso(tipo) {
  return tipo === "mana" ? "var(--color-mana)" : "var(--color-vigor)";
}
