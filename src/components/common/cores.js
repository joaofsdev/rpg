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

export function corRecurso(tipo) {
  return tipo === "mana" ? "var(--color-mana)" : "var(--color-vigor)";
}
