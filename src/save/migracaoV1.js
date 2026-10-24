// Migração do formato legado (chave "rpg_users") para o save v2 (SPEC.md §5.5)

import { zonas } from "../data/zonas";
import { NIVEL_COMPANHEIRO_MIGRACAO_OFFSET, SLOTS_EQUIPAMENTO } from "../data/constants";
import { TIPOS_ARMA_MAGICA } from "../data/equipamentos";
import { gerarId } from "../engine/rng";
import { criarHeroi, adicionarHeroi } from "../engine/herois";
import { xpParaProximoNivel } from "../engine/progressao";
import { criarSaveVazio } from "./formato";
import { adicionarCompanheiro, adicionarConsumiveisIniciais } from "./novoJogo";

export const CHAVE_LEGADO = "rpg_users";

const CLASSES_MAGICAS = ["mago", "bardo"];

// Contas que têm personagem, da mais antiga para a mais nova
export function listarContasV1(usuarios) {
  return Object.entries(usuarios || {})
    .filter(([, conta]) => conta?.character)
    .map(([username, conta]) => ({
      username,
      createdAt: conta.createdAt || "",
      classeId: conta.character.classeId,
      nivel: conta.character.nivel,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function converterItemV1(item) {
  const magica = item.tipo === "arma" && TIPOS_ARMA_MAGICA.includes(item.tipoArma);
  const forca = item.bonusForca || 0;
  const convertido = {
    id: item.id,
    nome: item.nome,
    slot: item.tipo,
    raridade: item.raridade,
    nivel: item.nivel,
    bonus: {
      vida: item.bonusVida || 0,
      forca: magica ? 0 : forca,
      magia: magica ? forca : 0,
      defesa: item.bonusDefesa || 0,
      resistencia: 0,
      velocidade: item.bonusVelocidade || 0,
    },
    aprimoramento: 0,
  };
  if (item.tipoArma) convertido.tipoArma = item.tipoArma;
  if (item.pesoArmadura) convertido.pesoArmadura = item.pesoArmadura;
  return convertido;
}

function converterPontos(personagem) {
  const antigos = personagem.pontosDistribuidos || {};
  const magica = CLASSES_MAGICAS.includes(personagem.classeId);
  return {
    vida: antigos.vida || 0,
    forca: magica ? 0 : antigos.forca || 0,
    magia: magica ? antigos.forca || 0 : 0,
    defesa: antigos.defesa || 0,
    resistencia: 0,
    velocidade: antigos.velocidade || 0,
    manaMax: 0,
  };
}

function converterXp(personagem) {
  const proximoAntigo = personagem.xpProximoNivel || 1;
  const proximoNovo = xpParaProximoNivel(personagem.nivel);
  const xp = Math.floor(((personagem.xp || 0) / proximoAntigo) * proximoNovo);
  return Math.min(Math.max(0, xp), proximoNovo - 1);
}

function converterProgresso(save, personagem) {
  const progresso = {
    zonas: { ...save.progresso.zonas },
    masmorras: { ...save.progresso.masmorras },
  };
  const desbloqueadas = personagem.areasDesbloqueadas || [];
  const concluidas = personagem.areasConcluidas || [];
  const masmorrasConcluidas = personagem.dungeonsConcluidas || [];

  zonas.forEach((zona, i) => {
    const chefeDerrotado = concluidas.includes(zona.id);
    progresso.zonas[zona.id] = {
      desbloqueada: i === 0 || chefeDerrotado || desbloqueadas.includes(zona.id),
      encontrosVencidos: chefeDerrotado ? zona.encontrosParaChefe : 0,
      chefeDerrotado,
    };
    // Masmorras antigas usavam ids numéricos na mesma ordem das zonas
    const concluida = masmorrasConcluidas.includes(i + 1);
    progresso.masmorras[zona.masmorra.id] = {
      desbloqueada: chefeDerrotado || concluida,
      concluida,
      melhorAndar: concluida ? 6 : 0,
    };
  });
  return progresso;
}

function converterBestiario(personagem) {
  const bestiario = {};
  for (const chefeId of personagem.bossesDerotados || []) {
    const anterior = bestiario[chefeId];
    bestiario[chefeId] = {
      visto: true,
      derrotas: (anterior?.derrotas || 0) + 1,
      afinidadesReveladas: [],
      dropsVistos: [],
    };
  }
  return bestiario;
}

// Converte uma conta v1 em um save v2. Não altera a conta recebida.
export function migrarContaV1(username, conta, { agora, rng }) {
  const personagem = conta.character;
  let save = criarSaveVazio(agora);
  save.criadoEm = Date.parse(conta.createdAt) || agora;

  const heroi = criarHeroi({
    id: gerarId(rng),
    nome: username,
    classeId: personagem.classeId,
    nivel: personagem.nivel,
  });
  heroi.xp = converterXp(personagem);
  heroi.pontosNivel = converterPontos(personagem);

  const equipados = [];
  for (const slot of SLOTS_EQUIPAMENTO) {
    const item = personagem.equipamentos?.[slot];
    if (!item) continue;
    const convertido = converterItemV1(item);
    heroi.equipamento[slot] = convertido.id;
    equipados.push(convertido);
  }
  const inventario = (personagem.inventario || []).map(converterItemV1);

  save = adicionarHeroi(save, heroi, [...equipados, ...inventario]);
  save = adicionarCompanheiro(save, rng, {
    excluirClasseId: personagem.classeId,
    nivel: Math.max(1, personagem.nivel - NIVEL_COMPANHEIRO_MIGRACAO_OFFSET),
  });
  save = adicionarConsumiveisIniciais(save);

  return {
    ...save,
    ouro: personagem.ouro || 0,
    progresso: converterProgresso(save, personagem),
    bestiario: converterBestiario(personagem),
    estatisticas: {
      ...save.estatisticas,
      encontrosVencidos: personagem.batalhasVencidas || 0,
    },
  };
}
