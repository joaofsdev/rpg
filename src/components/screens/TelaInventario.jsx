import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDoGrupo, itensEmpilhaveis, heroiTravado } from "../../state/seletores";
import { classesHeroi } from "../../data/classesHeroi";
import { iconesItens } from "../../data/sprites";
import { ATRIBUTOS, MAX_EQUIPAMENTOS_INVENTARIO } from "../../data/constants";
import { NOMES_ATRIBUTO } from "../../data/textos";
import { podeEquipar, precoVenda } from "../../engine/itens";
import { donoDoEquipamento, equipamentosLivres } from "../../engine/inventario";
import { bonusDoEquipamento } from "../../engine/atributos";
import { classeRaridade } from "../common/cores";
import { tipoDoEquipamento } from "../common/descricoes";
import Botao from "../common/Botao";

const CATEGORIAS = { consumivel: "Consumíveis", material: "Materiais", ingrediente: "Ingredientes" };


function Bonus({ item, comparado }) {
  const bonus = bonusDoEquipamento(item);
  const outro = comparado ? bonusDoEquipamento(comparado) : null;
  const linhas = ATRIBUTOS.filter((a) => bonus[a] !== 0 || (outro && outro[a] !== 0));
  if (linhas.length === 0) return <p className="text-sm text-texto-3">Sem bônus.</p>;
  return (
    <ul className="text-sm">
      {linhas.map((a) => {
        const diferenca = outro ? bonus[a] - outro[a] : 0;
        return (
          <li key={a} className="flex justify-between">
            <span className="text-texto-2">{NOMES_ATRIBUTO[a]}</span>
            <span>
              +{bonus[a]}
              {outro && diferenca !== 0 && (
                <span className={diferenca > 0 ? "text-sucesso" : "text-perigo"}>
                  {" "}
                  ({diferenca > 0 ? "+" : ""}
                  {diferenca})
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DetalheEquipamento({ save, item, acoes }) {
  const herois = heroisDoGrupo(save);
  const dono = donoDoEquipamento(save, item.id);
  const [heroiId, setHeroiId] = useState(
    herois.find((h) => podeEquipar(h.classeId, item) && h.id !== dono?.id)?.id ?? herois[0].id,
  );
  const heroi = save.herois[heroiId];
  const atual = heroi.equipamento[item.slot] ? save.inventario.equipamentos[heroi.equipamento[item.slot]] : null;
  const compativel = podeEquipar(heroi.classeId, item);
  const travado = heroiTravado(save, heroi.id) || (dono && heroiTravado(save, dono.id));

  let motivo = null;
  if (dono?.id === heroi.id) motivo = `${heroi.nome} já usa este item.`;
  else if (!compativel) motivo = `${classesHeroi[heroi.classeId].nome} não usa ${tipoDoEquipamento(item)}.`;
  else if (travado) motivo = "Heróis em batalha não trocam equipamento.";

  return (
    <section className="painel p-4" aria-labelledby="titulo-item">
      <h2 id="titulo-item" className={`titulo text-lg ${classeRaridade(item.raridade)}`}>
        {item.nome}
      </h2>
      <p className="mb-3 text-sm text-texto-2">
        {item.raridade}, {tipoDoEquipamento(item)}, nível {item.nivel}
        {dono ? `. Usado por ${dono.nome}.` : "."}
      </p>

      <fieldset className="mb-3">
        <legend className="mb-1 text-sm text-texto-2">Comparar com</legend>
        <div className="flex flex-wrap gap-1">
          {herois.map((h) => (
            <button
              key={h.id}
              aria-pressed={h.id === heroiId}
              onClick={() => setHeroiId(h.id)}
              className={`botao min-h-8 px-2 ${h.id === heroiId ? "botao-secundario text-destaque" : "botao-discreto"}`}
            >
              {h.nome}
            </button>
          ))}
        </div>
      </fieldset>

      <Bonus item={item} comparado={atual && atual.id !== item.id ? atual : null} />
      {atual && atual.id !== item.id && (
        <p className="mt-1 text-xs text-texto-3">Entre parênteses: diferença para {atual.nome}.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Botao variante="primario" disabled={Boolean(motivo)} onClick={() => acoes.equipar(heroi.id, item.id)}>
          Equipar em {heroi.nome}
        </Botao>
        <Botao disabled={Boolean(dono)} onClick={() => acoes.venderEquipamento(item.id)}>
          Vender por {precoVenda(item)} ouro
        </Botao>
      </div>
      {motivo && <p className="mt-2 text-sm text-texto-3">{motivo}</p>}
      {dono && <p className="mt-1 text-sm text-texto-3">Para vender, tire o item de {dono.nome} antes.</p>}
    </section>
  );
}

export default function TelaInventario() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const [aba, setAba] = useState("equipamentos");
  const equipamentos = Object.values(save.inventario.equipamentos).sort(
    (a, b) => b.nivel - a.nivel || a.nome.localeCompare(b.nome),
  );
  const [selecionadoId, setSelecionadoId] = useState(equipamentos[0]?.id ?? null);
  const selecionado = save.inventario.equipamentos[selecionadoId] ?? null;
  const livres = equipamentosLivres(save).length;
  const empilhaveis = itensEmpilhaveis(save);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <div role="tablist" aria-label="Inventário" className="mb-3 flex gap-1">
        <button
          role="tab"
          aria-selected={aba === "equipamentos"}
          onClick={() => setAba("equipamentos")}
          className={`botao ${aba === "equipamentos" ? "botao-secundario text-destaque" : "botao-discreto"}`}
        >
          Equipamentos ({livres}/{MAX_EQUIPAMENTOS_INVENTARIO})
        </button>
        <button
          role="tab"
          aria-selected={aba === "itens"}
          onClick={() => setAba("itens")}
          className={`botao ${aba === "itens" ? "botao-secundario text-destaque" : "botao-discreto"}`}
        >
          Itens
        </button>
        <span className="ml-auto self-center text-destaque-claro">{save.ouro} ouro</span>
      </div>

      {aba === "equipamentos" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_20rem]">
          <ul className="painel max-h-[60vh] overflow-y-auto" aria-label="Equipamentos">
            {equipamentos.map((e) => {
              const dono = donoDoEquipamento(save, e.id);
              return (
                <li key={e.id} className="border-b border-borda last:border-b-0">
                  <button
                    onClick={() => setSelecionadoId(e.id)}
                    aria-current={e.id === selecionadoId ? "true" : undefined}
                    className={`flex w-full items-baseline gap-2 px-3 py-2 text-left ${e.id === selecionadoId ? "bg-elevado" : "hover:bg-elevado/60"}`}
                  >
                    <span className={`flex-1 truncate ${classeRaridade(e.raridade)}`}>{e.nome}</span>
                    <span className="hidden text-sm text-texto-3 sm:inline">{tipoDoEquipamento(e)}</span>
                    <span className="w-12 text-right text-sm text-texto-2">nv {e.nivel}</span>
                    {dono && <span className="w-20 truncate text-right text-xs text-texto-3">{dono.nome}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {selecionado ? (
            <DetalheEquipamento key={selecionado.id} save={save} item={selecionado} acoes={acoes} />
          ) : (
            <p className="text-texto-2">Nenhum equipamento ainda. Eles caem dos inimigos.</p>
          )}
        </div>
      )}

      {aba === "itens" && (
        <div className="space-y-4">
          {Object.entries(CATEGORIAS).map(([categoria, titulo]) => {
            const lista = empilhaveis.filter((i) => i.item.categoria === categoria);
            return (
              <section key={categoria} className="painel p-4" aria-labelledby={`cat-${categoria}`}>
                <h2 id={`cat-${categoria}`} className="titulo mb-2 text-sm">
                  {titulo}
                </h2>
                {lista.length === 0 ? (
                  <p className="text-sm text-texto-3">Nada por enquanto.</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {lista.map(({ item, quantidade }) => (
                      <li key={item.id} className="flex items-center gap-2">
                        {iconesItens[item.id] ? (
                          <img src={iconesItens[item.id]} alt="" className="h-8 w-8" style={{ imageRendering: "pixelated" }} />
                        ) : (
                          <span className="h-8 w-8" />
                        )}
                        <span>
                          <span className="block">
                            {item.nome} <span className="text-texto-2">×{quantidade}</span>
                          </span>
                          <span className="text-sm text-texto-3">{item.descricao}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
