import { useEstado, useAcoes } from "../../state/contextos";
import { zonas } from "../../data/zonas";
import { itens } from "../../data/itens";
import { reliquias } from "../../data/reliquias";
import { RARIDADES } from "../../data/equipamentos";
import { NOMES_SLOT, NOMES_ARMA, NOMES_PESO, descreverEfeito } from "../../data/textos";
import { chavesDeEquipamento, progressoDaColecao } from "../../engine/colecao";
import { classeRaridade } from "../common/cores";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";

const CATEGORIAS_ITEM = [
  ["consumivel", "Consumíveis"],
  ["material", "Materiais"],
  ["ingrediente", "Ingredientes"],
  ["refeicao", "Refeições"],
];

function nomeDaChave(chave) {
  const [slot, tipo] = chave.split(":");
  return slot === "arma" ? NOMES_ARMA[tipo] : `${NOMES_SLOT[slot]}, ${NOMES_PESO[tipo]}`;
}

function Contagem({ obtidos, total }) {
  return (
    <span className="text-sm text-texto-2">
      {obtidos}/{total}
    </span>
  );
}

export default function TelaColecao() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const progresso = progressoDaColecao(save);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="titulo text-2xl text-destaque">Coleção</h1>
        <span className="text-destaque-claro">{progresso.total.percentual}% concluída</span>
        <Botao variante="discreto" className="ml-auto" onClick={() => acoes.navegar("mais")}>
          Voltar
        </Botao>
      </header>
      <div className="mb-4">
        <BarraValor atual={progresso.total.obtidos} maximo={progresso.total.total} cor="var(--color-destaque)" rotulo="Conclusão da coleção" />
      </div>

      <section className="painel p-4" aria-labelledby="titulo-reliquias">
        <div className="mb-2 flex items-baseline gap-3">
          <h2 id="titulo-reliquias" className="titulo text-lg">
            Relíquias
          </h2>
          <Contagem {...progresso.reliquias} />
        </div>
        <p className="mb-3 text-sm text-texto-2">
          Cada chefe de zona guarda uma. Ter a relíquia já vale para o grupo todo, em toda batalha.
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.values(reliquias).map((r) => {
            const tem = save.colecao.reliquias.includes(r.id);
            const zona = zonas.find((z) => z.id === r.zonaId);
            return (
              <li key={r.id} className={`rounded border p-3 ${tem ? "border-destaque/60 bg-elevado" : "border-borda"}`}>
                <p className={tem ? "titulo text-destaque" : "titulo text-texto-3"}>{tem ? r.nome : "???"}</p>
                <p className="text-sm text-texto-2">
                  {tem ? <span className="text-sucesso">{descreverEfeito(r.efeito)}</span> : `Guardada pelo chefe de ${zona.nome}.`}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="painel mt-4 p-4" aria-labelledby="titulo-equip-colecao">
        <div className="mb-2 flex items-baseline gap-3">
          <h2 id="titulo-equip-colecao" className="titulo text-lg">
            Equipamentos
          </h2>
          <Contagem {...progresso.equipamentos} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="py-1 text-left font-normal text-texto-3">
                  Tipo
                </th>
                {RARIDADES.map((r) => (
                  <th key={r} scope="col" className={`px-1 py-1 text-center text-xs font-normal ${classeRaridade(r)}`}>
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chavesDeEquipamento().map((chave) => {
                const vistas = save.colecao.equipamentos[chave] || [];
                return (
                  <tr key={chave} className="border-t border-borda/60">
                    <th scope="row" className="py-1 text-left font-normal text-texto-2">
                      {nomeDaChave(chave)}
                    </th>
                    {RARIDADES.map((r) => (
                      <td key={r} className="text-center">
                        {vistas.includes(r) ? (
                          <span className={classeRaridade(r)} aria-label={`${r}: obtido`}>
                            ◆
                          </span>
                        ) : (
                          <span className="text-texto-3" aria-label={`${r}: ainda não`}>
                            ·
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="painel mt-4 p-4" aria-labelledby="titulo-itens-colecao">
        <div className="mb-2 flex items-baseline gap-3">
          <h2 id="titulo-itens-colecao" className="titulo text-lg">
            Itens
          </h2>
          <Contagem {...progresso.itens} />
        </div>
        {CATEGORIAS_ITEM.map(([categoria, nome]) => {
          const daCategoria = Object.values(itens).filter((i) => i.categoria === categoria);
          const obtidos = daCategoria.filter((i) => save.colecao.itens.includes(i.id));
          return (
            <div key={categoria} className="mt-3">
              <h3 className="titulo mb-1 text-sm text-texto-2">
                {nome} ({obtidos.length}/{daCategoria.length})
              </h3>
              <ul className="flex flex-wrap gap-1 text-sm">
                {daCategoria.map((i) => {
                  const tem = save.colecao.itens.includes(i.id);
                  return (
                    <li key={i.id} className={`rounded border px-2 py-0.5 ${tem ? "border-borda-forte" : "border-borda text-texto-3"}`}>
                      {tem ? i.nome : "???"}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
