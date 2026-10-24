// Leitura e gravação no localStorage. O storage é recebido por parâmetro
// (localStorage no jogo, um objeto em memória nos testes). Único módulo que acessa o storage.

import { MAX_SLOTS } from "../data/constants";
import { classesHeroi } from "../data/classesHeroi";
import { carregarSave } from "./migracoes";
import { CHAVE_LEGADO, listarContasV1, migrarContaV1 } from "./migracaoV1";

export const CHAVE_INDICE = "magichill:indice";
export const CHAVE_CONFIG = "magichill:config";
export const VERSAO_INDICE = 1;

export function chaveSlot(numero) {
  return `magichill:slot:${numero}`;
}

export function criarIndiceVazio() {
  return {
    versao: VERSAO_INDICE,
    ultimoSlot: null,
    migradoDeV1: false,
    slots: Array.from({ length: MAX_SLOTS }, () => null),
  };
}

function lerJson(storage, chave) {
  const texto = storage.getItem(chave);
  if (texto === null) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export function lerIndice(storage) {
  const indice = lerJson(storage, CHAVE_INDICE);
  if (!indice || !Array.isArray(indice.slots)) return null;
  return indice;
}

export function gravarIndice(storage, indice) {
  storage.setItem(CHAVE_INDICE, JSON.stringify(indice));
}

export function resumoDoSave(save) {
  const herois = Object.values(save.herois);
  const principal = save.herois[save.grupo[0]] || herois[0];
  return {
    nome: principal?.nome || "Sem nome",
    criadoEm: save.criadoEm,
    atualizadoEm: save.atualizadoEm,
    nivelMaisAlto: Math.max(...herois.map((h) => h.nivel)),
    classePrincipal: principal ? classesHeroi[principal.classeId].nome : null,
    tempoJogado: save.tempoJogado,
  };
}

// { status: "vazio" } | { status: "ok", save } | { status: "danificado", erro, bruto }
export function lerSlot(storage, numero) {
  const bruto = storage.getItem(chaveSlot(numero));
  if (bruto === null) return { status: "vazio" };
  const resultado = carregarSave(bruto);
  return resultado.status === "ok" ? resultado : { ...resultado, bruto };
}

// Nunca grava por cima de um slot danificado sem "forcar" (SPEC.md §6.7)
export function gravarSlot(storage, numero, save, { agora, forcar = false } = {}) {
  if (!forcar && lerSlot(storage, numero).status === "danificado") {
    throw new Error(`O slot ${numero + 1} está danificado e não será sobrescrito.`);
  }
  const salvo = { ...save, atualizadoEm: agora ?? save.atualizadoEm };
  storage.setItem(chaveSlot(numero), JSON.stringify(salvo));

  const indice = lerIndice(storage) || criarIndiceVazio();
  indice.slots[numero] = resumoDoSave(salvo);
  indice.ultimoSlot = numero;
  gravarIndice(storage, indice);
  return salvo;
}

export function apagarSlot(storage, numero) {
  storage.removeItem(chaveSlot(numero));
  const indice = lerIndice(storage) || criarIndiceVazio();
  indice.slots[numero] = null;
  if (indice.ultimoSlot === numero) indice.ultimoSlot = null;
  gravarIndice(storage, indice);
}

// Migra as contas do jogo antigo uma única vez. A chave antiga nunca é apagada.
// usernames: contas escolhidas pelo jogador quando há mais contas do que slots.
export function migrarLegado(storage, { agora, rng, usernames } = {}) {
  if (lerIndice(storage)) return { status: "naoNecessario" };

  const usuarios = lerJson(storage, CHAVE_LEGADO);
  const contas = listarContasV1(usuarios);
  if (contas.length === 0) {
    gravarIndice(storage, criarIndiceVazio());
    return { status: "semLegado" };
  }

  if (!usernames && contas.length > MAX_SLOTS) {
    return { status: "escolhaNecessaria", contas };
  }

  const escolhidas = (usernames || contas.map((c) => c.username)).slice(0, MAX_SLOTS);
  const indice = criarIndiceVazio();
  indice.migradoDeV1 = true;
  gravarIndice(storage, indice);

  escolhidas.forEach((username, numero) => {
    const save = migrarContaV1(username, usuarios[username], { agora, rng });
    gravarSlot(storage, numero, save, { agora });
  });

  return { status: "migrado", slots: escolhidas };
}

// Configurações do dispositivo (fora do save)
export const CONFIG_PADRAO = { velocidadeAnimacao: 1, reduzirMovimento: false, tema: "taverna" };

export function lerConfig(storage) {
  const config = lerJson(storage, CHAVE_CONFIG);
  return { ...CONFIG_PADRAO, ...(config && typeof config === "object" ? config : {}) };
}

export function gravarConfig(storage, config) {
  storage.setItem(CHAVE_CONFIG, JSON.stringify(config));
}

// Situação dos slots para a tela inicial: [{ status, resumo?, erro? }]
export function listarSlots(storage) {
  return Array.from({ length: MAX_SLOTS }, (_, numero) => {
    const lido = lerSlot(storage, numero);
    if (lido.status === "ok") return { status: "ok", resumo: resumoDoSave(lido.save) };
    if (lido.status === "danificado") return { status: "danificado", erro: lido.erro };
    return { status: "vazio" };
  });
}
