import { CONSUMIVEIS_INICIAIS } from "../data/constants";
import { gerarId } from "../engine/rng";
import { criarHeroi, criarCompanheiro, adicionarHeroi } from "../engine/herois";
import { conjuntoComum } from "../engine/itens";
import { criarSaveVazio } from "./formato";
import { registrarNaColecao } from "../engine/colecao";

export function adicionarCompanheiro(save, rng, { excluirClasseId, nivel }) {
  const { heroi, equipamentos } = criarCompanheiro(rng, {
    excluirClasseId,
    nivel,
    nomesEmUso: Object.values(save.herois).map((h) => h.nome),
  });
  return adicionarHeroi(save, heroi, equipamentos);
}

export function adicionarConsumiveisIniciais(save) {
  const itens = { ...save.inventario.itens };
  for (const [itemId, qtd] of Object.entries(CONSUMIVEIS_INICIAIS)) {
    itens[itemId] = (itens[itemId] || 0) + qtd;
  }
  return registrarNaColecao({ ...save, inventario: { ...save.inventario, itens } }, { itens: CONSUMIVEIS_INICIAIS });
}

// Novo jogo: herói escolhido + companheiro de outra classe, ambos com um conjunto Comum,
// e consumíveis iniciais
export function criarNovoJogo({ nomeHeroi, classeId, agora, rng }) {
  const principal = criarHeroi({ id: gerarId(rng), nome: nomeHeroi, classeId });
  const equipamentos = conjuntoComum(rng, classeId, 1);
  for (const item of equipamentos) principal.equipamento[item.slot] = item.id;
  let save = adicionarHeroi(criarSaveVazio(agora), principal, equipamentos);
  save = adicionarCompanheiro(save, rng, { excluirClasseId: classeId, nivel: 1 });
  return adicionarConsumiveisIniciais(save);
}
