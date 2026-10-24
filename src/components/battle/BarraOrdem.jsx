// Ordem de turnos da rodada atual (SPEC.md §3.1 regra 2)
export default function BarraOrdem({ exibicao }) {
  const indiceAtivo = exibicao.ordem.indexOf(exibicao.ativoId);
  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label={`Ordem da rodada ${exibicao.rodada}`}>
      {exibicao.ordem.map((id, i) => {
        const c = exibicao.combatentes[id];
        const ativo = id === exibicao.ativoId;
        const jaAgiu = indiceAtivo >= 0 && i < indiceAtivo;
        return (
          <li
            key={id}
            aria-current={ativo ? "step" : undefined}
            className={`rounded border px-1.5 py-0.5 ${
              ativo
                ? "border-destaque bg-destaque/15 text-destaque"
                : c.nocauteado
                  ? "border-transparent text-texto-3 line-through"
                  : jaAgiu
                    ? "border-transparent text-texto-3"
                    : c.lado === "herois"
                      ? "border-borda-forte text-texto"
                      : "border-perigo/40 text-texto-2"
            }`}
          >
            {c.nome}
          </li>
        );
      })}
    </ol>
  );
}
