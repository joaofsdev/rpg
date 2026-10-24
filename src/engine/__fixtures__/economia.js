// Simulação da economia de ouro (SPEC.md §4.9). Só para testes: mede quanto ouro o jogador
// ganha zona a zona para calibrar custos de recrutamento e treino.
//
// Modelo: grupo de 2 heróis começando no nível 1. Em cada zona joga encontros (todos vencidos)
// até o nível médio chegar ao nível máximo da zona, com no mínimo os encontros exigidos para o
// chefe; depois vence o chefe. Ouro = ouro dos inimigos + venda (40%) dos equipamentos que caem.
// Gastos (consumíveis, loja) não entram: a meta compara custos com a renda.

import { zonas } from "../../data/zonas";
import { CHANCE_EQUIPAMENTO_DROP, EQUIPAMENTOS_CHEFE, MULT_XP_CHEFE, NIVEL_MAXIMO } from "../../data/constants";
import { gerarEncontro, encontroDeChefe, nivelMedio } from "../encontros";
import { criarHeroi } from "../herois";
import { ganharXp, xpPorInimigo, ouroPorInimigo } from "../progressao";
import { sortearEquipamento, precoVenda } from "../itens";
import { criarRng, chance } from "../rng";

const LIMITE_ENCONTROS_POR_ZONA = 400;

function recompensa(rng, inimigos, chefe) {
  let xp = 0;
  let ouro = 0;
  for (const { nivel } of inimigos) {
    xp += xpPorInimigo(nivel) * (chefe ? MULT_XP_CHEFE : 1);
    ouro += ouroPorInimigo(nivel, chefe);
    const quedas = chefe ? EQUIPAMENTOS_CHEFE : chance(rng, CHANCE_EQUIPAMENTO_DROP) ? 1 : 0;
    for (let i = 0; i < quedas; i++) ouro += precoVenda(sortearEquipamento(rng, { nivel, chefe }));
  }
  return { xp, ouro };
}

// Retorna { zonas: [{ zona, encontros, ouro, ouroPorEncontro, nivelInicio, nivelFim }],
//           marcos: [{ zonaIndice, encontroNaZona, ouroAcumulado, nivelMedio }] } (um marco por encontro)
export function simularCampanha(semente) {
  const rng = criarRng(semente);
  let herois = [criarHeroi({ id: "a", nome: "A", classeId: "cavaleiro" }), criarHeroi({ id: "b", nome: "B", classeId: "mago" })];
  let ouroAcumulado = 0;
  const porZona = [];
  const marcos = [];

  const jogar = (inimigos, chefe, zonaIndice, encontroNaZona) => {
    const ganho = recompensa(rng, inimigos, chefe);
    herois = herois.map((h) => ganharXp(h, ganho.xp).heroi);
    ouroAcumulado += ganho.ouro;
    marcos.push({ zonaIndice, encontroNaZona, ouroAcumulado, nivelMedio: nivelMedio(herois) });
    return ganho.ouro;
  };

  zonas.forEach((zona, zonaIndice) => {
    const nivelInicio = nivelMedio(herois);
    const alvo = Math.min(zona.nivelMax, NIVEL_MAXIMO);
    let encontros = 0;
    let ouroEncontros = 0;
    while (
      encontros < LIMITE_ENCONTROS_POR_ZONA &&
      (encontros < zona.encontrosParaChefe || nivelMedio(herois) < alvo)
    ) {
      encontros += 1;
      ouroEncontros += jogar(gerarEncontro(zona, nivelMedio(herois), rng), false, zonaIndice, encontros);
    }
    const ouroChefe = jogar(encontroDeChefe(zona), true, zonaIndice, encontros + 1);
    porZona.push({
      zona,
      encontros,
      ouro: ouroEncontros + ouroChefe,
      ouroPorEncontro: ouroEncontros / encontros,
      nivelInicio,
      nivelFim: nivelMedio(herois),
    });
  });

  return { zonas: porZona, marcos };
}
