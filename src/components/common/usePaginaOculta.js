import { useSyncExternalStore } from "react";

// A página está oculta (outra aba, janela minimizada ou coberta)? Só para a interface decidir o que
// desenhar; o Auto não pausa por isso (SPEC.md §3.13).
function assinar(aoMudar) {
  document.addEventListener("visibilitychange", aoMudar);
  return () => document.removeEventListener("visibilitychange", aoMudar);
}

const estaOculta = () => document.visibilityState === "hidden";

export function usePaginaOculta() {
  return useSyncExternalStore(assinar, estaOculta);
}
