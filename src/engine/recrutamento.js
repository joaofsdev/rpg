// Mural de recrutas da taverna (SPEC.md §3.2). Funções puras: agora e rng por parâmetro.

import { classesHeroi } from "../data/classesHeroi";
import { nomesHerois } from "../data/nomesHerois";
import { MAX_HEROIS, MAX_GRUPO, PONTOS_POR_NIVEL } from "../data/constants";
import {
  DURACAO_MURAL_MS,
  RECRUTAS_NO_MURAL,
  NIVEIS_ABAIXO_DO_GRUPO,
  CUSTO_RECRUTA_BASE,
  CUSTO_RECRUTA_POR_NIVEL,
  CLASSES_RECRUTAVEIS,
} from "../data/recrutamento";
import { escolher } from "./rng";
import { nivelMedio } from "./encontros";
import { criarHeroiEquipado, adicionarHeroi } from "./herois";
import { heroisDoGrupo, motivoGrupoTravado } from "./grupo";
import { prazoVencido, tempoAtePrazo } from "./relogio";

// Classes liberadas por chefes + classes que o jogador já tem
export function classesRecrutaveis(save) {
  const liberadas = CLASSES_RECRUTAVEIS.filter(
    (c) => c.zonaId === null || save.progresso.zonas[c.zonaId]?.chefeDerrotado,
  ).map((c) => c.classeId);
  const doSave = Object.values(save.herois).map((h) => h.classeId);
  return Object.keys(classesHeroi).filter((id) => liberadas.includes(id) || doSave.includes(id));
}

// Nível e custo são calculados na hora: acompanham o grupo enquanto o mural está no ar
export function nivelDoRecruta(save) {
  return Math.max(1, nivelMedio(heroisDoGrupo(save)) - NIVEIS_ABAIXO_DO_GRUPO);
}

export function custoDoRecruta(nivel) {
  return CUSTO_RECRUTA_BASE + CUSTO_RECRUTA_POR_NIVEL * nivel;
}

// Até RECRUTAS_NO_MURAL classes diferentes (repete só se houver menos classes liberadas)
export function gerarMural(rng, { classeIds, nomesEmUso = [], agora }) {
  const disponiveis = [...classeIds];
  const nomes = [...nomesEmUso];
  const opcoes = [];
  for (let i = 0; i < RECRUTAS_NO_MURAL; i++) {
    const classeId = escolher(rng, disponiveis.length ? disponiveis : classeIds);
    disponiveis.splice(disponiveis.indexOf(classeId), 1);
    const livres = nomesHerois.filter((n) => !nomes.includes(n));
    const nome = escolher(rng, livres.length ? livres : nomesHerois);
    nomes.push(nome);
    opcoes.push({ classeId, nome, contratado: false });
  }
  return { opcoes, renovadaEm: agora };
}

export function muralVencido(mural, agora) {
  return !mural || prazoVencido(mural.renovadaEm, DURACAO_MURAL_MS, agora);
}

export function tempoAteRenovarMural(mural, agora) {
  return mural ? tempoAtePrazo(mural.renovadaEm, DURACAO_MURAL_MS, agora) : 0;
}

export function muralEmDia(save, agora, rng) {
  if (!muralVencido(save.recrutas, agora)) return save;
  const recrutas = gerarMural(rng, {
    classeIds: classesRecrutaveis(save),
    nomesEmUso: Object.values(save.herois).map((h) => h.nome),
    agora,
  });
  return { ...save, recrutas };
}

export function motivoNaoContrata(save, indice) {
  const opcao = save.recrutas?.opcoes[indice];
  if (!opcao || opcao.contratado) return "Este recruta já foi embora.";
  const total = Object.keys(save.herois).length;
  if (total >= MAX_HEROIS) return `Limite de heróis atingido (${MAX_HEROIS}/${MAX_HEROIS}).`;
  if (save.ouro < custoDoRecruta(nivelDoRecruta(save))) return "Ouro insuficiente.";
  return null;
}

// O recruta entra no grupo se houver espaço (e o grupo não estiver travado); senão, na reserva.
// Chega com os pontos livres do nível para distribuir. Retorna { save, heroi, noGrupo } ou { erro }.
export function contratarRecruta(save, indice, rng) {
  const motivo = motivoNaoContrata(save, indice);
  if (motivo) return { erro: motivo };
  const opcao = save.recrutas.opcoes[indice];
  const nivel = nivelDoRecruta(save);
  const criado = criarHeroiEquipado(rng, { classeId: opcao.classeId, nome: opcao.nome, nivel });
  const heroi = { ...criado.heroi, pontosLivres: PONTOS_POR_NIVEL * (nivel - 1) };
  const noGrupo = save.grupo.length < MAX_GRUPO && !motivoGrupoTravado(save);
  const opcoes = save.recrutas.opcoes.map((o, i) => (i === indice ? { ...o, contratado: true } : o));
  const pago = { ...save, ouro: save.ouro - custoDoRecruta(nivel), recrutas: { ...save.recrutas, opcoes } };
  return { save: adicionarHeroi(pago, heroi, criado.equipamentos, { noGrupo }), heroi, noGrupo };
}
