// Grupo ativo e reserva (SPEC.md §3.2). Funções puras: retornam { save } ou { erro }.

import { MAX_GRUPO, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { atividadeDoHeroi } from "./atividades";
import { heroisEmBatalha, equipamentosLivres } from "./inventario";

// Como cada atividade aparece nos motivos: [rótulo curto, nome com artigo]
const OCUPACAO = {
  treinoAtributo: ["Em treino", "o treino"],
  treinoGolpe: ["Em treino", "o treino"],
  expedicao: ["Em expedição", "a expedição"],
};

export function heroisDoGrupo(save) {
  return save.grupo.map((id) => save.herois[id]);
}

// Heróis fora do grupo, na ordem em que entraram no save
export function heroisDaReserva(save) {
  return Object.values(save.herois).filter((h) => !save.grupo.includes(h.id));
}

// Enquanto houver batalha ou masmorra em andamento, o grupo não muda (SPEC.md §3.1 regra 11, §3.5)
export function motivoGrupoTravado(save) {
  if (save.batalha) return "Há uma batalha em andamento.";
  if (save.masmorraAtual) return "O grupo está em uma masmorra.";
  return null;
}

export function motivoNaoEntraNoGrupo(save, heroiId) {
  if (!save.herois[heroiId]) return "Herói não encontrado.";
  if (save.grupo.includes(heroiId)) return "Já está no grupo.";
  const atividade = atividadeDoHeroi(save, heroiId);
  if (atividade) return OCUPACAO[atividade.tipo][0];
  const travado = motivoGrupoTravado(save);
  if (travado) return travado;
  if (save.grupo.length >= MAX_GRUPO) return `O grupo está cheio (${MAX_GRUPO}/${MAX_GRUPO}).`;
  return null;
}

export function motivoNaoSaiDoGrupo(save, heroiId) {
  if (!save.grupo.includes(heroiId)) return "Não está no grupo.";
  const travado = motivoGrupoTravado(save);
  if (travado) return travado;
  if (save.grupo.length <= 1) return "O grupo precisa de pelo menos 1 herói.";
  return null;
}

export function colocarNoGrupo(save, heroiId) {
  const motivo = motivoNaoEntraNoGrupo(save, heroiId);
  if (motivo) return { erro: motivo };
  return { save: { ...save, grupo: [...save.grupo, heroiId] } };
}

export function tirarDoGrupo(save, heroiId) {
  const motivo = motivoNaoSaiDoGrupo(save, heroiId);
  if (motivo) return { erro: motivo };
  return { save: { ...save, grupo: save.grupo.filter((id) => id !== heroiId) } };
}

function equipamentosDoHeroi(heroi) {
  return Object.values(heroi.equipamento).filter(Boolean);
}

// Dispensar é para sempre: o herói sai do save e o equipamento dele volta ao inventário
export function motivoNaoDispensa(save, heroiId) {
  const heroi = save.herois[heroiId];
  if (!heroi) return "Herói não encontrado.";
  const atividade = atividadeDoHeroi(save, heroiId);
  if (atividade) {
    const [rotulo, nome] = OCUPACAO[atividade.tipo];
    return `${rotulo}. Colete ou cancele ${nome} antes.`;
  }
  if (heroisEmBatalha(save).includes(heroiId)) return "Está em uma batalha em andamento.";
  if (save.grupo.includes(heroiId)) {
    if (save.masmorraAtual) return "Está em uma masmorra com o grupo.";
    if (save.grupo.length <= 1) return "O último herói do grupo não pode ser dispensado.";
  }
  const espacos = equipamentosLivres(save).length + equipamentosDoHeroi(heroi).length;
  if (espacos > MAX_EQUIPAMENTOS_INVENTARIO) {
    return `Sem espaço no inventário para o equipamento de ${heroi.nome}. Venda algum item antes.`;
  }
  return null;
}

// Retorna { save, heroi, equipamentos } (equipamentos que voltaram ao inventário) ou { erro }
export function dispensarHeroi(save, heroiId) {
  const motivo = motivoNaoDispensa(save, heroiId);
  if (motivo) return { erro: motivo };
  const heroi = save.herois[heroiId];
  const herois = { ...save.herois };
  delete herois[heroiId];
  return {
    save: { ...save, herois, grupo: save.grupo.filter((id) => id !== heroiId) },
    heroi,
    equipamentos: equipamentosDoHeroi(heroi).length,
  };
}
