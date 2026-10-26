import { classeRaridade, fundoRaridade } from "../common/cores";
import { categoriaDoEquipamento, nomeDoEquipamento } from "../common/descricoes";

const TECLAS_NAVEGACAO = ["ArrowDown", "ArrowUp", "Home", "End"];

function LinhaEquipamento({ entrada, selecionado, aoEscolher }) {
  const { item, dono } = entrada;
  const { categoria, tipo } = categoriaDoEquipamento(item);
  return (
    <li className="border-b border-borda last:border-b-0">
      <button
        type="button"
        data-item-id={item.id}
        aria-current={selecionado ? "true" : undefined}
        title={nomeDoEquipamento(item)}
        onClick={() => aoEscolher(item.id, { abrir: true })}
        className={`flex min-h-14 w-full items-stretch gap-3 px-3 py-2 text-left focus-visible:-outline-offset-2 ${
          selecionado ? "bg-elevado shadow-[inset_3px_0_0_var(--color-destaque)]" : "hover:bg-elevado/60"
        }`}
      >
        <span aria-hidden="true" className={`w-1.5 shrink-0 rounded-sm ${fundoRaridade(item.raridade)}`} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="line-clamp-2 min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
              {item.nome}
              {item.aprimoramento > 0 && <span className="text-destaque"> +{item.aprimoramento}</span>}
            </span>
            <span className="shrink-0 text-sm text-texto-2">
              <span aria-hidden="true">nv </span>
              <span className="sr-only">nível </span>
              <span className="text-base text-texto">{item.nivel}</span>
            </span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-texto-2">
            <span className={`font-semibold ${classeRaridade(item.raridade)}`}>{item.raridade}</span>
            <span aria-hidden="true">·</span>
            <span>
              {categoria} · {tipo}
            </span>
            {dono && (
              <span className="ml-auto max-w-[11rem] truncate rounded border border-destaque/60 px-1.5 text-texto">
                <span aria-hidden="true">✦ </span>Em uso: {dono.nome}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

// Lista de equipamentos. Setas, Home e End movem o foco e a seleção; Enter ou toque abre.
export default function ListaEquipamentos({ entradas, selecionadoId, aoEscolher, listaRef }) {
  const aoTeclar = (e) => {
    if (!TECLAS_NAVEGACAO.includes(e.key)) return;
    const botoes = [...e.currentTarget.querySelectorAll("button[data-item-id]")];
    const atual = botoes.indexOf(document.activeElement);
    if (atual < 0) return;
    e.preventDefault();
    const destino = {
      ArrowDown: Math.min(atual + 1, botoes.length - 1),
      ArrowUp: Math.max(atual - 1, 0),
      Home: 0,
      End: botoes.length - 1,
    }[e.key];
    botoes[destino].focus();
    aoEscolher(botoes[destino].dataset.itemId, { abrir: false });
  };

  return (
    <ul
      ref={listaRef}
      className="painel overflow-hidden"
      aria-label={`Equipamentos encontrados: ${entradas.length}`}
      aria-describedby="dica-lista"
      onKeyDown={aoTeclar}
    >
      {entradas.map((entrada) => (
        <LinhaEquipamento
          key={entrada.item.id}
          entrada={entrada}
          selecionado={entrada.item.id === selecionadoId}
          aoEscolher={aoEscolher}
        />
      ))}
    </ul>
  );
}
