import { useEffect, useMemo, useReducer, useRef } from "react";
import { reducer, criarEstadoInicial } from "./reducer";
import { criarAcoes } from "./criarAcoes";
import { EstadoContext, AcoesContext } from "./contextos";
import { gravarSlot, gravarConfig } from "../save/armazenamento";

const ATRASO_GRAVACAO_MS = 300;
const INTERVALO_RELOGIO_MS = 30000;

export default function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, criarEstadoInicial);
  const acoes = useMemo(() => criarAcoes(dispatch, window.localStorage), []);
  const pendente = useRef(null);

  useEffect(() => {
    acoes.iniciar();
  }, [acoes]);

  // Persistência do save fora do reducer: debounce + gravação imediata ao sair da página
  useEffect(() => {
    if (state.slotAtivo === null || !state.save) return;
    const gravar = () => {
      pendente.current = null;
      try {
        gravarSlot(window.localStorage, state.slotAtivo, state.save, { agora: Date.now() });
      } catch (erro) {
        acoes.avisar(`Não foi possível salvar o jogo: ${erro.message}`);
      }
    };
    pendente.current = gravar;
    const timer = setTimeout(gravar, ATRASO_GRAVACAO_MS);
    return () => clearTimeout(timer);
  }, [state.save, state.slotAtivo, acoes]);

  useEffect(() => {
    const gravarAgora = () => pendente.current?.();
    const aoMudarVisibilidade = () => document.visibilityState === "hidden" && gravarAgora();
    window.addEventListener("pagehide", gravarAgora);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      window.removeEventListener("pagehide", gravarAgora);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, []);

  // Relógio das atividades (SPEC.md §3.9, §6.6): só registra o instante atual no save, para o
  // resumo de retorno e o relógio que não volta. O progresso é sempre calculado por timestamps.
  const slotAberto = state.slotAtivo !== null && Boolean(state.save);
  useEffect(() => {
    if (!slotAberto) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") acoes.marcarRelogio();
    }, INTERVALO_RELOGIO_MS);
    const aoMudarVisibilidade = () => document.visibilityState === "visible" && acoes.voltouAoJogo();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [slotAberto, acoes]);

  useEffect(() => {
    if (state.tela === "carregando") return;
    try {
      gravarConfig(window.localStorage, state.config);
    } catch {
      // Configuração é conveniência: sem storage, o jogo segue com os valores atuais
    }
  }, [state.config, state.tela]);

  return (
    <AcoesContext.Provider value={acoes}>
      <EstadoContext.Provider value={state}>{children}</EstadoContext.Provider>
    </AcoesContext.Provider>
  );
}
