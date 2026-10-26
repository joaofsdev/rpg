// Busca, filtros, ordem e escolhas da tela de Inventário durante a sessão (SPEC.md §7.4).
// Fica só na memória da página: sair do inventário e voltar mantém tudo; recarregar a página,
// trocar de slot ou começar outro jogo no mesmo slot volta ao padrão. Nada vai para o save.

import { FILTROS_PADRAO, ORDEM_PADRAO } from "./seletoresInventario";

let memoria = null;

// Identifica o jogo: o mesmo slot pode receber um jogo novo na mesma sessão
const chaveDoJogo = (slot, save) => `${slot}:${save.criadoEm}`;

export function inventarioPadrao() {
  return { aba: "equipamentos", filtros: FILTROS_PADRAO, ordem: ORDEM_PADRAO, heroiEscolhido: null, selecionadoId: null };
}

export function lembrarInventario(slot, save, estado) {
  memoria = { chave: chaveDoJogo(slot, save), estado };
}

// O que foi lembrado, conferido contra o save atual: herói dispensado ou item vendido desde
// então voltam ao padrão
export function inventarioLembrado(slot, save) {
  if (!memoria || memoria.chave !== chaveDoJogo(slot, save)) return inventarioPadrao();
  const { estado } = memoria;
  const heroiExiste = (id) => Boolean(id && save.herois[id]);
  return {
    ...inventarioPadrao(),
    ...estado,
    filtros: {
      ...FILTROS_PADRAO,
      ...estado.filtros,
      heroiId: heroiExiste(estado.filtros?.heroiId) ? estado.filtros.heroiId : FILTROS_PADRAO.heroiId,
    },
    heroiEscolhido: heroiExiste(estado.heroiEscolhido) ? estado.heroiEscolhido : null,
    selecionadoId: save.inventario.equipamentos[estado.selecionadoId] ? estado.selecionadoId : null,
  };
}

// Só para testes
export function esquecerInventario() {
  memoria = null;
}
