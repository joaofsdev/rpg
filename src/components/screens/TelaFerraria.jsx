import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { todosOsHerois } from "../../state/seletores";
import { zonas } from "../../data/zonas";
import { itens } from "../../data/itens";
import { classesHeroi } from "../../data/classesHeroi";
import { ATRIBUTOS, SLOTS_EQUIPAMENTO } from "../../data/constants";
import { APRIMORAMENTO_MAX, FORJA } from "../../data/ferraria";
import { NOMES_ATRIBUTO, NOMES_SLOT, NOMES_ARMA, NOMES_PESO } from "../../data/textos";
import { tiposDoSlot, custoDaForja, motivoNaoForja, custoDoAprimoramento, motivoNaoAprimora } from "../../engine/ferraria";
import { bonusDoEquipamento } from "../../engine/atributos";
import { donoDoEquipamento } from "../../engine/inventario";
import { classeRaridade } from "../common/cores";
import { tipoDoEquipamento, nomeDoEquipamento } from "../common/descricoes";
import Botao from "../common/Botao";

function Escolha({ legenda, opcoes, valor, aoEscolher }) {
  return (
    <fieldset className="mb-3">
      <legend className="mb-1 text-sm text-texto-2">{legenda}</legend>
      <div className="flex flex-wrap gap-1">
        {opcoes.map(({ id, nome }) => (
          <button
            key={id}
            aria-pressed={valor === id}
            onClick={() => aoEscolher(id)}
            className={`botao min-h-8 px-2 ${valor === id ? "botao-secundario text-destaque" : "botao-discreto"}`}
          >
            {nome}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Custo({ save, custo }) {
  return (
    <ul className="text-sm">
      {custo.materiais.map(({ itemId, qtd }) => {
        const tem = save.inventario.itens[itemId] || 0;
        return (
          <li key={itemId} className={tem >= qtd ? "" : "text-perigo"}>
            {qtd} {itens[itemId].nome} <span className="text-texto-3">(tem {tem})</span>
          </li>
        );
      })}
      <li className={save.ouro >= custo.ouro ? "text-destaque-claro" : "text-perigo"}>{custo.ouro} ouro</li>
    </ul>
  );
}

function quemUsa(slot, tipo) {
  return Object.values(classesHeroi)
    .filter((c) => (slot === "arma" ? c.armasPermitidas : c.armadurasPermitidas).includes(tipo))
    .map((c) => c.nome);
}

function Forjar({ save, acoes }) {
  const abertas = zonas.filter((z) => save.progresso.zonas[z.id]?.desbloqueada);
  const [zonaId, setZonaId] = useState(abertas[abertas.length - 1].id);
  const [slot, setSlot] = useState("arma");
  const [tipo, setTipo] = useState(tiposDoSlot("arma")[0]);
  const zona = zonas.find((z) => z.id === zonaId);
  const tipoValido = tiposDoSlot(slot).includes(tipo) ? tipo : tiposDoSlot(slot)[0];
  const escolherSlot = (novo) => {
    setSlot(novo);
    setTipo(tiposDoSlot(novo)[0]);
  };
  const custo = custoDaForja(zona, slot);
  const motivo = motivoNaoForja(save, { zonaId, slot, tipo: tipoValido });
  const usam = quemUsa(slot, tipoValido);

  return (
    <>
      <p className="mb-3 text-sm text-texto-2">
        Escolha o tipo e a zona dos materiais. O item sai no nível máximo da zona, com raridade{" "}
        {FORJA.raridadeMinima} ou melhor.
      </p>
      <Escolha legenda="Materiais de" opcoes={abertas.map((z) => ({ id: z.id, nome: z.nome }))} valor={zonaId} aoEscolher={setZonaId} />
      <Escolha legenda="Peça" opcoes={SLOTS_EQUIPAMENTO.map((s) => ({ id: s, nome: NOMES_SLOT[s] }))} valor={slot} aoEscolher={escolherSlot} />
      <Escolha
        legenda={slot === "arma" ? "Arma" : "Peso"}
        opcoes={tiposDoSlot(slot).map((t) => ({ id: t, nome: slot === "arma" ? NOMES_ARMA[t] : NOMES_PESO[t] }))}
        valor={tipoValido}
        aoEscolher={setTipo}
      />
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3 rounded border border-borda bg-elevado p-3">
        <div className="text-sm">
          <p className="titulo">
            {NOMES_SLOT[slot]}: {slot === "arma" ? NOMES_ARMA[tipoValido] : NOMES_PESO[tipoValido]}, nível {zona.nivelMax}
          </p>
          <p className="text-texto-2">{usam.length ? `Serve para ${usam.join(", ")}.` : "Nenhuma classe usa este tipo."}</p>
        </div>
        <Custo save={save} custo={custo} />
        <div>
          <Botao variante="primario" disabled={Boolean(motivo)} onClick={() => acoes.forjar(zonaId, slot, tipoValido)}>
            Forjar
          </Botao>
          {motivo && <p className="mt-1 text-sm text-texto-3">{motivo}</p>}
        </div>
      </div>
    </>
  );
}

function Aprimorar({ save, acoes }) {
  // Equipados primeiro (pelo grupo e reserva), depois os livres do inventário
  const equipados = todosOsHerois(save).flatMap((h) =>
    SLOTS_EQUIPAMENTO.map((s) => h.equipamento[s]).filter(Boolean),
  );
  const livres = Object.keys(save.inventario.equipamentos).filter((id) => !equipados.includes(id));
  const ids = [...equipados, ...livres];
  const [escolhido, setEscolhido] = useState(ids[0] ?? null);
  const item = save.inventario.equipamentos[escolhido] ?? null;

  if (ids.length === 0) return <p className="text-texto-2">Nenhum equipamento no inventário.</p>;

  const custo = item ? custoDoAprimoramento(item) : null;
  const motivo = item ? motivoNaoAprimora(save, item.id) : "Escolha um equipamento.";
  const antes = item ? bonusDoEquipamento(item) : null;
  const depois = item && custo ? bonusDoEquipamento({ ...item, aprimoramento: custo.alvo }) : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ul className="max-h-[28rem] divide-y divide-borda overflow-y-auto rounded border border-borda">
        {ids.map((id) => {
          const e = save.inventario.equipamentos[id];
          const dono = donoDoEquipamento(save, id);
          return (
            <li key={id}>
              <button
                aria-pressed={id === escolhido}
                onClick={() => setEscolhido(id)}
                className={`flex w-full flex-col px-3 py-2 text-left ${id === escolhido ? "bg-elevado" : "hover:bg-elevado/60"}`}
              >
                <span className={classeRaridade(e.raridade)}>{nomeDoEquipamento(e)}</span>
                <span className="text-xs text-texto-3">
                  {tipoDoEquipamento(e)}, nível {e.nivel}
                  {dono ? ` · com ${dono.nome}` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {item && (
        <section aria-labelledby="titulo-aprimorar" className="rounded border border-borda bg-elevado p-3">
          <h3 id="titulo-aprimorar" className={`titulo ${classeRaridade(item.raridade)}`}>
            {nomeDoEquipamento(item)}
          </h3>
          <p className="mb-2 text-sm text-texto-2">
            Aprimoramento {item.aprimoramento || 0}/{APRIMORAMENTO_MAX}. Nunca falha: cada nível soma 8% a cada bônus (no mínimo +1).
          </p>
          <table className="mb-3 w-full text-sm">
            <tbody>
              {ATRIBUTOS.filter((a) => antes[a] !== 0).map((a) => (
                <tr key={a} className="border-b border-borda/60 last:border-b-0">
                  <th scope="row" className="py-1 text-left font-normal text-texto-2">
                    {NOMES_ATRIBUTO[a]}
                  </th>
                  <td className="py-1 text-right">+{antes[a]}</td>
                  {depois && (
                    <td className="w-20 py-1 text-right text-sucesso">
                      → +{depois[a]}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {custo ? (
            <>
              <Custo save={save} custo={custo} />
              <Botao variante="primario" className="mt-2" disabled={Boolean(motivo)} onClick={() => acoes.aprimorar(item.id)}>
                Aprimorar para +{custo.alvo}
              </Botao>
            </>
          ) : null}
          {motivo && <p className="mt-1 text-sm text-texto-3">{motivo}</p>}
        </section>
      )}
    </div>
  );
}

export default function TelaFerraria() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const [aba, setAba] = useState("forjar");

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="titulo text-2xl text-destaque">Ferraria</h1>
        <span className="text-destaque-claro">{save.ouro} ouro</span>
        <Botao variante="discreto" className="ml-auto" onClick={() => acoes.navegar("mais")}>
          Voltar
        </Botao>
      </header>
      <div role="tablist" aria-label="Ferraria" className="mb-3 flex gap-1">
        {[
          ["forjar", "Forjar"],
          ["aprimorar", "Aprimorar"],
        ].map(([id, nome]) => (
          <button
            key={id}
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`botao min-h-8 px-3 ${aba === id ? "botao-secundario text-destaque" : "botao-discreto"}`}
          >
            {nome}
          </button>
        ))}
      </div>
      <section className="painel p-4">
        {aba === "forjar" ? <Forjar save={save} acoes={acoes} /> : <Aprimorar save={save} acoes={acoes} />}
      </section>
    </main>
  );
}
