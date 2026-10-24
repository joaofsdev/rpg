// Saves prontos para os testes de grupo, treino, coleta e recrutamento
import { criarNovoJogo } from "../../save/novoJogo";
import { criarRng } from "../rng";

export const HORA = 60 * 60 * 1000;

// Jogo novo com o 2º herói já na reserva, no nível e com o ouro pedidos
export function jogoComReserva({ nivel = 12, ouro = 100000, agora = 0 } = {}) {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora, rng: criarRng(7) });
  const [principalId, reservaId] = save.grupo;
  const herois = {
    ...save.herois,
    [reservaId]: { ...save.herois[reservaId], nivel },
  };
  return { save: { ...save, ouro, herois, grupo: [principalId] }, principalId, reservaId };
}

export function comChefeVencido(save, zonaId) {
  return {
    ...save,
    progresso: {
      ...save.progresso,
      zonas: { ...save.progresso.zonas, [zonaId]: { ...save.progresso.zonas[zonaId], chefeDerrotado: true } },
    },
  };
}
