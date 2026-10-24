// Treino no quartel (SPEC.md §3.8, §4.10). Funções puras; `agora` vem de relogio().

import { classesHeroi } from "../data/classesHeroi";
import { golpes } from "../data/golpes";
import { HORA_MS } from "../data/constants";
import {
  DURACOES_TREINO_HORAS,
  CUSTO_TREINO_POR_NIVEL_HORA,
  VAGAS_TREINO_INICIAIS,
  ZONAS_QUE_LIBERAM_VAGA_TREINO,
  NIVEIS_ANTECIPADOS_GOLPE,
} from "../data/treino";
import { TIPOS_TREINO, decorrido, heroiOcupado, listarAtividades, adicionarAtividade, removerAtividade } from "./atividades";
import { atributosDistribuiveis } from "./herois";

export function vagasDeTreino(save) {
  const chefes = ZONAS_QUE_LIBERAM_VAGA_TREINO.filter((id) => save.progresso.zonas[id]?.chefeDerrotado);
  return VAGAS_TREINO_INICIAIS + chefes.length;
}

export function treinosEmAndamento(save) {
  return listarAtividades(save, TIPOS_TREINO);
}

export function custoTreinoAtributo(heroi, horas) {
  return CUSTO_TREINO_POR_NIVEL_HORA * heroi.nivel * horas;
}

// Pontos de treino por atributo ≤ nível do herói
export function limiteDeTreino(heroi) {
  return heroi.nivel;
}

// Por que o herói não pode começar um treino agora (null = pode)
export function motivoNaoTreina(save, heroiId) {
  const heroi = save.herois[heroiId];
  if (!heroi) return "Herói não encontrado.";
  if (save.grupo.includes(heroiId)) return "Está no grupo. Mova para a reserva para treinar.";
  if (heroiOcupado(save, heroiId)) return "Já está em uma atividade.";
  const vagas = vagasDeTreino(save);
  if (treinosEmAndamento(save).length >= vagas) return `Todas as vagas de treino estão ocupadas (${vagas}/${vagas}).`;
  return null;
}

// Atributos e durações, cada um com o motivo de estar desabilitado (null = disponível)
export function opcoesTreinoAtributo(save, heroi) {
  const limite = limiteDeTreino(heroi);
  return atributosDistribuiveis(heroi.classeId).map((atributo) => {
    const atual = heroi.pontosTreino[atributo] || 0;
    const livre = limite - atual;
    return {
      atributo,
      atual,
      limite,
      motivo: livre <= 0 ? `Limite ${atual}/${limite}` : null,
      duracoes: DURACOES_TREINO_HORAS.map((horas) => {
        const custo = custoTreinoAtributo(heroi, horas);
        let motivo = null;
        if (horas > livre) motivo = livre > 0 ? `Passa do limite (faltam ${livre})` : `Limite ${atual}/${limite}`;
        else if (save.ouro < custo) motivo = "Ouro insuficiente";
        return { horas, custo, motivo };
      }),
    };
  });
}

// Golpes avançados ainda não aprendidos, com o motivo de estar desabilitado
export function opcoesTreinoGolpe(save, heroi) {
  return classesHeroi[heroi.classeId].golpesPorNivel
    .filter((g) => !heroi.golpesAprendidos.includes(g.golpeId))
    .map(({ nivel, golpeId }) => {
      const { horas, ouro } = golpes[golpeId].treino;
      let motivo = null;
      if (nivel > heroi.nivel + NIVEIS_ANTECIPADOS_GOLPE) motivo = `Exige nível ${nivel - NIVEIS_ANTECIPADOS_GOLPE}`;
      else if (save.ouro < ouro) motivo = "Ouro insuficiente";
      return { golpeId, nivel, horas, ouro, motivo };
    });
}

function iniciar(save, heroi, { id, tipo, horas, custo, parametros, agora }) {
  const atividade = { id, tipo, heroiId: heroi.id, inicio: agora, duracao: horas * HORA_MS, parametros, custoPago: custo };
  return { save: adicionarAtividade({ ...save, ouro: save.ouro - custo }, atividade) };
}

export function iniciarTreinoAtributo(save, { id, heroiId, atributo, horas, agora }) {
  const motivo = motivoNaoTreina(save, heroiId);
  if (motivo) return { erro: motivo };
  const heroi = save.herois[heroiId];
  const opcao = opcoesTreinoAtributo(save, heroi).find((o) => o.atributo === atributo);
  if (!opcao) return { erro: `Atributo inválido: ${atributo}.` };
  const duracao = opcao.duracoes.find((d) => d.horas === horas);
  if (!duracao) return { erro: "Duração inválida." };
  if (opcao.motivo || duracao.motivo) return { erro: opcao.motivo || duracao.motivo };
  return iniciar(save, heroi, { id, tipo: "treinoAtributo", horas, custo: duracao.custo, parametros: { atributo }, agora });
}

export function iniciarTreinoGolpe(save, { id, heroiId, golpeId, agora }) {
  const motivo = motivoNaoTreina(save, heroiId);
  if (motivo) return { erro: motivo };
  const heroi = save.herois[heroiId];
  const opcao = opcoesTreinoGolpe(save, heroi).find((o) => o.golpeId === golpeId);
  if (!opcao) return { erro: "Este golpe não pode ser treinado por este herói." };
  if (opcao.motivo) return { erro: opcao.motivo };
  return iniciar(save, heroi, { id, tipo: "treinoGolpe", horas: opcao.horas, custo: opcao.ouro, parametros: { golpeId }, agora });
}

// Encerra um treino (concluído ou cancelado): entrega os pontos das horas completas, ou o golpe
// se o tempo todo passou, e libera o herói. O ouro não é devolvido. Retorna { save, ganho }.
export function encerrarTreino(save, atividade, agora) {
  const heroi = save.herois[atividade.heroiId];
  const semAtividade = removerAtividade(save, atividade.id);
  const ganho = { tipo: atividade.tipo, heroiId: atividade.heroiId, ...atividade.parametros };
  if (!heroi) return { save: semAtividade, ganho: { ...ganho, pontos: 0 } };

  if (atividade.tipo === "treinoGolpe") {
    const aprendeu = decorrido(atividade, agora) >= atividade.duracao && !heroi.golpesAprendidos.includes(atividade.parametros.golpeId);
    const atualizado = aprendeu ? { ...heroi, golpesAprendidos: [...heroi.golpesAprendidos, atividade.parametros.golpeId] } : heroi;
    return {
      save: { ...semAtividade, herois: { ...semAtividade.herois, [heroi.id]: atualizado } },
      ganho: { ...ganho, aprendeu },
    };
  }

  const { atributo } = atividade.parametros;
  const atual = heroi.pontosTreino[atributo] || 0;
  const horas = Math.floor(decorrido(atividade, agora) / HORA_MS);
  const pontos = Math.max(0, Math.min(horas, limiteDeTreino(heroi) - atual));
  const atualizado = { ...heroi, pontosTreino: { ...heroi.pontosTreino, [atributo]: atual + pontos } };
  return {
    save: { ...semAtividade, herois: { ...semAtividade.herois, [heroi.id]: atualizado } },
    ganho: { ...ganho, pontos },
  };
}
