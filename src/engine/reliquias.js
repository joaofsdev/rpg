// Relíquias (SPEC.md §3.11). Funções puras.

import { reliquias, reliquiaDaZona, CHANCE_RELIQUIA_REVANCHE } from "../data/reliquias";
import { chance } from "./rng";
import { temReliquia, adicionarReliquia } from "./colecao";
import { efeitoDaRefeicao } from "./cozinha";

export function reliquiasDoSave(save) {
  return save.colecao.reliquias.map((id) => reliquias[id]).filter(Boolean);
}

// Tudo o que vale para o grupo em batalha: relíquias que o jogador tem + refeição ativa
export function efeitosDoGrupo(save) {
  return [...reliquiasDoSave(save).map((r) => r.efeito), efeitoDaRefeicao(save)].filter(Boolean);
}

// Vitória sobre o chefe de uma zona: a relíquia é garantida na primeira vitória e, nas revanches,
// cai com CHANCE_RELIQUIA_REVANCHE enquanto o jogador não a tiver. `save` é o de antes da batalha.
export function reliquiaDaVitoria(save, batalha, rng) {
  const { origem } = batalha;
  if (batalha.resultado !== "vitoria" || origem?.tipo !== "zona" || !origem.chefe) return null;
  const reliquia = reliquiaDaZona(origem.zonaId);
  if (!reliquia || temReliquia(save, reliquia.id)) return null;
  const primeiraVitoria = !save.progresso.zonas[origem.zonaId]?.chefeDerrotado;
  return primeiraVitoria || chance(rng, CHANCE_RELIQUIA_REVANCHE) ? reliquia.id : null;
}

// Migrações: chefes vencidos antes de as relíquias existirem já contam como primeira vitória
export function comReliquiasDosChefesVencidos(save) {
  let atual = save;
  for (const [zonaId, progresso] of Object.entries(save.progresso.zonas)) {
    const reliquia = reliquiaDaZona(zonaId);
    if (progresso.chefeDerrotado && reliquia) atual = adicionarReliquia(atual, reliquia.id);
  }
  return atual;
}
