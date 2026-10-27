import { useEstado } from "../../state/contextos";
import { formatarCronometro, useAgora } from "../common/tempo";
import ControleAuto from "./ControleAuto";
import OpcoesAuto from "./OpcoesAuto";

const TITULOS = { ativo: "Auto ativo", pausado: "Auto pausado", encerrado: "Auto encerrado" };
const MARCAS = { ativo: "●", pausado: "⏸", encerrado: "■" };
const UM_SEGUNDO_MS = 1000;

function mensagem(auto, tela) {
  if (auto.estado !== "ativo") return auto.motivo;
  if (tela === "batalha") return "Os heróis escolhem as ações sozinhos.";
  return "O próximo encontro começa em instantes. Pause ou pare quando quiser.";
}

// Sessão do Auto (SPEC.md §3.13): números só desta sessão, não do save
export default function PainelAuto({ comControles = false }) {
  const { auto, tela } = useEstado();
  const agora = useAgora(UM_SEGUNDO_MS);
  if (auto.estado === "desligado") return null;
  const s = auto.sessao;
  const numeros = s
    ? [
        ["Vitórias", s.vitorias],
        ["Derrotas", s.derrotas],
        ["Ouro", s.ouro],
        ["XP", s.xp],
        ["Itens", s.itens],
      ]
    : [];

  return (
    <section aria-labelledby="titulo-auto" className="painel p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="titulo-auto" className={`titulo text-sm ${auto.estado === "ativo" ? "text-destaque" : "text-texto"}`}>
          <span aria-hidden="true">{MARCAS[auto.estado]} </span>
          {TITULOS[auto.estado]}
        </h2>
        {s && (
          <span className="text-texto-2">
            Encontro {s.encontro} · <span className="sr-only">tempo </span>
            {formatarCronometro(agora - s.inicio)}
          </span>
        )}
        {comControles && auto.estado !== "encerrado" && (
          <div className="ml-auto">
            <ControleAuto />
          </div>
        )}
      </div>
      <p role="status" className="mt-1 text-texto-2">
        {mensagem(auto, tela)}
      </p>
      {s && (
        <dl className="mt-2 grid grid-cols-5 gap-x-2 text-center">
          {numeros.map(([rotulo, valor]) => (
            <div key={rotulo} className="min-w-0">
              <dt className="truncate text-xs text-texto-3">{rotulo}</dt>
              <dd className={rotulo === "Ouro" ? "text-destaque-claro" : "text-texto"}>{valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {auto.estado !== "encerrado" && <OpcoesAuto recolhivel />}
    </section>
  );
}
