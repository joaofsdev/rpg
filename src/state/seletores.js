// Dados derivados do estado, prontos para as telas
import { zonas } from "../data/zonas";
import { itens } from "../data/itens";
import { calcularAtributosHeroi } from "../engine/atributos";
import { heroisEmBatalha } from "../engine/inventario";
import { heroisDoGrupo, heroisDaReserva } from "../engine/grupo";
import { relogio } from "../engine/relogio";

export { heroisDoGrupo, heroisDaReserva };

// Grupo primeiro, depois a reserva
export function todosOsHerois(save) {
  return [...heroisDoGrupo(save), ...heroisDaReserva(save)];
}

// Instante usado para exibir tempos restantes: o mesmo relógio que nunca volta do motor
export function agoraDoJogo(save, agora) {
  return relogio(save, agora);
}

export function atributosDoHeroi(save, heroi) {
  return calcularAtributosHeroi(heroi, save.inventario.equipamentos);
}

export function situacaoDasZonas(save) {
  return zonas.map((zona) => {
    const progresso = save.progresso.zonas[zona.id];
    return {
      zona,
      desbloqueada: progresso.desbloqueada,
      jogavel: zona.jogavel,
      encontrosVencidos: Math.min(progresso.encontrosVencidos, zona.encontrosParaChefe),
      chefeDisponivel: progresso.encontrosVencidos >= zona.encontrosParaChefe,
      chefeDerrotado: progresso.chefeDerrotado,
    };
  });
}

export function itensDeBatalha(save) {
  return Object.entries(save.inventario.itens)
    .filter(([id, qtd]) => qtd > 0 && itens[id]?.usoEmBatalha)
    .map(([id, qtd]) => ({ item: itens[id], quantidade: qtd }));
}

export function itensEmpilhaveis(save) {
  return Object.entries(save.inventario.itens)
    .filter(([id, qtd]) => qtd > 0 && itens[id])
    .map(([id, qtd]) => ({ item: itens[id], quantidade: qtd }));
}

export function heroiTravado(save, heroiId) {
  return heroisEmBatalha(save).includes(heroiId);
}
