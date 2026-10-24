// Simulação de calibração (SPEC.md §4.9). Só para testes: a heurística abaixo
// escolhe ações para medir o balanceamento; não existe batalha automática no jogo.

import { criarBatalha, acoesDisponiveis, preverAcao, aplicarAcao } from "../combate";
import { gerarEncontro, encontroDeChefe } from "../encontros";
import { criarHeroi } from "../herois";
import { conjuntoComum } from "../itens";
import { criarRng, escolher, inteiro } from "../rng";
import { classesHeroi } from "../../data/classesHeroi";
import { PONTOS_POR_NIVEL, ANDARES_MASMORRA, ANDARES_COM_FOGUEIRA } from "../../data/constants";
import { inimigosDoAndar, vidaDepoisDoAndar } from "../masmorra";

function heroiSimulado(rng, classeId, nivel, posicao) {
  const heroi = criarHeroi({ id: `sim-${posicao}`, nome: classeId, classeId, nivel });
  const pontos = PONTOS_POR_NIVEL * (nivel - 1);
  const principal = classesHeroi[classeId].recurso === "mana" ? "magia" : "forca";
  heroi.pontosNivel.vida = Math.floor(pontos / 3);
  heroi.pontosNivel[principal] = Math.floor(pontos / 3);
  heroi.pontosNivel.defesa = pontos - 2 * Math.floor(pontos / 3);
  const equipamentos = conjuntoComum(rng, classeId, nivel);
  for (const item of equipamentos) heroi.equipamento[item.slot] = item.id;
  return { heroi, equipamentos };
}

function grupoSimulado(rng, nivel) {
  const classes = Object.keys(classesHeroi);
  const primeira = escolher(rng, classes);
  const segunda = escolher(rng, classes.filter((c) => c !== primeira));
  const membros = [primeira, segunda].map((c, i) => heroiSimulado(rng, c, nivel, i));
  const equipamentos = {};
  for (const m of membros) for (const item of m.equipamentos) equipamentos[item.id] = item;
  return { herois: membros.map((m) => m.heroi), equipamentos };
}

function valorEsperado(previas) {
  return previas.reduce(
    (soma, p) => soma + ((p.danoMin + p.danoMax) / 2) * p.acertos * (p.chanceAcerto / 100),
    0,
  );
}

function escolherAcao(batalha) {
  const opcoes = acoesDisponiveis(batalha);
  const ativo = batalha.combatentes[batalha.ativoId];
  const disponiveis = opcoes.golpes.filter((g) => g.disponivel);

  const cura = disponiveis.find((g) => g.golpeId === "cancao_de_cura");
  const aliados = Object.values(batalha.combatentes).filter((c) => c.lado === "herois" && !c.nocauteado);
  if (cura && aliados.some((c) => c.hpAtual / c.hpMax < 0.4)) {
    return { tipo: "golpe", golpeId: cura.golpeId };
  }

  let melhor = null;
  for (const opcao of disponiveis) {
    if (opcao.tipoAlvo === "proprio" || opcao.tipoAlvo === "aliado" || opcao.tipoAlvo === "todosAliados") continue;
    const alvos = opcao.tipoAlvo === "inimigo" ? opcao.alvos : [undefined];
    for (const alvoId of alvos) {
      const acao = { tipo: "golpe", golpeId: opcao.golpeId, alvoId };
      const alvoHp = alvoId ? batalha.combatentes[alvoId].hpAtual : 0;
      const valor = valorEsperado(preverAcao(batalha, acao)) - alvoHp * 0.01;
      if (!melhor || valor > melhor.valor) melhor = { acao, valor };
    }
  }
  return melhor ? melhor.acao : { tipo: "defender", ativoId: ativo.id };
}

function jogar(batalha) {
  let atual = batalha;
  for (let i = 0; i < 500 && atual.fase === "escolhaAcao"; i++) {
    atual = aplicarAcao(atual, escolherAcao(atual)).batalha;
  }
  return atual;
}

export function simularEncontros(zona, quantidade, semente = 1) {
  const rng = criarRng(semente);
  let vitorias = 0;
  let rodadas = 0;
  for (let i = 0; i < quantidade; i++) {
    const nivel = inteiro(rng, zona.nivelMin, zona.nivelMax);
    const { herois, equipamentos } = grupoSimulado(rng, nivel);
    const { batalha } = criarBatalha({
      herois,
      equipamentos,
      inimigos: gerarEncontro(zona, nivel, rng),
      origem: { tipo: "zona", zonaId: zona.id },
      semente: Math.floor(rng.proximo() * 2 ** 32),
    });
    const fim = jogar(batalha);
    if (fim.resultado === "vitoria") vitorias++;
    rodadas += fim.rodada;
  }
  return { taxaVitoria: vitorias / quantidade, mediaRodadas: rodadas / quantidade };
}

export function simularChefe(zona, quantidade, semente = 2) {
  const rng = criarRng(semente);
  let vitorias = 0;
  let rodadas = 0;
  for (let i = 0; i < quantidade; i++) {
    const { herois, equipamentos } = grupoSimulado(rng, zona.nivelMax);
    const { batalha } = criarBatalha({
      herois,
      equipamentos,
      inimigos: encontroDeChefe(zona),
      origem: { tipo: "zona", zonaId: zona.id, chefe: true },
      semente: Math.floor(rng.proximo() * 2 ** 32),
    });
    const fim = jogar(batalha);
    if (fim.resultado === "vitoria") vitorias++;
    rodadas += fim.rodada;
  }
  return { taxaVitoria: vitorias / quantidade, mediaRodadas: rodadas / quantidade };
}

// Masmorra completa: grupo no nível máximo da zona, do andar 1 ao chefe, vida carregada entre andares
export function simularMasmorra(zona, quantidade, semente = 3) {
  const rng = criarRng(semente);
  let concluidas = 0;
  const parouNoAndar = {};
  for (let i = 0; i < quantidade; i++) {
    const { herois, equipamentos } = grupoSimulado(rng, zona.nivelMax);
    let vida = {};
    let andar = 1;
    for (; andar <= ANDARES_MASMORRA; andar++) {
      const { batalha } = criarBatalha({
        herois,
        equipamentos,
        inimigos: inimigosDoAndar(zona, andar, rng),
        origem: { tipo: "masmorra", zonaId: zona.id, andar, chefe: andar === ANDARES_MASMORRA },
        semente: Math.floor(rng.proximo() * 2 ** 32),
        vidaInicial: vida,
      });
      const fim = jogar(batalha);
      if (fim.resultado !== "vitoria") break;
      vida = vidaDepoisDoAndar(fim, ANDARES_COM_FOGUEIRA.includes(andar));
    }
    if (andar > ANDARES_MASMORRA) concluidas++;
    else parouNoAndar[andar] = (parouNoAndar[andar] || 0) + 1;
  }
  return { taxaConclusao: concluidas / quantidade, parouNoAndar };
}
