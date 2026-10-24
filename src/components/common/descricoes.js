import { NOMES_SLOT, NOMES_ARMA, NOMES_PESO, NOMES_ATRIBUTO } from "../../data/textos";
import { golpes } from "../../data/golpes";
import { TAXA_PONTO } from "../../data/constants";

// "espada", "peito, leve"…
export function tipoDoEquipamento(e) {
  return e.slot === "arma" ? NOMES_ARMA[e.tipoArma] : `${NOMES_SLOT[e.slot].toLowerCase()}, ${NOMES_PESO[e.pesoArmadura]}`;
}

// "Treino de Força", "Treino de golpe: Lança de Gelo"
export function descreverAtividade(atividade) {
  if (atividade.tipo === "treinoGolpe") return `Treino de golpe: ${golpes[atividade.parametros.golpeId].nome}`;
  return `Treino de ${NOMES_ATRIBUTO[atividade.parametros.atributo]}`;
}

// "2 pontos de Força (+4)", "aprende Lança de Gelo", "nada ainda"
export function descreverGanho(ganho) {
  if (ganho.tipo === "treinoGolpe") return ganho.aprendeu ? `aprende ${golpes[ganho.golpeId].nome}` : "nada ainda";
  if (ganho.pontos === 0) return "nada ainda";
  const pontos = ganho.pontos === 1 ? "1 ponto" : `${ganho.pontos} pontos`;
  return `${pontos} de ${NOMES_ATRIBUTO[ganho.atributo]} (+${ganho.pontos * TAXA_PONTO[ganho.atributo]})`;
}
