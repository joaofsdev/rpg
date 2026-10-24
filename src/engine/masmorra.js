// Masmorras por andares (SPEC.md §3.5). Funções puras sobre o save.

import { buscarZona } from "../data/zonas";
import {
  ANDARES_MASMORRA,
  ANDARES_COM_FOGUEIRA,
  CURA_FOGUEIRA,
  VIDA_AO_REVIVER_NA_FOGUEIRA,
  NIVEIS_EXTRA_CHEFE_MASMORRA,
  NIVEIS_POR_ANDAR,
  DESCANSO_ENTRE_ANDARES,
} from "../data/constants";
import { escolherPonderado } from "./rng";

export function ehAndarDoChefe(andar) {
  return andar === ANDARES_MASMORRA;
}

export function inimigosDoAndar(zona, andar, rng) {
  if (ehAndarDoChefe(andar)) {
    return [{ id: zona.chefe, nivel: zona.nivelMax + NIVEIS_EXTRA_CHEFE_MASMORRA }];
  }
  const encontro = escolherPonderado(rng, zona.encontros);
  const nivel = zona.nivelMax + Math.floor((andar - 1) * NIVEIS_POR_ANDAR);
  return encontro.inimigos.map((id) => ({ id, nivel }));
}

export function origemDoAndar(masmorraAtual) {
  return {
    tipo: "masmorra",
    zonaId: masmorraAtual.zonaId,
    andar: masmorraAtual.andar,
    chefe: ehAndarDoChefe(masmorraAtual.andar),
  };
}

function ganhosVazios() {
  return { xp: 0, ouro: 0, itens: {}, equipamentos: 0 };
}

export function entrarNaMasmorra(save, zonaId) {
  const zona = buscarZona(zonaId);
  if (!zona) return { erro: "Zona desconhecida." };
  if (!save.progresso.masmorras[zona.masmorra.id]?.desbloqueada) {
    return { erro: "Vença o chefe da zona para abrir a masmorra." };
  }
  if (save.batalha) return { erro: "Termine a batalha em andamento primeiro." };
  if (save.masmorraAtual) return { erro: "O grupo já está em uma masmorra." };
  return {
    save: {
      ...save,
      // vida vazia = todos com vida cheia
      masmorraAtual: { zonaId, andar: 1, vida: {}, ganhos: ganhosVazios(), fogueira: null },
    },
  };
}

export function sairDaMasmorra(save) {
  return { ...save, masmorraAtual: null };
}

function somarGanhos(ganhos, resumo) {
  const itens = { ...ganhos.itens };
  for (const [id, qtd] of Object.entries(resumo.itens)) itens[id] = (itens[id] || 0) + qtd;
  return {
    xp: ganhos.xp + resumo.xp,
    ouro:
      ganhos.ouro +
      resumo.ouro +
      [...resumo.equipamentosVendidos, ...resumo.itensVendidos].reduce((s, v) => s + v.valor, 0),
    itens,
    equipamentos: ganhos.equipamentos + resumo.equipamentos.length + resumo.equipamentosVendidos.length,
  };
}

export function vidaDepoisDoAndar(batalha, comFogueira) {
  const vida = {};
  for (const c of Object.values(batalha.combatentes)) {
    if (c.lado !== "herois") continue;
    let hp = c.nocauteado ? 0 : c.hpAtual;
    if (comFogueira) {
      hp =
        hp === 0
          ? Math.floor(c.hpMax * VIDA_AO_REVIVER_NA_FOGUEIRA)
          : Math.min(c.hpMax, hp + Math.floor(c.hpMax * CURA_FOGUEIRA));
    } else if (hp > 0) {
      hp = Math.min(c.hpMax, hp + Math.floor(c.hpMax * DESCANSO_ENTRE_ANDARES));
    }
    vida[c.refId] = hp;
  }
  return vida;
}

// Chamado depois de aplicarResultadoBatalha para uma batalha de masmorra.
// Retorna { save, evento } — evento: { tipo: "andar" | "concluida" | "saiu", andar, fogueira? }
export function concluirAndar(save, batalha, resumo) {
  const atual = save.masmorraAtual;
  if (!atual || batalha.origem?.tipo !== "masmorra") return { save, evento: null };

  const zona = buscarZona(atual.zonaId);
  const id = zona.masmorra.id;
  const anterior = save.progresso.masmorras[id];

  if (batalha.resultado !== "vitoria") {
    return { save: sairDaMasmorra(save), evento: { tipo: "saiu", andar: atual.andar } };
  }

  const ganhos = somarGanhos(atual.ganhos, resumo);
  const progresso = {
    ...save.progresso,
    masmorras: {
      ...save.progresso.masmorras,
      [id]: {
        ...anterior,
        melhorAndar: Math.max(anterior.melhorAndar, atual.andar),
        concluida: anterior.concluida || ehAndarDoChefe(atual.andar),
      },
    },
  };

  if (ehAndarDoChefe(atual.andar)) {
    return {
      save: { ...save, progresso, masmorraAtual: null },
      evento: { tipo: "concluida", andar: atual.andar, ganhos },
    };
  }

  const fogueira = ANDARES_COM_FOGUEIRA.includes(atual.andar);
  return {
    save: {
      ...save,
      progresso,
      masmorraAtual: {
        ...atual,
        andar: atual.andar + 1,
        vida: vidaDepoisDoAndar(batalha, fogueira),
        ganhos,
        fogueira: fogueira ? { andar: atual.andar } : null,
      },
    },
    evento: { tipo: "andar", andar: atual.andar, fogueira },
  };
}
