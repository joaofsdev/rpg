// Simulação da economia de ouro (SPEC.md §4.9). Só para testes: mede quanto ouro o jogador
// ganha e gasta zona a zona para calibrar recrutamento, treino e expedições.
//
// Modelo: grupo de 2 heróis começando no nível 1. Em cada zona joga encontros (todos vencidos)
// até o nível médio chegar ao nível máximo da zona, com no mínimo os encontros exigidos para o
// chefe; depois vence o chefe. Ouro dos encontros = ouro dos inimigos + venda (40%) dos
// equipamentos que caem.
//
// Com atividades (padrão), a cada ENCONTROS_POR_DIA encontros termina um dia de jogo:
// 1. contrata recrutas até a reserva cobrir todas as vagas (expedição + treino), se o ouro der;
// 2. cada vaga de expedição faz 1 expedição de 8 h na zona mais avançada que o herói alcança;
// 3. cada vaga de treino restante faz 8 h de treino de atributo, se o ouro der.
// Heróis da reserva ficam no nível dos recrutas (média do grupo − 3). Materiais das expedições
// não são vendidos (servem à ferraria e à cozinha); só o ouro delas entra.

import { zonas } from "../../data/zonas";
import { CHANCE_EQUIPAMENTO_DROP, EQUIPAMENTOS_CHEFE, MULT_XP_CHEFE, NIVEL_MAXIMO } from "../../data/constants";
import { DURACOES_EXPEDICAO_MINUTOS, MINUTOS_POR_ROLAGEM } from "../../data/expedicoes";
import { DURACOES_TREINO_HORAS } from "../../data/treino";
import { gerarEncontro, encontroDeChefe, nivelMedio } from "../encontros";
import { criarHeroi } from "../herois";
import { ganharXp, xpPorInimigo, ouroPorInimigo } from "../progressao";
import { sortearEquipamento, precoVenda } from "../itens";
import { custoDoRecruta, nivelDoRecruta } from "../recrutamento";
import { custoTreinoAtributo, vagasDeTreino } from "../treino";
import { recompensaDaExpedicao, vagasDeExpedicao } from "../expedicoes";
import { criarRng, chance } from "../rng";

export const ENCONTROS_POR_DIA = 15; // hipótese: 2 a 3 sessões curtas por dia (SPEC.md §2)
const LIMITE_ENCONTROS_POR_ZONA = 400;
const ROLAGENS_EXPEDICAO = Math.max(...DURACOES_EXPEDICAO_MINUTOS) / MINUTOS_POR_ROLAGEM;
const HORAS_TREINO = Math.max(...DURACOES_TREINO_HORAS);

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

function zonaDaExpedicao(progresso, nivelHeroi) {
  const abertas = zonas.filter((z) => progresso.zonas[z.id].desbloqueada && z.nivelMin <= nivelHeroi);
  return abertas[abertas.length - 1] ?? zonas[0];
}

// Retorna {
//   zonas: [{ zona, encontros, dias, ouroEncontros, ouroExpedicoes, gastoRecrutas, gastoTreino,
//             ouroPorEncontro, rendaPorEncontro, nivelInicio, nivelFim }],
//   marcos: [{ zonaIndice, encontroNaZona, ouroAcumulado, nivelMedio }] (um por encontro, antes dos gastos),
//   contratacoes: [{ zonaIndice, encontroNaZona, custo }],
// }
export function simularCampanha(semente, { atividades = true } = {}) {
  const rng = criarRng(semente);
  let herois = [criarHeroi({ id: "a", nome: "A", classeId: "cavaleiro" }), criarHeroi({ id: "b", nome: "B", classeId: "mago" })];
  const progresso = { zonas: Object.fromEntries(zonas.map((z, i) => [z.id, { desbloqueada: i === 0, chefeDerrotado: false }])) };
  let ouro = 0;
  let ouroAcumulado = 0; // renda total, sem descontar gastos
  let reserva = 0;
  let encontrosNoDia = 0;
  const porZona = [];
  const marcos = [];
  const contratacoes = [];
  let atual = null;

  const fimDoDia = (zonaIndice, encontroNaZona) => {
    atual.dias += 1;
    const save = { progresso, grupo: ["a", "b"], herois: { a: herois[0], b: herois[1] } };
    const vagasExp = vagasDeExpedicao(save);
    const vagasTreino = vagasDeTreino(save);
    const nivelReserva = nivelDoRecruta(save);
    while (reserva < vagasExp + vagasTreino && ouro >= custoDoRecruta(nivelReserva)) {
      ouro -= custoDoRecruta(nivelReserva);
      atual.gastoRecrutas += custoDoRecruta(nivelReserva);
      contratacoes.push({ zonaIndice, encontroNaZona, custo: custoDoRecruta(nivelReserva) });
      reserva += 1;
    }
    const viajantes = Math.min(reserva, vagasExp);
    const zonaExp = zonaDaExpedicao(progresso, nivelReserva);
    for (let i = 0; i < viajantes; i++) {
      const { ouro: ganho } = recompensaDaExpedicao({ parametros: { zonaId: zonaExp.id }, semente: atual.dias + i }, ROLAGENS_EXPEDICAO);
      ouro += ganho;
      ouroAcumulado += ganho;
      atual.ouroExpedicoes += ganho;
    }
    const custoTreino = custoTreinoAtributo({ nivel: nivelReserva }, HORAS_TREINO);
    for (let i = 0; i < Math.min(reserva - viajantes, vagasTreino) && ouro >= custoTreino; i++) {
      ouro -= custoTreino;
      atual.gastoTreino += custoTreino;
    }
  };

  const jogar = (inimigos, chefe, zonaIndice, encontroNaZona) => {
    const ganho = recompensa(rng, inimigos, chefe);
    herois = herois.map((h) => ganharXp(h, ganho.xp).heroi);
    ouro += ganho.ouro;
    ouroAcumulado += ganho.ouro;
    marcos.push({ zonaIndice, encontroNaZona, ouroAcumulado, nivelMedio: nivelMedio(herois) });
    if (atividades && ++encontrosNoDia >= ENCONTROS_POR_DIA) {
      encontrosNoDia = 0;
      fimDoDia(zonaIndice, encontroNaZona);
    }
    return ganho.ouro;
  };

  zonas.forEach((zona, zonaIndice) => {
    atual = { zona, encontros: 0, dias: 0, ouroEncontros: 0, ouroExpedicoes: 0, gastoRecrutas: 0, gastoTreino: 0 };
    const nivelInicio = nivelMedio(herois);
    const alvo = Math.min(zona.nivelMax, NIVEL_MAXIMO);
    while (
      atual.encontros < LIMITE_ENCONTROS_POR_ZONA &&
      (atual.encontros < zona.encontrosParaChefe || nivelMedio(herois) < alvo)
    ) {
      atual.encontros += 1;
      atual.ouroEncontros += jogar(gerarEncontro(zona, nivelMedio(herois), rng), false, zonaIndice, atual.encontros);
    }
    const ouroChefe = jogar(encontroDeChefe(zona), true, zonaIndice, atual.encontros + 1);
    progresso.zonas[zona.id].chefeDerrotado = true;
    if (zonas[zonaIndice + 1]) progresso.zonas[zonas[zonaIndice + 1].id].desbloqueada = true;
    porZona.push({
      ...atual,
      ouroPorEncontro: atual.ouroEncontros / atual.encontros,
      rendaPorEncontro: (atual.ouroEncontros + atual.ouroExpedicoes) / atual.encontros,
      ouroChefe,
      nivelInicio,
      nivelFim: nivelMedio(herois),
    });
  });

  return { zonas: porZona, marcos, contratacoes };
}
