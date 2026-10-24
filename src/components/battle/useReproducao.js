// Reproduz os eventos de uma ação em sequência. Timers aqui só controlam a animação:
// o resultado já foi decidido e salvo pelo motor (SPEC.md §6.2).

import { useEffect, useRef, useState } from "react";
import {
  criarExibicao,
  aplicarEvento,
  efeitosDoEvento,
  duracaoEvento,
  descreverEvento,
  PAUSA_ENTRE_ACOES_MS,
} from "./exibicao";

const LINHAS_REGISTRO = 6;

function registroDoLog(batalha, exibicao) {
  return (batalha?.log || [])
    .map((e) => descreverEvento(e, exibicao))
    .filter(Boolean)
    .slice(-LINHAS_REGISTRO);
}

// base: batalha antes dos eventos; final: batalha estável atual (ou encerrada)
export function useReproducao({ base, final, eventos, velocidade, aoConcluir }) {
  const [estado, setEstado] = useState(() => {
    const exibicao = criarExibicao(final);
    return { exibicao, efeitos: [], reproduzindo: false, registro: registroDoLog(final, exibicao) };
  });
  const velocidadeRef = useRef(velocidade);
  const aoConcluirRef = useRef(aoConcluir);
  const adiantarRef = useRef(() => {});
  velocidadeRef.current = velocidade;
  aoConcluirRef.current = aoConcluir;

  useEffect(() => {
    if (eventos.length === 0) {
      const exibicao = criarExibicao(final);
      setEstado({ exibicao, efeitos: [], reproduzindo: false, registro: registroDoLog(final, exibicao) });
      adiantarRef.current = () => {};
      return;
    }

    let exibicao = criarExibicao(base);
    let registro = registroDoLog(base, exibicao);
    let indice = 0;
    let contador = 0;
    let timer = null;
    let encerrado = false;
    setEstado({ exibicao, efeitos: [], reproduzindo: true, registro });

    const concluir = () => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(timer);
      setEstado((s) => ({ ...s, exibicao, efeitos: [], reproduzindo: false, registro }));
      aoConcluirRef.current();
    };

    const processar = (evento) => {
      exibicao = aplicarEvento(exibicao, evento);
      const linha = descreverEvento(evento, exibicao);
      if (linha) registro = [...registro, linha].slice(-LINHAS_REGISTRO);
    };

    const passo = () => {
      if (encerrado) return;
      const novos = [];
      let espera = 0;
      // Eventos sem duração (recurso, intenção…) são aplicados juntos com o próximo
      while (indice < eventos.length && espera === 0) {
        const evento = eventos[indice++];
        processar(evento);
        espera = duracaoEvento(evento, velocidadeRef.current);
        const duracaoEfeito = Math.max(espera, 700 / velocidadeRef.current);
        for (const efeito of efeitosDoEvento(evento)) {
          novos.push({ ...efeito, id: `${indice}-${contador++}`, duracao: duracaoEfeito });
        }
        if (evento.tipo === "golpeUsado" || evento.tipo === "itemUsado") {
          espera += PAUSA_ENTRE_ACOES_MS / velocidadeRef.current;
        }
      }
      setEstado((s) => ({ ...s, exibicao, registro, efeitos: [...s.efeitos.slice(-30), ...novos] }));
      if (indice >= eventos.length) timer = setTimeout(concluir, espera);
      else timer = setTimeout(passo, espera);
    };

    adiantarRef.current = () => {
      while (indice < eventos.length) processar(eventos[indice++]);
      concluir();
    };

    passo();
    return () => {
      encerrado = true;
      clearTimeout(timer);
    };
    // A fila é identificada pelo array de eventos; base/final acompanham essa mesma ação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventos]);

  return { ...estado, adiantar: () => adiantarRef.current() };
}
