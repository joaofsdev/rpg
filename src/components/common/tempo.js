import { useEffect, useState } from "react";
import { agoraDoJogo } from "../../state/seletores";

// "1h12", "2h", "35 min", "menos de 1 min"
export function formatarDuracao(ms) {
  const minutos = Math.ceil(Math.max(0, ms) / 60000);
  if (minutos < 1) return "menos de 1 min";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// Relógio para exibir tempos restantes. Só atualiza a tela; o jogo muda pelo reducer.
export function useAgora(intervaloMs = 30000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);
  return agora;
}

// Mesmo relógio do motor (nunca volta), para a tela concordar com o que a coleta vai entregar
export function useAgoraDoJogo(save, intervaloMs) {
  return agoraDoJogo(save, useAgora(intervaloMs));
}
