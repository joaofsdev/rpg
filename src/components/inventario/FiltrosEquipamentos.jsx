import { useState } from "react";
import { NOMES_SLOT } from "../../data/textos";
import { SLOTS_EQUIPAMENTO } from "../../data/constants";
import {
  ORDENS,
  ORDEM_PADRAO,
  SITUACOES,
  FILTROS_PADRAO,
  opcoesDeTipo,
  opcoesDeRaridade,
  opcoesDeFaixa,
  opcoesDeHeroi,
} from "../../state/seletoresInventario";

// Armas primeiro: é o que o jogador mais troca
const CATEGORIAS = [
  { valor: "todos", nome: "Todas" },
  { valor: "arma", nome: "Armas" },
  ...SLOTS_EQUIPAMENTO.filter((s) => s !== "arma").map((s) => ({ valor: s, nome: NOMES_SLOT[s] })),
];

// Grupo de botões em que só um fica marcado (categoria, situação)
function Escolha({ legenda, opcoes, valor, aoMudar, colunas }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm text-texto-2">{legenda}</legend>
      <div className={`grid gap-1 sm:flex sm:flex-wrap ${colunas}`}>
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={o.valor === valor}
            onClick={() => aoMudar(o.valor)}
            className={`botao min-h-10 px-3 ${o.valor === valor ? "botao-secundario text-destaque" : "botao-discreto border-borda"}`}
          >
            {o.nome}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Lista({ id, rotulo, valor, aoMudar, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm text-texto-2">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} className="campo">
        {children}
      </select>
    </div>
  );
}

const comQuantidade = (o) => `${o.nome} (${o.quantidade})`;

export default function FiltrosEquipamentos({ save, filtros, ordem, aoMudar, aoOrdenar }) {
  const [abertos, setAbertos] = useState(false);
  const extras =
    ["situacao", "tipo", "raridade", "faixa", "heroiId"].filter((c) => filtros[c] !== FILTROS_PADRAO[c]).length +
    (ordem === ORDEM_PADRAO ? 0 : 1);
  const herois = opcoesDeHeroi(save);

  return (
    <section aria-label="Busca e filtros" className="painel space-y-3 p-3">
      <div className="min-w-0">
        <label htmlFor="busca-equipamento" className="mb-1 block text-sm text-texto-2">
          Buscar pelo nome
        </label>
        <input
          id="busca-equipamento"
          type="search"
          value={filtros.busca}
          onChange={(e) => aoMudar("busca", e.target.value)}
          placeholder="ex.: espada, couro, ágil"
          autoComplete="off"
          className="campo"
        />
      </div>

      <Escolha legenda="Categoria" opcoes={CATEGORIAS} valor={filtros.slot} aoMudar={(v) => aoMudar("slot", v)} colunas="grid-cols-3" />

      <button
        type="button"
        className="botao botao-secundario w-full md:hidden"
        aria-expanded={abertos}
        aria-controls="mais-filtros"
        onClick={() => setAbertos((a) => !a)}
      >
        {abertos ? "Menos opções" : "Ordenar e mais filtros"}
        {extras > 0 && ` (${extras} ${extras === 1 ? "ativo" : "ativos"})`}
      </button>

      {/* No celular ficam recolhidos para a lista aparecer logo; no desktop, sempre à vista */}
      <div
        id="mais-filtros"
        className={`${abertos ? "grid" : "hidden"} grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid md:grid-cols-6 [&>*]:md:col-span-2`}
      >
        <Lista id="ordem-equipamento" rotulo="Ordenar por" valor={ordem} aoMudar={aoOrdenar}>
          {ORDENS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </Lista>
        <div className="min-[400px]:col-span-2">
          <Escolha
            legenda="Situação"
            opcoes={SITUACOES.map((s) => ({ valor: s.id, nome: s.nome }))}
            valor={filtros.situacao}
            aoMudar={(v) => aoMudar("situacao", v)}
            colunas="grid-cols-3"
          />
        </div>
        <Lista id="filtro-tipo" rotulo="Tipo" valor={filtros.tipo} aoMudar={(v) => aoMudar("tipo", v)}>
          <option value="todos">Todos os tipos</option>
          {opcoesDeTipo(save, filtros.slot, filtros.tipo).map((o) => (
            <option key={o.valor} value={o.valor}>
              {comQuantidade(o)}
            </option>
          ))}
        </Lista>
        <Lista id="filtro-raridade" rotulo="Raridade" valor={filtros.raridade} aoMudar={(v) => aoMudar("raridade", v)}>
          <option value="todas">Todas as raridades</option>
          {opcoesDeRaridade(save).map((o) => (
            <option key={o.valor} value={o.valor}>
              {comQuantidade(o)}
            </option>
          ))}
        </Lista>
        <Lista id="filtro-faixa" rotulo="Nível" valor={filtros.faixa} aoMudar={(v) => aoMudar("faixa", v)}>
          <option value="todas">Todos os níveis</option>
          {opcoesDeFaixa(save, filtros.faixa).map((o) => (
            <option key={o.valor} value={o.valor}>
              {comQuantidade(o)}
            </option>
          ))}
        </Lista>
        <Lista id="filtro-heroi" rotulo="Serve para" valor={filtros.heroiId} aoMudar={(v) => aoMudar("heroiId", v)}>
          <option value="todos">Qualquer herói</option>
          {herois.map((h) => (
            <option key={h.valor} value={h.valor}>
              {`${h.nome} (${h.classe})${h.reserva ? " · reserva" : ""}`}
            </option>
          ))}
        </Lista>
      </div>
    </section>
  );
}
