import { NOMES_SLOT, NOMES_ARMA, NOMES_PESO, NOMES_ATRIBUTO } from "../../data/textos";
import { golpes } from "../../data/golpes";
import { itens } from "../../data/itens";
import { buscarZona } from "../../data/zonas";
import { TAXA_PONTO } from "../../data/constants";

// "espada", "peito, leve"…
export function tipoDoEquipamento(e) {
  return e.slot === "arma" ? NOMES_ARMA[e.tipoArma] : `${NOMES_SLOT[e.slot].toLowerCase()}, ${NOMES_PESO[e.pesoArmadura]}`;
}

// Categorias do resumo de retorno e da tela Atividades, na ordem exibida
export const CATEGORIAS_ATIVIDADE = [
  { id: "expedicao", nome: "Expedições", tipos: ["expedicao"] },
  { id: "treino", nome: "Treino", tipos: ["treinoAtributo", "treinoGolpe"] },
];

// "Treino de Força", "Treino de golpe: Lança de Gelo", "Expedição: Cemitério Antigo"
export function descreverAtividade(atividade) {
  if (atividade.tipo === "expedicao") return `Expedição: ${buscarZona(atividade.parametros.zonaId).nome}`;
  if (atividade.tipo === "treinoGolpe") return `Treino de golpe: ${golpes[atividade.parametros.golpeId].nome}`;
  return `Treino de ${NOMES_ATRIBUTO[atividade.parametros.atributo]}`;
}

// "5 Osso Antigo, 2 Erva da Névoa"
export function descreverItens(contagem) {
  return Object.entries(contagem)
    .sort(([, a], [, b]) => b - a)
    .map(([id, qtd]) => `${qtd} ${itens[id].nome}`)
    .join(", ");
}

// "2 pontos de Força (+4)", "aprende Lança de Gelo", "5 Osso Antigo… · 40 ouro · 624 XP", "nada ainda"
export function descreverGanho(ganho) {
  if (ganho.tipo === "expedicao") {
    if (ganho.rolagens === 0) return "nada ainda";
    return `${descreverItens(ganho.itens)} · ${ganho.ouro} ouro · ${ganho.xp} XP`;
  }
  if (ganho.tipo === "treinoGolpe") return ganho.aprendeu ? `aprende ${golpes[ganho.golpeId].nome}` : "nada ainda";
  if (ganho.pontos === 0) return "nada ainda";
  const pontos = ganho.pontos === 1 ? "1 ponto" : `${ganho.pontos} pontos`;
  return `${pontos} de ${NOMES_ATRIBUTO[ganho.atributo]} (+${ganho.pontos * TAXA_PONTO[ganho.atributo]})`;
}
