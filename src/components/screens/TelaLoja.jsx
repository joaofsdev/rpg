import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDoGrupo } from "../../state/seletores";
import { itens } from "../../data/itens";
import { iconesItens } from "../../data/sprites";
import { CONSUMIVEIS_A_VENDA } from "../../data/loja";
import { ATRIBUTOS } from "../../data/constants";
import { NOMES_ATRIBUTO } from "../../data/textos";
import { tempoAteRenovar, custoRenovar } from "../../engine/loja";
import { podeEquipar } from "../../engine/itens";
import { classeRaridade } from "../common/cores";
import { tipoDoEquipamento } from "../common/descricoes";
import Botao from "../common/Botao";
import { formatarDuracao, useAgora } from "../common/tempo";

export default function TelaLoja() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgora(30000);
  const herois = heroisDoGrupo(save);
  const loja = save.loja;
  const custo = custoRenovar(save);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="titulo text-2xl text-destaque">Loja</h1>
        <span className="text-destaque-claro">{save.ouro} ouro</span>
        <Botao variante="discreto" className="ml-auto" onClick={() => acoes.navegar("mais")}>
          Voltar
        </Botao>
      </header>

      <section className="painel p-4" aria-labelledby="titulo-equip">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 id="titulo-equip" className="titulo text-lg">
            Equipamentos do dia
          </h2>
          <span className="text-sm text-texto-2">Novos itens em {formatarDuracao(tempoAteRenovar(loja, agora))}.</span>
          <Botao className="ml-auto" disabled={save.ouro < custo} onClick={acoes.renovarLoja}>
            Trocar agora por {custo} ouro
          </Botao>
        </div>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {loja.itens.map((item, indice) => {
            const vendido = loja.vendidos[indice];
            const servePara = herois.filter((h) => podeEquipar(h.classeId, item)).map((h) => h.nome);
            const bonus = ATRIBUTOS.filter((a) => item.bonus[a] > 0);
            return (
              <li key={item.id} className={`rounded border border-borda bg-elevado p-3 ${vendido ? "opacity-50" : ""}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`titulo ${classeRaridade(item.raridade)}`}>{item.nome}</span>
                  <span className="shrink-0 text-destaque-claro">{item.preco} ouro</span>
                </div>
                <p className="text-sm text-texto-2">
                  {item.raridade}, {tipoDoEquipamento(item)}, nível {item.nivel}
                </p>
                <p className="text-sm">
                  {bonus.map((a) => `${NOMES_ATRIBUTO[a]} +${item.bonus[a]}`).join(", ") || "Sem bônus"}
                </p>
                <p className="text-sm text-texto-3">
                  {servePara.length ? `Serve para ${servePara.join(" e ")}.` : "Nenhum herói do grupo usa este tipo."}
                </p>
                <Botao
                  variante="primario"
                  className="mt-2"
                  disabled={vendido || save.ouro < item.preco}
                  onClick={() => acoes.comprarEquipamento(indice)}
                >
                  {vendido ? "Vendido" : "Comprar"}
                </Botao>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="painel mt-4 p-4" aria-labelledby="titulo-consumiveis">
        <h2 id="titulo-consumiveis" className="titulo mb-3 text-lg">
          Consumíveis
        </h2>
        <ul className="divide-y divide-borda">
          {CONSUMIVEIS_A_VENDA.map((id) => {
            const item = itens[id];
            const tenho = save.inventario.itens[id] || 0;
            return (
              <li key={id} className="flex flex-wrap items-center gap-3 py-2">
                {iconesItens[id] && <img src={iconesItens[id]} alt="" className="h-8 w-8" style={{ imageRendering: "pixelated" }} />}
                <span className="min-w-48 flex-1">
                  <span className="block">
                    {item.nome} <span className="text-sm text-texto-3">(você tem {tenho})</span>
                  </span>
                  <span className="text-sm text-texto-2">{item.descricao}</span>
                </span>
                <span className="w-20 text-right text-destaque-claro">{item.preco} ouro</span>
                <div className="flex gap-1">
                  <Botao disabled={save.ouro < item.preco} onClick={() => acoes.comprarItem(id, 1)}>
                    Comprar 1
                  </Botao>
                  <Botao disabled={save.ouro < item.preco * 5} onClick={() => acoes.comprarItem(id, 5)}>
                    Comprar 5
                  </Botao>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
