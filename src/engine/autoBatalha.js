// Auto (SPEC.md §3.13): IA dos heróis e condições de parada. Funções puras e sem RNG: o mesmo
// estado dá sempre a mesma decisão. A IA só escolhe entre as ações legais do motor
// (acoesDisponiveis) e estima o dano com preverAcao, que só conhece as afinidades já reveladas.

import { golpes } from "../data/golpes";
import { buscarZona } from "../data/zonas";
import {
  VIGOR,
  MAX_EQUIPAMENTOS_INVENTARIO,
  AUTO_LIMIAR_CURA_CRITICA,
  AUTO_LIMIAR_CURA_GRUPO,
  AUTO_ALIADOS_CURA_GRUPO,
  AUTO_BONUS_ABATE,
  AUTO_ACERTO_ABATE_SEGURO,
  AUTO_DIVISOR_CUSTO,
  AUTO_VIDA_MINIMA_AUTODANO,
} from "../data/constants";
import { acoesDisponiveis, preverAcao, vidaMaximaDoHeroi } from "./combate";
import { ehAndarDoChefe } from "./masmorra";
import { equipamentosLivres } from "./inventario";
import { efeitosDoGrupo } from "./reliquias";

const fracaoVida = (c) => c.hpAtual / c.hpMax;
const temStatus = (c, statusId) => c.status.some((s) => s.statusId === statusId);
const temEfeito = (golpe, teste) => Boolean(golpe.efeitos?.some(teste));
const curaVida = (golpe) => temEfeito(golpe, (e) => e.tipo === "cura");
const daProtecao = (golpe) => temEfeito(golpe, (e) => e.tipo === "status" && e.statusId === "protecao");
const fereASiMesmo = (golpe) => temEfeito(golpe, (e) => e.tipo === "autoDano");
const causaDano = (golpe) => golpe.categoria !== "suporte" && golpe.poder > 0;

// Alvo único: um por alvo válido; área e próprio: o motor resolve os alvos (alvoId indefinido)
const alvosDaOpcao = (opcao) => (opcao.tipoAlvo === "inimigo" || opcao.tipoAlvo === "aliado" ? opcao.alvos : [undefined]);
const golpe = (golpeId, alvoId) => ({ tipo: "golpe", golpeId, alvoId });

// 1. Cura: um aliado em perigo ou vários feridos; escolhe o que mais cura de verdade
function escolherCura(batalha, opcoes, aliados) {
  const criticos = aliados.filter((c) => fracaoVida(c) < AUTO_LIMIAR_CURA_CRITICA).length;
  const feridos = aliados.filter((c) => fracaoVida(c) < AUTO_LIMIAR_CURA_GRUPO).length;
  if (criticos === 0 && feridos < AUTO_ALIADOS_CURA_GRUPO) return null;
  let melhor = null;
  for (const opcao of opcoes.filter((o) => curaVida(golpes[o.golpeId]))) {
    for (const alvoId of alvosDaOpcao(opcao)) {
      const acao = golpe(opcao.golpeId, alvoId);
      const curado = preverAcao(batalha, acao).reduce((s, p) => s + (p.cura ?? 0), 0);
      if (curado > 0 && (!melhor || curado > melhor.valor)) melhor = { acao, valor: curado };
    }
  }
  return melhor?.acao ?? null;
}

// Aliados vivos e sem Proteção que estão na mira de um golpe telegrafado (intenção visível)
function aliadosAmeacados(batalha, lado) {
  const ameacados = new Set();
  for (const inimigo of Object.values(batalha.combatentes)) {
    if (inimigo.lado === lado || inimigo.nocauteado || !inimigo.intencao?.telegrafado) continue;
    for (const id of inimigo.intencao.alvos) {
      const alvo = batalha.combatentes[id];
      if (alvo && alvo.lado === lado && !alvo.nocauteado && !temStatus(alvo, "protecao")) ameacados.add(id);
    }
  }
  return ameacados;
}

// 2. Proteção contra golpe telegrafado: cobre o maior número de ameaçados (empate: menor custo)
function escolherProtecao(batalha, opcoes, ativo) {
  const ameacados = aliadosAmeacados(batalha, ativo.lado);
  if (ameacados.size === 0) return null;
  let melhor = null;
  for (const opcao of opcoes.filter((o) => daProtecao(golpes[o.golpeId]))) {
    const candidatos =
      opcao.tipoAlvo === "aliado"
        ? opcao.alvos.map((id) => ({ alvoId: id, cobre: [id] }))
        : [{ alvoId: undefined, cobre: opcao.tipoAlvo === "proprio" ? [ativo.id] : opcao.alvos }];
    for (const { alvoId, cobre } of candidatos) {
      const cobertos = cobre.filter((id) => ameacados.has(id)).length;
      if (cobertos === 0) continue;
      if (!melhor || cobertos > melhor.cobertos || (cobertos === melhor.cobertos && opcao.custo < melhor.custo)) {
        melhor = { acao: golpe(opcao.golpeId, alvoId), cobertos, custo: opcao.custo };
      }
    }
  }
  return melhor?.acao ?? null;
}

const danoEsperado = (p) => ((p.danoMin + p.danoMax) / 2) * p.acertos * (p.chanceAcerto / 100);
const abateGarantido = (p, alvo) =>
  (p.chanceAcerto / 100) ** p.acertos >= AUTO_ACERTO_ABATE_SEGURO && p.danoMin * p.acertos >= alvo.hpAtual;

// Dano esperado sem contar o que passaria da vida do alvo, + bônus por abate garantido
export function valorDoAtaque(batalha, acao) {
  return preverAcao(batalha, acao).reduce((soma, p) => {
    if (p.tipo !== "dano") return soma;
    const alvo = batalha.combatentes[p.alvoId];
    const bonus = abateGarantido(p, alvo) ? alvo.hpMax * AUTO_BONUS_ABATE : 0;
    return soma + Math.min(danoEsperado(p), alvo.hpAtual) + bonus;
  }, 0);
}

// Custo em "dano": cada ponto vale o ataque básico ÷ divisor do recurso. Vigor que transbordaria
// no próximo turno não pesa.
function custoDoGolpe(ativo, opcao, valorBasico) {
  if (!opcao.custo || !ativo.recurso) return 0;
  if (ativo.recurso.tipo === "vigor" && ativo.recurso.atual + VIGOR.porTurno > ativo.recurso.max) return 0;
  return opcao.custo * (Math.max(1, valorBasico) / AUTO_DIVISOR_CUSTO[ativo.recurso.tipo]);
}

// 3. Ataque: maior valor menos custo; empates ficam com o primeiro do menu e dos alvos
function escolherAtaque(batalha, opcoes, ativo) {
  const ofensivas = opcoes.filter((o) => {
    const g = golpes[o.golpeId];
    return causaDano(g) && !(fereASiMesmo(g) && fracaoVida(ativo) < AUTO_VIDA_MINIMA_AUTODANO);
  });
  const basico = ofensivas.find((o) => o.basico);
  const valorBasico = basico
    ? Math.max(0, ...alvosDaOpcao(basico).map((alvoId) => valorDoAtaque(batalha, golpe(basico.golpeId, alvoId))))
    : 0;
  let melhor = null;
  for (const opcao of ofensivas) {
    for (const alvoId of alvosDaOpcao(opcao)) {
      const acao = golpe(opcao.golpeId, alvoId);
      const bruto = valorDoAtaque(batalha, acao);
      if (bruto <= 0) continue;
      const valor = bruto - custoDoGolpe(ativo, opcao, valorBasico);
      if (!melhor || valor > melhor.valor) melhor = { acao, valor };
    }
  }
  return melhor?.acao ?? null;
}

// Ação do herói ativo; null quando não é a vez de um herói escolher
export function escolherAcaoAuto(batalha) {
  const ativo = batalha?.combatentes?.[batalha.ativoId];
  if (batalha?.fase !== "escolhaAcao" || !ativo || ativo.lado !== "herois" || ativo.nocauteado) return null;
  const opcoes = acoesDisponiveis(batalha);
  const disponiveis = opcoes.golpes.filter((g) => g.disponivel);
  const aliados = Object.values(batalha.combatentes).filter((c) => c.lado === ativo.lado && !c.nocauteado);
  return (
    escolherCura(batalha, disponiveis, aliados) ??
    escolherProtecao(batalha, disponiveis, ativo) ??
    escolherAtaque(batalha, disponiveis, ativo) ?? { tipo: "defender" }
  );
}

const porcentagem = (fracao) => `${Math.floor(fracao * 100)}%`;

// Vida baixa durante a batalha: o primeiro herói vivo abaixo do limite (0 = desligado)
export function motivoVidaBaixa(batalha, limite) {
  if (!limite || !batalha) return null;
  const baixo = Object.values(batalha.combatentes)
    .filter((c) => c.lado === "herois" && !c.nocauteado)
    .sort((a, b) => a.posicao - b.posicao)
    .find((c) => fracaoVida(c) < limite);
  return baixo ? `Vida baixa: ${baixo.nome} está com ${porcentagem(fracaoVida(baixo))} da vida.` : null;
}

// Antes de começar o próximo encontro. `resumo`: o resultado que acabou de ser mostrado (ou null ao
// retomar na tela da masmorra); `encontrosNoTrecho`: encontros concluídos desde que o Auto foi
// ligado ou retomado; `opcoes`: config do aparelho (autoPararChefe, autoPararInventario,
// autoVidaMinima, autoLimiteEncontros).
// Retorna { motivo, obrigatorio } para parar (obrigatório: derrota ou fim da sequência; senão é uma
// parada opcional, que o jogador pode passar retomando) ou { proximo: { tipo: "zona", zonaId } |
// { tipo: "andar" } }.
export function decidirProximo(save, { resumo, encontrosNoTrecho }, opcoes) {
  if (resumo?.resultado === "derrota") return { motivo: "Derrota: o grupo recuou.", obrigatorio: true };
  if (resumo?.masmorra?.tipo === "concluida") return { motivo: "Masmorra concluída.", obrigatorio: true };
  if (resumo?.masmorra?.tipo === "saiu") return { motivo: "O grupo saiu da masmorra.", obrigatorio: true };
  if (resumo?.origem?.tipo === "zona" && resumo.origem.chefe) {
    return { motivo: "O chefe foi vencido. O Auto não enfrenta chefes: escolha o próximo passo.", obrigatorio: true };
  }

  let proximo = null;
  if (save.masmorraAtual) proximo = { tipo: "andar" };
  else if (resumo?.origem?.tipo === "zona") proximo = { tipo: "zona", zonaId: resumo.origem.zonaId };
  if (!proximo) return { motivo: "Não há um próximo encontro repetível aqui.", obrigatorio: true };

  if (opcoes.autoPararInventario && equipamentosLivres(save).length >= MAX_EQUIPAMENTOS_INVENTARIO) {
    return { motivo: `Inventário cheio (${MAX_EQUIPAMENTOS_INVENTARIO} equipamentos livres).` };
  }
  if (opcoes.autoLimiteEncontros && encontrosNoTrecho >= opcoes.autoLimiteEncontros) {
    return { motivo: `Limite de ${opcoes.autoLimiteEncontros} encontros atingido.` };
  }
  if (opcoes.autoPararChefe) {
    if (proximo.tipo === "andar" && ehAndarDoChefe(save.masmorraAtual.andar)) {
      return { motivo: "O próximo andar é o do chefe." };
    }
    if (proximo.tipo === "zona" && resumo.resultado === "vitoria") {
      const zona = buscarZona(proximo.zonaId);
      const progresso = save.progresso.zonas[proximo.zonaId];
      if (progresso.encontrosVencidos === zona.encontrosParaChefe && !progresso.chefeDerrotado) {
        return { motivo: `O chefe de ${zona.nome} apareceu.` };
      }
    }
  }
  if (opcoes.autoVidaMinima && proximo.tipo === "andar") {
    const efeitos = efeitosDoGrupo(save);
    for (const id of save.grupo) {
      const vida = save.masmorraAtual.vida?.[id];
      if (vida === undefined) continue;
      const heroi = save.herois[id];
      const fracao = vida / vidaMaximaDoHeroi(heroi, save.inventario.equipamentos, efeitos);
      if (fracao < opcoes.autoVidaMinima) {
        return { motivo: `Vida baixa: ${heroi.nome} desceria com ${porcentagem(fracao)} da vida.` };
      }
    }
  }
  return { proximo };
}
