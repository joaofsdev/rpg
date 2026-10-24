import { NOMES_SLOT, NOMES_ARMA, NOMES_PESO } from "../../data/textos";

// "espada", "peito, leve"…
export function tipoDoEquipamento(e) {
  return e.slot === "arma" ? NOMES_ARMA[e.tipoArma] : `${NOMES_SLOT[e.slot].toLowerCase()}, ${NOMES_PESO[e.pesoArmadura]}`;
}
