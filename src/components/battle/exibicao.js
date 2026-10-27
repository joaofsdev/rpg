// Estado exibido durante a animação (SPEC.md §6.2). O motor já resolveu tudo; aqui só
// reproduzimos os eventos na ordem para as barras e os sprites mudarem no momento certo.

import { golpes } from "../../data/golpes";
import { itens } from "../../data/itens";
import { status as dadosStatus } from "../../data/status";
import { NOMES_ATRIBUTO, NOMES_ELEMENTO } from "../../data/textos";
import { ELEMENTOS_FISICOS } from "../../data/constants";

export { PAUSA_ENTRE_ACOES_MS, duracaoEvento, duracaoDaFila } from "./duracoes";

export function criarExibicao(batalha) {
  const combatentes = {};
  for (const c of Object.values(batalha.combatentes)) {
    combatentes[c.id] = {
      id: c.id,
      lado: c.lado,
      refId: c.refId,
      classeId: c.classeId,
      nome: c.nome,
      nivel: c.nivel,
      posicao: c.posicao,
      chefe: c.chefe,
      hpAtual: c.hpAtual,
      hpMax: c.hpMax,
      recurso: c.recurso ? { ...c.recurso } : null,
      status: c.status.map((s) => ({ ...s })),
      nocauteado: c.nocauteado,
      defendendo: c.defendendo,
      intencao: c.intencao ? { ...c.intencao } : null,
    };
  }
  return {
    rodada: batalha.rodada,
    ordem: [...batalha.ordem],
    ativoId: batalha.ativoId,
    combatentes,
  };
}

function comCombatente(exibicao, id, mudar) {
  const atual = exibicao.combatentes[id];
  if (!atual) return exibicao;
  return { ...exibicao, combatentes: { ...exibicao.combatentes, [id]: { ...atual, ...mudar(atual) } } };
}

export function aplicarEvento(exibicao, evento) {
  switch (evento.tipo) {
    case "rodadaIniciada":
      return { ...exibicao, rodada: evento.rodada, ordem: [...evento.ordem] };
    case "turnoIniciado":
      return comCombatente({ ...exibicao, ativoId: evento.origemId }, evento.origemId, () => ({
        defendendo: false,
      }));
    case "golpeUsado":
      return exibicao.combatentes[evento.origemId]?.lado === "inimigos"
        ? comCombatente(exibicao, evento.origemId, () => ({ intencao: null }))
        : exibicao;
    case "dano":
    case "cura":
    case "statusTick":
      return comCombatente(exibicao, evento.alvoId, () => ({ hpAtual: evento.hpDepois }));
    case "recurso":
      return comCombatente(exibicao, evento.alvoId, (c) => ({
        recurso: c.recurso ? { ...c.recurso, atual: evento.atual } : null,
      }));
    case "nocaute":
      return comCombatente(exibicao, evento.alvoId, () => ({
        nocauteado: true,
        status: [],
        intencao: null,
        defendendo: false,
      }));
    case "statusAplicado":
      return comCombatente(exibicao, evento.alvoId, (c) => {
        const novo = { statusId: evento.statusId, turnos: evento.turnos, atributo: evento.atributo, valor: evento.valor };
        if (evento.statusId === "modificador") return { status: [...c.status, novo] };
        return { status: [...c.status.filter((s) => s.statusId !== evento.statusId), novo] };
      });
    case "statusRemovido":
      return comCombatente(exibicao, evento.alvoId, (c) => ({
        status: c.status.filter((s) => s.statusId !== evento.statusId),
      }));
    case "intencao":
      return comCombatente(exibicao, evento.origemId, () => ({
        intencao: { golpeId: evento.golpeId, alvos: [...evento.alvos], telegrafado: evento.telegrafado },
      }));
    case "defender":
      return comCombatente(exibicao, evento.origemId, () => ({ defendendo: true }));
    case "reviveu":
      return comCombatente(exibicao, evento.alvoId, () => ({ nocauteado: false, hpAtual: evento.hpDepois }));
    case "fimBatalha":
      return { ...exibicao, ativoId: null };
    default:
      return exibicao;
  }
}

const NOMES_AFINIDADE = { fraco: "Fraco!", resiste: "Resiste", imune: "Imune" };

// Efeitos visuais disparados por um evento: animação de sprite, número flutuante, partículas
export function efeitosDoEvento(evento) {
  switch (evento.tipo) {
    case "golpeUsado":
      return [{ tipo: "animacao", alvoId: evento.origemId, animacao: "ataque", golpeId: evento.golpeId }];
    case "dano": {
      const efeitos = [
        { tipo: "animacao", alvoId: evento.alvoId, animacao: "dano" },
        {
          tipo: "numero",
          alvoId: evento.alvoId,
          texto: evento.afinidade === "imune" ? "Imune" : String(evento.valor),
          estilo: evento.critico ? "critico" : evento.afinidade === "fraco" ? "fraco" : "dano",
        },
      ];
      if (!evento.autoDano) efeitos.push({ tipo: "particulas", alvoId: evento.alvoId, elemento: evento.elemento });
      return efeitos;
    }
    case "cura":
      return [{ tipo: "numero", alvoId: evento.alvoId, texto: `+${evento.valor}`, estilo: "cura" }];
    case "statusTick":
      return evento.valor < 0
        ? [
            { tipo: "animacao", alvoId: evento.alvoId, animacao: "dano" },
            { tipo: "numero", alvoId: evento.alvoId, texto: String(-evento.valor), estilo: "status" },
          ]
        : [{ tipo: "numero", alvoId: evento.alvoId, texto: `+${evento.valor}`, estilo: "cura" }];
    case "errou":
      return [{ tipo: "numero", alvoId: evento.alvoId, texto: "Errou", estilo: "errou" }];
    case "nocaute":
      return [{ tipo: "animacao", alvoId: evento.alvoId, animacao: "derrota" }];
    case "statusAplicado":
      return evento.statusId === "modificador"
        ? [{ tipo: "numero", alvoId: evento.alvoId, texto: `${evento.valor > 0 ? "+" : ""}${evento.valor} ${NOMES_ATRIBUTO[evento.atributo]}`, estilo: "status" }]
        : [{ tipo: "numero", alvoId: evento.alvoId, texto: dadosStatus[evento.statusId].nome, estilo: "status" }];
    case "statusResistido":
      return [{ tipo: "numero", alvoId: evento.alvoId, texto: "Resistiu", estilo: "errou" }];
    case "afinidadeDescoberta":
      return NOMES_AFINIDADE[evento.afinidade]
        ? [{ tipo: "numero", alvoId: evento.alvoId, texto: NOMES_AFINIDADE[evento.afinidade], estilo: "afinidade" }]
        : [];
    case "turnoPerdido":
      return [{ tipo: "numero", alvoId: evento.origemId, texto: "Atordoado", estilo: "status" }];
    case "defender":
      return [{ tipo: "numero", alvoId: evento.origemId, texto: "Defendendo", estilo: "status" }];
    case "reviveu":
      return [{ tipo: "numero", alvoId: evento.alvoId, texto: `De pé! +${evento.hpDepois}`, estilo: "cura" }];
    default:
      return [];
  }
}

// Frase para o registro da batalha. Retorna null para eventos que não merecem linha própria.
export function descreverEvento(evento, exibicao) {
  const nome = (id) => exibicao.combatentes[id]?.nome ?? "?";
  switch (evento.tipo) {
    case "rodadaIniciada":
      return `Rodada ${evento.rodada}`;
    case "golpeUsado":
      return `${nome(evento.origemId)} usou ${golpes[evento.golpeId].nome}.`;
    case "dano":
      if (evento.autoDano) return `${nome(evento.alvoId)} perdeu ${evento.valor} de vida.`;
      if (evento.afinidade === "imune") return `${nome(evento.alvoId)} é imune.`;
      return `${nome(evento.alvoId)} sofreu ${evento.valor} de dano${evento.critico ? " (crítico)" : ""}.`;
    case "cura":
      return `${nome(evento.alvoId)} recuperou ${evento.valor} de vida.`;
    case "errou":
      return `${nome(evento.origemId)} errou.`;
    case "statusTick":
      return evento.valor < 0
        ? `${nome(evento.alvoId)} sofreu ${-evento.valor} por ${dadosStatus[evento.statusId].nome}.`
        : `${nome(evento.alvoId)} recuperou ${evento.valor} por ${dadosStatus[evento.statusId].nome}.`;
    case "statusAplicado":
      return evento.statusId === "modificador"
        ? `${nome(evento.alvoId)}: ${NOMES_ATRIBUTO[evento.atributo]} ${evento.valor > 0 ? "+" : ""}${evento.valor} por ${evento.turnos} turnos.`
        : `${nome(evento.alvoId)} recebeu ${dadosStatus[evento.statusId].nome}.`;
    case "statusResistido":
      return `${nome(evento.alvoId)} resistiu a ${dadosStatus[evento.statusId].nome}.`;
    case "nocaute":
      return `${nome(evento.alvoId)} caiu.`;
    case "defender":
      return `${nome(evento.origemId)} está se defendendo.`;
    case "itemUsado":
      return `${nome(evento.origemId)} usou ${itens[evento.itemId].nome} em ${nome(evento.alvoId)}.`;
    case "turnoPerdido":
      return `${nome(evento.origemId)} está atordoado e perdeu o turno.`;
    case "reviveu":
      return `${nome(evento.alvoId)} voltou à luta com ${evento.hpDepois} de vida.`;
    case "afinidadeDescoberta":
      return NOMES_AFINIDADE[evento.afinidade]
        ? `Descoberto: ${nome(evento.alvoId)} ${evento.afinidade === "fraco" ? "é fraco a" : evento.afinidade === "resiste" ? "resiste a" : "é imune a"} ${NOMES_ELEMENTO[evento.elemento]}.`
        : null;
    case "fimBatalha":
      return { vitoria: "Vitória!", derrota: "O grupo recuou.", fuga: "O grupo fugiu." }[evento.resultado];
    default:
      return null;
  }
}

// Som de cada evento (nome de um efeito de src/components/common/som.js), ou null.
// Dano de status (veneno, queimadura) e de custo próprio não toca nada, para não cansar.
export function somDoEvento(evento) {
  switch (evento.tipo) {
    case "dano":
      if (evento.autoDano || evento.valor === 0) return null;
      if (evento.critico) return "critico";
      if (ELEMENTOS_FISICOS.includes(evento.elemento)) return evento.elemento === "impacto" ? "golpeImpacto" : "golpeCorte";
      return "golpeMagia";
    case "errou":
      return "errou";
    case "cura":
    case "reviveu":
      return "cura";
    case "nocaute":
      return "nocaute";
    case "statusAplicado":
      return "status";
    case "itemUsado":
      return "item";
    default:
      return null;
  }
}
