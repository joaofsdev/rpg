import { useEstado, useAcoes } from "../../state/contextos";
import Botao from "../common/Botao";

// Botões do Auto (SPEC.md §3.13): "Auto" liga; "Pausar" e "Parar Auto" são as únicas ordens de
// interrupção e dizem o que fazem (o estado aparece no painel do Auto); "Retomar Auto" continua do
// estado atual; parar encerra a sessão (as recompensas já estão guardadas).
export default function ControleAuto() {
  const { auto } = useEstado();
  const acoes = useAcoes();

  if (auto.estado === "ativo" || auto.estado === "pausado") {
    const ativo = auto.estado === "ativo";
    return (
      <div role="group" aria-label="Auto" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => (ativo ? acoes.pausarAuto() : acoes.retomarAuto())}
          className={`botao botao-secundario min-h-8 px-3 ${ativo ? "" : "text-destaque"}`}
        >
          <span aria-hidden="true">{ativo ? "⏸" : "▶"}</span>
          {ativo ? "Pausar" : "Retomar Auto"}
        </button>
        <Botao variante="discreto" className="min-h-8 px-2" onClick={() => acoes.pararAuto()}>
          Parar Auto
        </Botao>
      </div>
    );
  }

  return (
    <button
      type="button"
      title="Os heróis escolhem as ações sozinhos e o próximo encontro começa após cada vitória"
      onClick={() => acoes.ligarAuto()}
      className="botao botao-secundario min-h-8 px-3"
    >
      <span aria-hidden="true">▶</span>
      Auto
    </button>
  );
}
