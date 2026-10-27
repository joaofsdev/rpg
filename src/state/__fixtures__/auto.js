// Auxiliares dos testes do Auto (auto.test.js e agendadorAuto.test.js)
import { reducer, criarEstadoInicial } from "../reducer";
import { CONFIG_PADRAO } from "../../save/armazenamento";

export const SEM_PARADAS = { autoPararChefe: false, autoPararInventario: false, autoVidaMinima: 0, autoLimiteEncontros: 0 };

export function aplicar(state, ...acoes) {
  return acoes.reduce(reducer, state);
}

// Jogo novo no slot 0 com heróis fortes para o Cemitério
export function jogo({ nivel = 30, config = {} } = {}) {
  let state = reducer(criarEstadoInicial(), { type: "INICIADO", slots: [], config: { ...CONFIG_PADRAO, ...config } });
  state = reducer(state, { type: "ABRIR_NOVO_JOGO", slot: 0, semente: 5 });
  state = reducer(state, { type: "CRIAR_JOGO", nomeHeroi: "Ana", classeId: state.novoJogo.classes[0], agora: 1000, semente: 9 });
  const herois = Object.fromEntries(Object.entries(state.save.herois).map(([id, h]) => [id, { ...h, nivel }]));
  return { ...state, save: { ...state.save, herois } };
}

// Começa um encontro e deixa a animação de abertura terminar, como a interface faria
export const explorar = (state, semente = 3) =>
  aplicar(state, { type: "INICIAR_ENCONTRO", zonaId: "cemiterio", semente }, { type: "FILA_CONCLUIDA" });
export const ligar = (state) => reducer(state, { type: "AUTO_LIGAR", agora: 0 });
