// Barra de vida/recurso. A parte da frente pula para o novo valor; a "fantasma" desce devagar.
export default function BarraValor({ atual, maximo, cor, rotulo, fina = false }) {
  const pct = maximo > 0 ? Math.max(0, Math.min(100, (atual / maximo) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={atual}
      className={`relative w-full overflow-hidden rounded-sm border border-black/60 bg-black/50 ${fina ? "h-1.5" : "h-2.5"}`}
    >
      <div className="barra-fantasma absolute inset-y-0 left-0 bg-[#f3e2b8]/70" style={{ width: `${pct}%` }} />
      <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}
