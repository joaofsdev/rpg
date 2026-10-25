// Refeições: o que a cozinha produz (SPEC.md §3.7), derivadas das receitas para que nome, efeito e
// duração fiquem num lugar só. preco é a referência para a venda quando a pilha transborda.

import { receitas } from "./receitas";
import { descreverEfeito } from "./textos";

const PRECO_PRATO = {
  ensopado_do_coveiro: 20,
  caldo_de_cogumelo: 30,
  sopa_de_alga: 40,
  ensopado_de_raiz: 60,
  caldo_de_cogumelo_azul: 80,
  pao_de_trigo: 100,
  ensopado_picante: 120,
  pao_de_mel: 140,
  compota_luminosa: 160,
  banquete_do_vazio: 200,
};

export const refeicoes = Object.fromEntries(
  Object.values(receitas).map((r) => [
    r.resultado,
    {
      id: r.resultado,
      nome: r.nome,
      descricao: `${descreverEfeito(r.efeito)} por ${r.duracaoEncontros} encontros.`,
      categoria: "refeicao",
      preco: PRECO_PRATO[r.resultado],
      empilhaAte: 99,
    },
  ]),
);
