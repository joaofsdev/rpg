// Combate como máquina de estados (SPEC.md §3.1 e §6.2).
//
// API pública (funções puras: nunca alteram a batalha recebida):
//   criarBatalha(params)          → { batalha, eventos, inicial }
//   acoesDisponiveis(batalha)     → opções do herói ativo, ou null
//   alvosParaItem(batalha, itemId)
//   preverAcao(batalha, acao)     → prévia sem RNG
//   aplicarAcao(batalha, acao)    → { batalha, eventos, erro? }
//
// O estado devolvido é sempre estável: fase "escolhaAcao" (esperando um herói) ou "fim".
// Internamente cada chamada trabalha sobre um clone (rascunho) que é modificado no lugar.

import { classesHeroi } from "../data/classesHeroi";
import { golpes } from "../data/golpes";
import { inimigos } from "../data/inimigos";
import { itens } from "../data/itens";
import { status as dadosStatus } from "../data/status";
import { elementoPorArma, ELEMENTO_SEM_ARMA } from "../data/equipamentos";
import {
  VIGOR,
  MANA,
  MULT_DEFENDER,
  MAX_LOG_BATALHA,
  CHANCE_EQUIPAMENTO_DROP,
  EQUIPAMENTOS_CHEFE,
  MULT_XP_CHEFE,
  MULT_DROP_MARCO,
} from "../data/constants";
import { criarRng, chance, escolher, gerarId } from "./rng";
import { calcularAtributosHeroi, calcularAtributosInimigo, aumentarPercentual } from "./atributos";
import { somaDosEfeitos, bonusPorElemento } from "./efeitos";
import {
  calcularDano,
  faixaDano,
  sortearVariacao,
  afinidadeContra,
  chanceAcerto,
  chanceCritico,
} from "./dano";
import {
  aplicarStatus,
  removerStatus,
  processarInicioTurno,
  processarFimTurno,
  temStatus,
  atributoEfetivo,
  velocidadeEfetiva,
  multDanoCausado,
  multDanoRecebido,
} from "./status";
import { calcularOrdem } from "./turnos";
import { escolherIntencao, resolverAlvosIa } from "./ia";
import { xpPorInimigo, ouroPorInimigo } from "./progressao";
import { sortearEquipamento } from "./itens";

const LIMITE_PASSOS = 1000;
const ALVOS_UNICOS = ["inimigo", "aliado"];

// ---------------------------------------------------------------------------
// Criação
// ---------------------------------------------------------------------------

// Efeitos do grupo (refeição e relíquias, SPEC.md §3.7 e §3.11): multiplicam atributos no início
// da batalha; efeitos do mesmo tipo se somam
const ATRIBUTOS_DO_EFEITO = { vidaMax: ["vida"], ataque: ["forca", "magia"], defesa: ["defesa", "resistencia"] };

function atributosComEfeitos(atributos, efeitos) {
  const resultado = { ...atributos };
  for (const [tipo, afetados] of Object.entries(ATRIBUTOS_DO_EFEITO)) {
    const fracao = somaDosEfeitos(efeitos, tipo);
    if (fracao === 0) continue;
    for (const a of afetados) resultado[a] = aumentarPercentual(atributos[a], fracao);
  }
  return resultado;
}

function recursoInicial(classe, manaMax, efeitos) {
  const extra = somaDosEfeitos(efeitos, "recursoInicial");
  if (classe.recurso === "vigor") return { tipo: "vigor", atual: Math.min(VIGOR.max, VIGOR.inicial + extra), max: VIGOR.max };
  return { tipo: "mana", atual: manaMax + extra, max: manaMax + extra };
}

function criarCombatenteHeroi(heroi, posicao, equipamentos, vidaInicial, efeitos) {
  const classe = classesHeroi[heroi.classeId];
  const { manaMax, ...base } = calcularAtributosHeroi(heroi, equipamentos);
  const atributos = atributosComEfeitos(base, efeitos);
  const arma = heroi.equipamento.arma ? equipamentos[heroi.equipamento.arma] : null;
  return {
    id: `h${posicao}`,
    lado: "herois",
    refId: heroi.id,
    classeId: heroi.classeId,
    nome: heroi.nome,
    nivel: heroi.nivel,
    posicao,
    chefe: false,
    atributos,
    hpMax: atributos.vida,
    hpAtual: vidaInicial === undefined ? atributos.vida : Math.max(0, Math.min(atributos.vida, vidaInicial)),
    recurso: recursoInicial(classe, manaMax, efeitos),
    golpes: [...heroi.golpesEquipados],
    golpeBasico: classe.golpeBasico,
    elementoBasico: arma ? elementoPorArma[arma.tipoArma] : ELEMENTO_SEM_ARMA,
    status: [],
    defendendo: false,
    nocauteado: vidaInicial !== undefined && vidaInicial <= 0,
    causouDano: false,
    bonusElemento: bonusPorElemento(efeitos), // relíquias: dano causado por elemento
  };
}

function criarCombatenteInimigo({ id, nivel }, posicao) {
  const dados = inimigos[id];
  const atributos = calcularAtributosInimigo(dados, nivel);
  return {
    id: `i${posicao}`,
    lado: "inimigos",
    refId: id,
    nome: dados.nome,
    nivel,
    posicao,
    chefe: Boolean(dados.chefe),
    atributos,
    hpMax: atributos.vida,
    hpAtual: atributos.vida,
    recurso: null,
    golpes: [...dados.golpes],
    status: [],
    defendendo: false,
    nocauteado: false,
    intencao: null,
    cicloIa: 0,
    turnosAgidos: 0,
    historicoIa: {},
  };
}

// herois: Heroi[] na ordem do grupo; inimigos: [{ id, nivel }];
// afinidadesConhecidas: { [inimigoId]: [elemento] } vindo do bestiário
// bonusDrop: ids de inimigos com o marco de derrotas que aumenta a chance de materiais
// vidaInicial: { [heroiId]: hpAtual } para heróis que não começam com vida cheia (masmorra)
export function criarBatalha({
  herois,
  equipamentos = {},
  inimigos: listaInimigos,
  origem,
  semente,
  afinidadesConhecidas = {},
  bonusDrop = [],
  vidaInicial = {},
  efeitos = [], // [{ tipo, valor, elemento? }] da refeição ativa e das relíquias
}) {
  const rng = criarRng(semente);
  const combatentes = {};
  herois.forEach((heroi, i) => {
    const c = criarCombatenteHeroi(heroi, i, equipamentos, vidaInicial[heroi.id], efeitos);
    combatentes[c.id] = c;
  });
  listaInimigos.forEach((inimigo, i) => {
    const c = criarCombatenteInimigo(inimigo, i);
    combatentes[c.id] = c;
  });

  const batalha = {
    id: gerarId(rng),
    semente: 0,
    origem,
    fase: "escolhaAcao",
    rodada: 1,
    turnoGlobal: 0,
    ordem: calcularOrdem(combatentes),
    indiceTurno: 0,
    ativoId: null,
    combatentes,
    afinidadesConhecidas: structuredClone(afinidadesConhecidas),
    bonusDrop: [...bonusDrop],
    recompensas: null,
    log: [],
    resultado: null,
  };

  const eventos = [{ tipo: "rodadaIniciada", rodada: 1, ordem: [...batalha.ordem] }];
  for (const c of lado(batalha, "inimigos")) definirIntencao(batalha, c, rng, eventos, 1);
  // Estado antes dos primeiros turnos, para a interface animar os eventos iniciais
  const inicial = structuredClone(batalha);
  avancar(batalha, rng, eventos);
  return { ...concluirChamada(batalha, rng, eventos), inicial };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

function lado(batalha, nome) {
  return Object.values(batalha.combatentes)
    .filter((c) => c.lado === nome)
    .sort((a, b) => a.posicao - b.posicao);
}

function vivos(batalha, nome) {
  return lado(batalha, nome).filter((c) => !c.nocauteado);
}

function oposto(nome) {
  return nome === "herois" ? "inimigos" : "herois";
}

function temChefe(batalha) {
  return lado(batalha, "inimigos").some((c) => c.chefe);
}

function passivoDe(combatente) {
  return combatente.lado === "herois" ? classesHeroi[combatente.classeId].passivo : null;
}

function alvosValidos(batalha, atacante, tipoAlvo) {
  switch (tipoAlvo) {
    case "inimigo":
    case "todosInimigos":
      return vivos(batalha, oposto(atacante.lado)).map((c) => c.id);
    case "aliado":
    case "todosAliados":
      return vivos(batalha, atacante.lado).map((c) => c.id);
    case "proprio":
      return [atacante.id];
    default:
      return [];
  }
}

function alvosDaAcao(batalha, atacante, tipoAlvo, alvoId) {
  return ALVOS_UNICOS.includes(tipoAlvo) ? [alvoId] : alvosValidos(batalha, atacante, tipoAlvo);
}

export function alvosParaItem(batalha, itemId) {
  const item = itens[itemId];
  const ativo = batalha.combatentes[batalha.ativoId];
  if (!item?.usoEmBatalha || !ativo) return [];
  if (item.efeito.tipo === "reviver") {
    return lado(batalha, ativo.lado)
      .filter((c) => c.nocauteado)
      .map((c) => c.id);
  }
  return vivos(batalha, ativo.lado)
    .filter((c) => item.efeito.tipo !== "restaurarRecurso" || c.recurso?.tipo === item.efeito.recurso)
    .map((c) => c.id);
}

export function acoesDisponiveis(batalha) {
  if (batalha.fase !== "escolhaAcao") return null;
  const ativo = batalha.combatentes[batalha.ativoId];
  const chefe = temChefe(batalha);

  const opcoes = [...ativo.golpes, ativo.golpeBasico].map((golpeId) => {
    const golpe = golpes[golpeId];
    const recursoSuficiente = !ativo.recurso || ativo.recurso.atual >= golpe.custo;
    const alvos = alvosValidos(batalha, ativo, golpe.alvo);
    let motivo = null;
    if (!recursoSuficiente) motivo = `Requer ${golpe.custo} de ${ativo.recurso.tipo}`;
    else if (alvos.length === 0) motivo = "Sem alvos válidos";
    return {
      golpeId,
      basico: golpeId === ativo.golpeBasico,
      custo: golpe.custo,
      recurso: ativo.recurso?.tipo ?? null,
      tipoAlvo: golpe.alvo,
      alvos,
      disponivel: motivo === null,
      motivo,
    };
  });

  return {
    ativoId: ativo.id,
    golpes: opcoes,
    defender: { disponivel: true },
    fugir: {
      disponivel: !chefe,
      motivo: chefe ? "Não é possível fugir de um chefe" : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Cálculos de dano
// ---------------------------------------------------------------------------

function elementoDoGolpe(atacante, golpe) {
  return golpe.elemento === "arma" ? atacante.elementoBasico : golpe.elemento;
}

function afinidadeDoAlvo(alvo, elemento) {
  return alvo.lado === "inimigos" ? afinidadeContra(inimigos[alvo.refId], elemento) : "neutro";
}

function ataqueDe(atacante, golpe) {
  const atributo = golpe.categoria === "magico" ? "magia" : "forca";
  let valor = atributoEfetivo(atacante, atributo);
  const passivo = passivoDe(atacante);
  if (passivo?.tipo === "furia" && atributo === "forca") {
    const perdido = 1 - atacante.hpAtual / atacante.hpMax;
    valor += passivo.valor * Math.floor(perdido / passivo.intervalo + 1e-9);
  }
  return valor;
}

function defesaDe(alvo, golpe) {
  return atributoEfetivo(alvo, golpe.categoria === "magico" ? "resistencia" : "defesa");
}

function modificadorDano(atacante, alvo, golpe) {
  let mult = multDanoCausado(atacante);
  const passivo = passivoDe(atacante);
  if (passivo?.tipo === "danoAlto" && golpe.poder >= passivo.limiar) mult *= 1 + passivo.valor;
  if (passivo?.tipo === "primeiroGolpe" && !atacante.causouDano) mult *= 1 + passivo.valor;
  mult *= 1 + (atacante.bonusElemento?.[elementoDoGolpe(atacante, golpe)] || 0);
  if (alvo.defendendo) mult *= MULT_DEFENDER;
  mult *= multDanoRecebido(alvo);
  const passivoAlvo = passivoDe(alvo);
  if (passivoAlvo?.tipo === "reducaoDano") mult *= 1 - passivoAlvo.valor;
  return mult;
}

function chanceCriticoDe(atacante, golpe) {
  const passivo = passivoDe(atacante);
  const bonusClasse = passivo?.tipo === "critico" ? passivo.valor : 0;
  return chanceCritico((golpe.bonusCritico || 0) + bonusClasse);
}

function chanceAcertoDe(atacante, alvo, golpe) {
  return chanceAcerto({
    precisao: golpe.precisao,
    velAtacante: velocidadeEfetiva(atacante),
    velAlvo: velocidadeEfetiva(alvo),
    evasao: temStatus(alvo, "evasao"),
  });
}

export function preverAcao(batalha, acao) {
  if (batalha.fase !== "escolhaAcao" || acao.tipo !== "golpe") return [];
  const ativo = batalha.combatentes[batalha.ativoId];
  const golpe = golpes[acao.golpeId];
  const alvos = alvosDaAcao(batalha, ativo, golpe.alvo, acao.alvoId).filter(
    (id) => batalha.combatentes[id] && !batalha.combatentes[id].nocauteado,
  );

  return alvos.map((alvoId) => {
    const alvo = batalha.combatentes[alvoId];
    if (golpe.categoria === "suporte") {
      const cura = golpe.efeitos?.find((e) => e.tipo === "cura");
      return {
        alvoId,
        tipo: "suporte",
        cura: cura ? Math.min(alvo.hpMax - alvo.hpAtual, Math.floor(alvo.hpMax * cura.percentual)) : null,
      };
    }
    const elemento = elementoDoGolpe(ativo, golpe);
    const conhecida =
      alvo.lado !== "inimigos" ||
      (batalha.afinidadesConhecidas[alvo.refId] || []).includes(elemento);
    const afinidadeReal = afinidadeDoAlvo(alvo, elemento);
    const faixa = faixaDano({
      poder: golpe.poder,
      ataque: ataqueDe(ativo, golpe),
      defesa: defesaDe(alvo, golpe),
      afinidade: conhecida ? afinidadeReal : "neutro",
      modificador: modificadorDano(ativo, alvo, golpe),
    });
    return {
      alvoId,
      tipo: "dano",
      danoMin: faixa.min,
      danoMax: faixa.max,
      acertos: golpe.acertos || 1,
      chanceAcerto: chanceAcertoDe(ativo, alvo, golpe),
      elemento,
      afinidade: conhecida ? afinidadeReal : "desconhecida",
    };
  });
}

// ---------------------------------------------------------------------------
// Efeitos (operam no rascunho)
// ---------------------------------------------------------------------------

function nocautear(combatente, eventos) {
  combatente.nocauteado = true;
  combatente.status = [];
  combatente.defendendo = false;
  if (combatente.lado === "inimigos") combatente.intencao = null;
  eventos.push({ tipo: "nocaute", alvoId: combatente.id });
}

function curar(alvo, valor, eventos, origemId) {
  const real = Math.max(0, Math.min(alvo.hpMax - alvo.hpAtual, valor));
  alvo.hpAtual += real;
  eventos.push({ tipo: "cura", origemId, alvoId: alvo.id, valor: real, hpDepois: alvo.hpAtual });
}

function ganharRecurso(combatente, valor, eventos, origemId) {
  if (!combatente.recurso) return;
  const antes = combatente.recurso.atual;
  combatente.recurso.atual = Math.min(combatente.recurso.max, antes + valor);
  const ganho = combatente.recurso.atual - antes;
  if (ganho !== 0) {
    eventos.push({
      tipo: "recurso",
      origemId,
      alvoId: combatente.id,
      valor: ganho,
      atual: combatente.recurso.atual,
    });
  }
}

function aplicarEfeitoStatus(batalha, origem, alvo, efeito, rng, eventos) {
  let probabilidade = efeito.chance ?? 1;
  if (efeito.statusId === "atordoado" && alvo.chefe) {
    probabilidade *= dadosStatus.atordoado.multChanceChefe;
  }
  if (!chance(rng, probabilidade)) return;

  const normalizado =
    efeito.tipo === "modificador"
      ? { statusId: "modificador", atributo: efeito.atributo, valor: efeito.valor, turnos: efeito.turnos }
      : efeito;
  const imunidades = alvo.lado === "inimigos" ? inimigos[alvo.refId].imunidades : [];
  const resultado = aplicarStatus(alvo, normalizado, batalha.turnoGlobal, imunidades);

  if (resultado.aplicado) {
    eventos.push({
      tipo: "statusAplicado",
      origemId: origem.id,
      alvoId: alvo.id,
      statusId: normalizado.statusId,
      turnos: normalizado.turnos ?? dadosStatus[normalizado.statusId].turnos,
      atributo: normalizado.atributo,
      valor: normalizado.valor,
    });
  } else {
    eventos.push({
      tipo: "statusResistido",
      alvoId: alvo.id,
      statusId: normalizado.statusId,
      motivo: resultado.motivo,
    });
  }
}

function registrarAfinidade(batalha, atacante, alvo, elemento, afinidade, eventos) {
  if (atacante.lado !== "herois" || alvo.lado !== "inimigos" || !elemento) return;
  const conhecidas = batalha.afinidadesConhecidas[alvo.refId] || [];
  if (conhecidas.includes(elemento)) return;
  batalha.afinidadesConhecidas[alvo.refId] = [...conhecidas, elemento];
  eventos.push({
    tipo: "afinidadeDescoberta",
    alvoId: alvo.id,
    inimigoId: alvo.refId,
    elemento,
    afinidade,
  });
}

// Um acerto de um golpe de dano. Retorna true se acertou.
function resolverAcerto(batalha, atacante, alvo, golpe, rng, eventos) {
  const probabilidade = chanceAcertoDe(atacante, alvo, golpe);
  if (rng.proximo() * 100 >= probabilidade) {
    eventos.push({ tipo: "errou", origemId: atacante.id, alvoId: alvo.id });
    return false;
  }

  const critico = chance(rng, chanceCriticoDe(atacante, golpe));
  const elemento = elementoDoGolpe(atacante, golpe);
  const afinidade = afinidadeDoAlvo(alvo, elemento);
  const dano = calcularDano({
    poder: golpe.poder,
    ataque: ataqueDe(atacante, golpe),
    defesa: defesaDe(alvo, golpe),
    afinidade,
    critico,
    variacao: sortearVariacao(rng),
    modificador: modificadorDano(atacante, alvo, golpe),
  });

  alvo.hpAtual = Math.max(0, alvo.hpAtual - dano);
  if (dano > 0) atacante.causouDano = true;
  eventos.push({
    tipo: "dano",
    origemId: atacante.id,
    alvoId: alvo.id,
    valor: dano,
    hpDepois: alvo.hpAtual,
    elemento,
    afinidade,
    critico,
  });
  registrarAfinidade(batalha, atacante, alvo, elemento, afinidade, eventos);
  if (alvo.hpAtual === 0) nocautear(alvo, eventos);
  return true;
}

function executarGolpe(batalha, atacante, golpe, alvoIds, rng, eventos) {
  eventos.push({
    tipo: "golpeUsado",
    origemId: atacante.id,
    golpeId: golpe.id,
    alvos: [...alvoIds],
  });

  if (atacante.recurso && golpe.custo > 0) {
    atacante.recurso.atual -= golpe.custo;
    eventos.push({
      tipo: "recurso",
      origemId: atacante.id,
      alvoId: atacante.id,
      valor: -golpe.custo,
      atual: atacante.recurso.atual,
    });
  }

  const efeitos = golpe.efeitos || [];
  for (const efeito of efeitos.filter((e) => e.tipo === "autoDano")) {
    const valor = Math.floor(atacante.hpMax * efeito.percentual);
    atacante.hpAtual = Math.max(1, atacante.hpAtual - valor);
    eventos.push({
      tipo: "dano",
      origemId: atacante.id,
      alvoId: atacante.id,
      valor,
      hpDepois: atacante.hpAtual,
      autoDano: true,
    });
  }

  const efeitosStatus = efeitos.filter((e) => e.tipo === "status" || e.tipo === "modificador");

  for (const alvoId of alvoIds) {
    const alvo = batalha.combatentes[alvoId];
    if (!alvo || alvo.nocauteado) continue;

    if (golpe.categoria === "suporte") {
      for (const efeito of efeitos) {
        if (efeito.tipo === "cura") {
          curar(alvo, Math.floor(alvo.hpMax * efeito.percentual), eventos, atacante.id);
        }
      }
      for (const efeito of efeitosStatus) {
        aplicarEfeitoStatus(batalha, atacante, alvo, efeito, rng, eventos);
      }
      continue;
    }

    let acertou = false;
    for (let i = 0; i < (golpe.acertos || 1); i++) {
      if (alvo.nocauteado) break;
      if (resolverAcerto(batalha, atacante, alvo, golpe, rng, eventos)) acertou = true;
    }
    if (acertou && !alvo.nocauteado) {
      for (const efeito of efeitosStatus) {
        aplicarEfeitoStatus(batalha, atacante, alvo, efeito, rng, eventos);
      }
    }
  }

  for (const efeito of efeitos.filter((e) => e.tipo === "recurso")) {
    if (atacante.recurso?.tipo === efeito.recurso) {
      ganharRecurso(atacante, efeito.valor, eventos, atacante.id);
    }
  }
}

function usarItem(batalha, ativo, { itemId, alvoId }, eventos) {
  const item = itens[itemId];
  const alvo = batalha.combatentes[alvoId];
  eventos.push({ tipo: "itemUsado", origemId: ativo.id, alvoId, itemId });
  const { efeito } = item;
  if (efeito.tipo === "curaPercentual") {
    curar(alvo, Math.floor(alvo.hpMax * efeito.valor), eventos, ativo.id);
  } else if (efeito.tipo === "restaurarRecurso") {
    ganharRecurso(alvo, efeito.valor, eventos, ativo.id);
  } else if (efeito.tipo === "removerStatus") {
    for (const statusId of removerStatus(alvo, efeito.status)) {
      eventos.push({ tipo: "statusRemovido", alvoId, statusId });
    }
  } else if (efeito.tipo === "reviver") {
    alvo.nocauteado = false;
    alvo.hpAtual = Math.max(1, Math.floor(alvo.hpMax * efeito.valor));
    eventos.push({ tipo: "reviveu", origemId: ativo.id, alvoId, hpDepois: alvo.hpAtual });
  }
}

function defender(ativo, eventos) {
  ativo.defendendo = true;
  eventos.push({ tipo: "defender", origemId: ativo.id });
  if (ativo.recurso?.tipo === "vigor") ganharRecurso(ativo, VIGOR.extraDefender, eventos, ativo.id);
  if (ativo.recurso?.tipo === "mana") {
    ganharRecurso(ativo, Math.floor(ativo.recurso.max * MANA.extraDefender), eventos, ativo.id);
  }
}

function regenerarRecurso(combatente, eventos) {
  if (!combatente.recurso) return;
  const valor =
    combatente.recurso.tipo === "vigor"
      ? VIGOR.porTurno
      : Math.max(1, Math.floor(combatente.recurso.max * MANA.regenPorTurno));
  ganharRecurso(combatente, valor, eventos, combatente.id);
}

// ---------------------------------------------------------------------------
// Fluxo de turnos
// ---------------------------------------------------------------------------

function definirIntencao(batalha, inimigo, rng, eventos, rodadaDaAcao) {
  if (vivos(batalha, "herois").length === 0) return;
  inimigo.intencao = escolherIntencao(batalha, inimigo, rng, rodadaDaAcao);
  eventos.push({
    tipo: "intencao",
    origemId: inimigo.id,
    golpeId: inimigo.intencao.golpeId,
    alvos: [...inimigo.intencao.alvos],
    telegrafado: inimigo.intencao.telegrafado,
  });
}

function executarTurnoInimigo(batalha, inimigo, rng, eventos) {
  const intencao = inimigo.intencao ?? escolherIntencao(batalha, inimigo, rng, batalha.rodada);
  const golpe = golpes[intencao.golpeId];

  let alvos = intencao.alvos;
  if (ALVOS_UNICOS.includes(golpe.alvo)) {
    const atual = batalha.combatentes[alvos[0]];
    const provocador = vivos(batalha, oposto(inimigo.lado)).find((c) =>
      temStatus(c, "provocacao"),
    );
    const invalido = !atual || atual.nocauteado;
    const ignoraProvocacao = golpe.alvo === "inimigo" && provocador && provocador.id !== atual?.id;
    if (invalido || ignoraProvocacao) alvos = resolverAlvosIa(batalha, inimigo, golpe, rng);
  } else {
    alvos = resolverAlvosIa(batalha, inimigo, golpe, rng);
  }

  executarGolpe(batalha, inimigo, golpe, alvos, rng, eventos);
  inimigo.turnosAgidos += 1;
  inimigo.historicoIa[golpe.id] = inimigo.turnosAgidos;
  if (intencao.origem === "padrao") inimigo.cicloIa += 1;
  inimigo.intencao = null;
  if (!inimigo.nocauteado) definirIntencao(batalha, inimigo, rng, eventos, batalha.rodada + 1);
}

function encerrarTurno(batalha, combatente, rng, eventos) {
  for (const statusId of processarFimTurno(combatente, batalha.turnoGlobal)) {
    eventos.push({ tipo: "statusRemovido", alvoId: combatente.id, statusId });
  }

  const passivo = passivoDe(combatente);
  if (
    passivo?.tipo === "restaurarRecursoAliado" &&
    !combatente.nocauteado &&
    chance(rng, passivo.chance)
  ) {
    const candidatos = vivos(batalha, combatente.lado).filter(
      (c) => c.id !== combatente.id && c.recurso && c.recurso.atual < c.recurso.max,
    );
    if (candidatos.length > 0) {
      ganharRecurso(escolher(rng, candidatos), passivo.valor, eventos, combatente.id);
    }
  }
}

function calcularRecompensas(batalha, rng) {
  const classeIds = lado(batalha, "herois").map((c) => c.classeId);
  const recompensas = { xp: 0, ouro: 0, itens: {}, equipamentos: [], dropsPorInimigo: {} };

  for (const inimigo of lado(batalha, "inimigos")) {
    const dados = inimigos[inimigo.refId];
    recompensas.xp += xpPorInimigo(inimigo.nivel) * (inimigo.chefe ? MULT_XP_CHEFE : 1);
    recompensas.ouro += ouroPorInimigo(inimigo.nivel, inimigo.chefe);

    const comBonus = batalha.bonusDrop?.includes(inimigo.refId);
    const chefeDeMasmorra = inimigo.chefe && batalha.origem?.tipo === "masmorra";
    // Chefe de masmorra: materiais raros = tabela de drops rolada duas vezes
    const rolagens = chefeDeMasmorra ? [...(dados.drops || []), ...(dados.drops || [])] : dados.drops || [];
    for (const drop of rolagens) {
      const material = ["material", "ingrediente"].includes(itens[drop.itemId].categoria);
      const probabilidade = comBonus && material ? drop.chance * MULT_DROP_MARCO : drop.chance;
      if (chance(rng, probabilidade)) {
        recompensas.itens[drop.itemId] = (recompensas.itens[drop.itemId] || 0) + 1;
        const vistos = (recompensas.dropsPorInimigo[inimigo.refId] ||= []);
        if (!vistos.includes(drop.itemId)) vistos.push(drop.itemId);
      }
    }

    if (chefeDeMasmorra) {
      recompensas.equipamentos.push(
        sortearEquipamento(rng, {
          nivel: inimigo.nivel,
          chefe: true,
          classeIds,
          raridadeMin: "Lendário",
          sempreCompativel: true,
        }),
      );
    } else if (inimigo.chefe) {
      for (let i = 0; i < EQUIPAMENTOS_CHEFE; i++) {
        recompensas.equipamentos.push(
          sortearEquipamento(rng, {
            nivel: inimigo.nivel,
            chefe: true,
            classeIds,
            raridadeMin: i === 0 ? "Raro" : undefined,
          }),
        );
      }
    } else if (chance(rng, CHANCE_EQUIPAMENTO_DROP)) {
      recompensas.equipamentos.push(sortearEquipamento(rng, { nivel: inimigo.nivel, classeIds }));
    }
  }
  return recompensas;
}

function encerrarBatalha(batalha, rng, eventos) {
  batalha.fase = "fim";
  batalha.ativoId = null;
  batalha.recompensas =
    batalha.resultado === "vitoria"
      ? calcularRecompensas(batalha, rng)
      : { xp: 0, ouro: 0, itens: {}, equipamentos: [], dropsPorInimigo: {} };
  eventos.push({
    tipo: "fimBatalha",
    resultado: batalha.resultado,
    recompensas: batalha.recompensas,
  });
}

function verificarFim(batalha, rng, eventos) {
  if (batalha.fase === "fim") return true;
  const inimigosVivos = vivos(batalha, "inimigos").length > 0;
  const heroisVivos = vivos(batalha, "herois").length > 0;
  if (inimigosVivos && heroisVivos) return false;
  batalha.resultado = inimigosVivos ? "derrota" : "vitoria";
  encerrarBatalha(batalha, rng, eventos);
  return true;
}

function iniciarRodada(batalha, eventos) {
  batalha.rodada += 1;
  batalha.ordem = calcularOrdem(batalha.combatentes);
  batalha.indiceTurno = 0;
  eventos.push({ tipo: "rodadaIniciada", rodada: batalha.rodada, ordem: [...batalha.ordem] });
}

// Avança turnos (inimigos, status, atordoamentos) até um herói precisar agir ou a batalha acabar
function avancar(batalha, rng, eventos) {
  for (let passo = 0; passo < LIMITE_PASSOS; passo++) {
    if (verificarFim(batalha, rng, eventos)) return;
    if (batalha.indiceTurno >= batalha.ordem.length) iniciarRodada(batalha, eventos);

    const c = batalha.combatentes[batalha.ordem[batalha.indiceTurno]];
    if (c.nocauteado) {
      batalha.indiceTurno += 1;
      continue;
    }

    batalha.turnoGlobal += 1;
    c.defendendo = false;
    eventos.push({ tipo: "turnoIniciado", origemId: c.id, rodada: batalha.rodada });

    for (const tick of processarInicioTurno(c)) {
      eventos.push({
        tipo: "statusTick",
        alvoId: c.id,
        statusId: tick.statusId,
        valor: tick.valor,
        hpDepois: c.hpAtual,
      });
    }
    if (c.hpAtual === 0) {
      nocautear(c, eventos);
      batalha.indiceTurno += 1;
      continue;
    }

    if (c.lado === "herois") regenerarRecurso(c, eventos);

    if (temStatus(c, "atordoado")) {
      eventos.push({ tipo: "turnoPerdido", origemId: c.id });
      encerrarTurno(batalha, c, rng, eventos);
      batalha.indiceTurno += 1;
      continue;
    }

    if (c.lado === "herois") {
      batalha.fase = "escolhaAcao";
      batalha.ativoId = c.id;
      return;
    }

    executarTurnoInimigo(batalha, c, rng, eventos);
    if (!c.nocauteado) encerrarTurno(batalha, c, rng, eventos);
    batalha.indiceTurno += 1;
  }
  throw new Error("Limite de passos da batalha excedido.");
}

function concluirChamada(batalha, rng, eventos) {
  batalha.semente = rng.estado;
  batalha.log = [...batalha.log, ...eventos].slice(-MAX_LOG_BATALHA);
  return { batalha, eventos };
}

// ---------------------------------------------------------------------------
// Ação do jogador
// ---------------------------------------------------------------------------

function validarAcao(batalha, ativo, acao) {
  switch (acao?.tipo) {
    case "golpe": {
      if (![...ativo.golpes, ativo.golpeBasico].includes(acao.golpeId)) {
        return "Golpe não disponível para este herói.";
      }
      const golpe = golpes[acao.golpeId];
      if (ativo.recurso && ativo.recurso.atual < golpe.custo) {
        return `Requer ${golpe.custo} de ${ativo.recurso.tipo}.`;
      }
      const validos = alvosValidos(batalha, ativo, golpe.alvo);
      if (validos.length === 0) return "Sem alvos válidos.";
      if (ALVOS_UNICOS.includes(golpe.alvo) && !validos.includes(acao.alvoId)) {
        return "Alvo inválido.";
      }
      return null;
    }
    case "defender":
      return null;
    case "item":
      if (!itens[acao.itemId]?.usoEmBatalha) return "Item não pode ser usado em batalha.";
      if (!alvosParaItem(batalha, acao.itemId).includes(acao.alvoId)) return "Alvo inválido.";
      return null;
    case "fugir":
      return temChefe(batalha) ? "Não é possível fugir de um chefe." : null;
    default:
      return "Ação desconhecida.";
  }
}

// acao: { tipo: "golpe", golpeId, alvoId? } | { tipo: "defender" }
//     | { tipo: "item", itemId, alvoId } | { tipo: "fugir" }
// A quantidade do item no inventário é conferida pela store; o evento "itemUsado" indica o consumo.
export function aplicarAcao(batalha, acao) {
  if (batalha.fase !== "escolhaAcao") {
    return { batalha, eventos: [], erro: "A batalha não está esperando uma ação." };
  }
  const ativoOriginal = batalha.combatentes[batalha.ativoId];
  const erro = validarAcao(batalha, ativoOriginal, acao);
  if (erro) return { batalha, eventos: [], erro };

  const rascunho = structuredClone(batalha);
  const rng = criarRng(rascunho.semente);
  const eventos = [];
  const ativo = rascunho.combatentes[rascunho.ativoId];

  if (acao.tipo === "fugir") {
    rascunho.resultado = "fuga";
    encerrarBatalha(rascunho, rng, eventos);
    return concluirChamada(rascunho, rng, eventos);
  }

  if (acao.tipo === "golpe") {
    const golpe = golpes[acao.golpeId];
    executarGolpe(rascunho, ativo, golpe, alvosDaAcao(rascunho, ativo, golpe.alvo, acao.alvoId), rng, eventos);
  } else if (acao.tipo === "defender") {
    defender(ativo, eventos);
  } else if (acao.tipo === "item") {
    usarItem(rascunho, ativo, acao, eventos);
  }

  rascunho.ativoId = null;
  if (!verificarFim(rascunho, rng, eventos)) {
    encerrarTurno(rascunho, ativo, rng, eventos);
    rascunho.indiceTurno += 1;
    avancar(rascunho, rng, eventos);
  }
  return concluirChamada(rascunho, rng, eventos);
}
