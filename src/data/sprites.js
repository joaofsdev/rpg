// Definição dos sprites (SPEC.md §7). Cada arquivo é uma tira horizontal de quadros.
// Origem e licença de cada imagem: CREDITS.md.
//
// animacoes: { inicio, quadros, ms, repetir? } — "inicio" é o índice do primeiro quadro.
// Animações ausentes usam o efeito em CSS (avanço, piscada, queda).

import { aparenciaInimigos } from "./aparenciaInimigos";
import cavaleiro from "../assets/sprites/herois/cavaleiro.png";
import arqueiro from "../assets/sprites/herois/arqueiro.png";
import mago from "../assets/sprites/herois/mago.png";
import assassino from "../assets/sprites/herois/assassino.png";
import bardo from "../assets/sprites/herois/bardo.png";
import barbaro from "../assets/sprites/herois/barbaro.png";
import chao from "../assets/sprites/cenario/chao.png";
import parede from "../assets/sprites/cenario/parede.png";
import paredeTopo from "../assets/sprites/cenario/parede_topo.png";
import estandarte from "../assets/sprites/cenario/estandarte.png";
import pocaoPequena from "../assets/sprites/itens/pocao_pequena.png";
import eterMenor from "../assets/sprites/itens/eter_menor.png";
import tonico from "../assets/sprites/itens/tonico.png";
import antidoto from "../assets/sprites/itens/antidoto.png";
import ervaRevigorante from "../assets/sprites/itens/erva_revigorante.png";

const arquivosCriaturas = import.meta.glob("../assets/sprites/criaturas/*.png", {
  eager: true,
  import: "default",
});

function arquivoCriatura(base) {
  return arquivosCriaturas[`../assets/sprites/criaturas/${base}.png`];
}

// Puny Characters: 24 quadros de 32x32 por linha
const ANIMACOES_PUNY = {
  idle: { inicio: 0, quadros: 2, ms: 900, repetir: true },
  dano: { inicio: 18, quadros: 2, ms: 260 },
  derrota: { inicio: 20, quadros: 4, ms: 560 },
};
const ATAQUES_PUNY = {
  espada: { inicio: 4, quadros: 4, ms: 420 },
  arco: { inicio: 8, quadros: 4, ms: 420 },
  cajado: { inicio: 12, quadros: 3, ms: 420 },
  arremesso: { inicio: 15, quadros: 3, ms: 420 },
};

function puny(arquivo, ataque, extras = {}) {
  return {
    arquivo,
    largura: 32,
    altura: 32,
    totalQuadros: 24,
    animacoes: { ...ANIMACOES_PUNY, ataque: ATAQUES_PUNY[ataque] },
    ...extras,
  };
}

// 0x72 DungeonTilesetII: 4 quadros parados, virados para a direita
function monstro(arquivo, largura, altura) {
  return {
    arquivo,
    largura,
    altura,
    totalQuadros: 4,
    animacoes: { idle: { inicio: 0, quadros: 4, ms: 640, repetir: true } },
  };
}

export const spritesHerois = {
  cavaleiro: puny(cavaleiro, "espada"),
  arqueiro: puny(arqueiro, "arco"),
  mago: puny(mago, "cajado"),
  assassino: puny(assassino, "arremesso"),
  bardo: puny(bardo, "cajado"),
  barbaro: puny(barbaro, "espada"),
};

// Tamanho do quadro de cada criatura base do 0x72
const TAMANHOS_0X72 = {
  skelet: [16, 16],
  zombie: [16, 16],
  muddy: [16, 16],
  ice_zombie: [16, 16],
  imp: [16, 16],
  angel: [16, 16],
  swampy: [16, 16],
  necromancer: [16, 23],
  chort: [16, 23],
  wogol: [16, 23],
  orc_warrior: [16, 23],
  orc_shaman: [16, 23],
  masked_orc: [16, 23],
  slug: [16, 23],
  doc: [16, 23],
  wizzard_m: [16, 28],
  wizzard_f: [16, 28],
  elf_f: [16, 28],
  knight_m: [16, 28],
  lizard_m: [16, 28],
  big_zombie: [32, 36],
  ogre: [32, 36],
  big_demon: [32, 36],
};

// Humanoides do Puny Characters já virados para a esquerda (linha 6 do sheet)
const ATAQUE_PUNY_INIMIGO = {
  p_trabalhador: "espada",
  p_soldado_vermelho: "espada",
  p_soldado: "espada",
  p_arqueiro: "arco",
  p_soldado_ciano: "espada",
  p_orc_soldado: "espada",
};

function spriteBase(base) {
  const arquivo = arquivoCriatura(base);
  if (ATAQUE_PUNY_INIMIGO[base]) {
    return puny(arquivo, ATAQUE_PUNY_INIMIGO[base], { viradoParaEsquerda: true });
  }
  const [largura, altura] = TAMANHOS_0X72[base];
  return monstro(arquivo, largura, altura);
}

export const spritesInimigos = Object.fromEntries(
  Object.entries(aparenciaInimigos).map(([id, a]) => [
    id,
    { ...spriteBase(a.base), filtro: a.filtro, translucido: a.translucido },
  ]),
);

export const cenario = { chao, parede, paredeTopo, estandarte };

export const iconesItens = {
  pocao_pequena: pocaoPequena,
  eter_menor: eterMenor,
  tonico,
  antidoto,
  erva_revigorante: ervaRevigorante,
};

export function spriteDoCombatente(combatente) {
  return combatente.lado === "herois"
    ? spritesHerois[combatente.classeId]
    : spritesInimigos[combatente.refId];
}
