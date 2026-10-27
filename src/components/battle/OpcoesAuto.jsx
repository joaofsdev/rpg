import { useId } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { AUTO_OPCOES_VIDA_MINIMA, AUTO_OPCOES_LIMITE } from "../../data/constants";

// Paradas opcionais do Auto (SPEC.md §3.13), guardadas na config do aparelho
export default function OpcoesAuto({ recolhivel = false }) {
  const { config } = useEstado();
  const acoes = useAcoes();
  const id = useId();
  const mudar = (chave, valor) => acoes.alterarConfig({ [chave]: valor });

  const campos = (
    <div className="mt-2 grid gap-2 text-sm">
      {[
        ["autoPararChefe", "Parar antes de chefes"],
        ["autoPararInventario", "Parar com o inventário cheio"],
      ].map(([chave, rotulo]) => (
        <label key={chave} className="flex min-h-8 items-center gap-2">
          <input
            type="checkbox"
            checked={config[chave]}
            onChange={() => mudar(chave, !config[chave])}
            className="h-4 w-4 accent-[var(--color-destaque)]"
          />
          <span>{rotulo}</span>
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-vida`} className="text-texto-2">
          Parar com um herói abaixo de
        </label>
        <select
          id={`${id}-vida`}
          value={String(config.autoVidaMinima)}
          onChange={(e) => mudar("autoVidaMinima", Number(e.target.value))}
          className="campo w-auto min-h-8 py-0"
        >
          {AUTO_OPCOES_VIDA_MINIMA.map((v) => (
            <option key={v} value={String(v)}>
              {v ? `${Math.round(v * 100)}% da vida` : "desligado"}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-limite`} className="text-texto-2">
          Parar depois de
        </label>
        <select
          id={`${id}-limite`}
          value={String(config.autoLimiteEncontros)}
          onChange={(e) => mudar("autoLimiteEncontros", Number(e.target.value))}
          className="campo w-auto min-h-8 py-0"
        >
          {AUTO_OPCOES_LIMITE.map((n) => (
            <option key={n} value={String(n)}>
              {n ? `${n} encontros` : "sem limite"}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-texto-3">Derrota, fim da masmorra e chefe vencido sempre param o Auto.</p>
    </div>
  );

  if (!recolhivel) return campos;
  return (
    <details className="mt-2 border-t border-borda pt-2">
      <summary className="cursor-pointer text-sm text-texto-2">Opções do Auto</summary>
      {campos}
    </details>
  );
}
