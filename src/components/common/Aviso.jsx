import { useEffect } from "react";
import { useEstado, useAcoes } from "../../state/contextos";

const DURACAO_AVISO_MS = 4500;

export default function Aviso() {
  const { aviso } = useEstado();
  const acoes = useAcoes();

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(acoes.limparAviso, DURACAO_AVISO_MS);
    return () => clearTimeout(timer);
  }, [aviso, acoes]);

  if (!aviso) return null;
  return (
    <div
      role="status"
      className="painel fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 py-2 text-sm sm:bottom-6"
    >
      <span>{aviso}</span>
      <button className="botao botao-discreto ml-2 min-h-0 px-2 py-0" onClick={acoes.limparAviso}>
        Fechar
      </button>
    </div>
  );
}
