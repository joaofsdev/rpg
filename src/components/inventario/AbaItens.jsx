import { useState } from "react";
import { iconesItens } from "../../data/sprites";
import { itensPorCategoria } from "../../state/seletoresInventario";

function Item({ item, quantidade, cheia, origem }) {
  return (
    <li className="flex items-start gap-3 rounded border border-borda bg-fundo/40 p-2">
      {iconesItens[item.id] ? (
        <img src={iconesItens[item.id]} alt="" className="h-8 w-8 shrink-0" style={{ imageRendering: "pixelated" }} />
      ) : (
        <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded bg-elevado" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{item.nome}</span>
          <span className="shrink-0">
            <span aria-hidden="true" className="text-texto-2">×</span>
            <span className="sr-only">quantidade: </span>
            {quantidade}
          </span>
        </span>
        <span className="block text-sm text-texto-2">{item.descricao}</span>
        {(origem || cheia) && (
          <span className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-texto-3">
            {origem && <span>Vem de: {origem}</span>}
            {cheia && <span className="text-vigor">Pilha cheia ({item.empilhaAte}): o excedente é vendido</span>}
          </span>
        )}
      </span>
    </li>
  );
}

export default function AbaItens({ save }) {
  const [categoria, setCategoria] = useState("todas");
  const categorias = itensPorCategoria(save);
  const visiveis = categoria === "todas" ? categorias : categorias.filter((c) => c.id === categoria);
  const total = categorias.reduce((s, c) => s + c.itens.length, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-2">Itens empilháveis não ocupam os espaços dos equipamentos.</p>

      <fieldset>
        <legend className="sr-only">Mostrar categoria</legend>
        <div className="grid grid-cols-2 gap-1 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap">
          {[
            { id: "todas", nome: "Todas", quantidade: total },
            ...categorias.map((c) => ({ id: c.id, nome: c.nome, quantidade: c.itens.length })),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoria === c.id}
              onClick={() => setCategoria(c.id)}
              className={`botao min-h-10 px-3 ${categoria === c.id ? "botao-secundario text-destaque" : "botao-discreto border-borda"}`}
            >
              {c.nome} ({c.quantidade})
            </button>
          ))}
        </div>
      </fieldset>

      {visiveis.map((c) => (
        <section key={c.id} className="painel p-4" aria-labelledby={`cat-${c.id}`}>
          <h2 id={`cat-${c.id}`} className="titulo text-base">
            {c.nome}
          </h2>
          <p className="mb-3 text-sm text-texto-2">{c.uso}</p>
          {c.itens.length === 0 ? (
            <p className="text-sm text-texto-3">Nada por enquanto. {c.dica}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {c.itens.map((i) => (
                <Item key={i.item.id} {...i} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
