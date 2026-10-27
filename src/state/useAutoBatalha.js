// Orquestrador do Auto (SPEC.md §3.13): liga o agendador ao estado global. O temporizador só dá o
// ritmo; com a página oculta o Auto continua no ritmo que o navegador permitir (agendadorAuto.js).

import { useEffect, useRef } from "react";
import { useEstado, useAcoes } from "./contextos";
import { criarAgendadorAuto } from "./agendadorAuto";
import { duracaoDaFila } from "../components/battle/duracoes";

export function useAutoBatalha() {
  const estado = useEstado();
  const acoes = useAcoes();
  const agendador = useRef(null);

  useEffect(() => {
    const novo = criarAgendadorAuto({ acoes, documento: document, duracaoDaFila });
    novo.iniciar();
    agendador.current = novo;
    return () => {
      novo.encerrar();
      agendador.current = null;
    };
  }, [acoes]);

  useEffect(() => {
    agendador.current?.atualizar(estado);
  }, [estado]);
}
