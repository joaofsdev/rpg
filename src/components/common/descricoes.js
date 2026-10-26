import { NOMES_SLOT, NOMES_ARMA, NOMES_PESO, NOMES_ATRIBUTO, NOMES_TIPO_ARMADURA } from "../../data/textos";
import { golpes } from "../../data/golpes";
import { itens } from "../../data/itens";
import { buscarZona } from "../../data/zonas";
import { receitas } from "../../data/receitas";
import { TAXA_PONTO } from "../../data/constants";

// "espada", "peito, leve"…
export function tipoDoEquipamento(e) {
  return e.slot === "arma" ? NOMES_ARMA[e.tipoArma] : `${NOMES_SLOT[e.slot].toLowerCase()}, ${NOMES_PESO[e.pesoArmadura]}`;
}

// { categoria: "Arma", tipo: "espada" } ou { categoria: "Cabeça", tipo: "armadura leve" }
export function categoriaDoEquipamento(e) {
  if (e.slot === "arma") return { categoria: NOMES_SLOT.arma, tipo: NOMES_ARMA[e.tipoArma] };
  return { categoria: NOMES_SLOT[e.slot], tipo: NOMES_TIPO_ARMADURA[e.pesoArmadura] ?? "armadura" };
}

// Categorias do resumo de retorno e da tela Atividades, na ordem exibida
export const CATEGORIAS_ATIVIDADE = [
  { id: "expedicao", nome: "Expedições", tipos: ["expedicao"] },
  { id: "treino", nome: "Treino", tipos: ["treinoAtributo", "treinoGolpe"] },
  { id: "cozinha", nome: "Cozinha", tipos: ["cozinha"] },
];

// "Treino de Força", "Treino de golpe: Lança de Gelo", "Expedição: Cemitério Antigo",
// "Panela: Ensopado do Coveiro ×3"
export function descreverAtividade(atividade) {
  if (atividade.tipo === "cozinha") {
    return `Panela: ${receitas[atividade.parametros.receitaId].nome} ×${atividade.parametros.porcoes}`;
  }
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
  if (ganho.tipo === "cozinha") {
    if (ganho.porcoes === 0) return "nada ainda";
    return `${ganho.porcoes} ${receitas[ganho.receitaId].nome}`;
  }
  if (ganho.tipo === "expedicao") {
    if (ganho.rolagens === 0) return "nada ainda";
    return `${descreverItens(ganho.itens)} · ${ganho.ouro} ouro · ${ganho.xp} XP`;
  }
  if (ganho.tipo === "treinoGolpe") return ganho.aprendeu ? `aprende ${golpes[ganho.golpeId].nome}` : "nada ainda";
  if (ganho.pontos === 0) return "nada ainda";
  const pontos = ganho.pontos === 1 ? "1 ponto" : `${ganho.pontos} pontos`;
  return `${pontos} de ${NOMES_ATRIBUTO[ganho.atributo]} (+${ganho.pontos * TAXA_PONTO[ganho.atributo]})`;
}

// "Espada Simples de Ferro +3" (aprimoramento aparece no nome, SPEC.md §3.11)
export function nomeDoEquipamento(e) {
  return e.aprimoramento > 0 ? `${e.nome} +${e.aprimoramento}` : e.nome;
}
