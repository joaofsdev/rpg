import { useState } from "react";
import { NOMES_ATRIBUTO, NOMES_SLOT } from "../../data/textos";
import { APRIMORAMENTO_MAX } from "../../data/ferraria";
import { comparacaoComHeroi, detalhesDoEquipamento, opcoesDeHeroi } from "../../state/seletoresInventario";
import { classeRaridade, fundoRaridade } from "../common/cores";
import { categoriaDoEquipamento, nomeDoEquipamento } from "../common/descricoes";
import Botao from "../common/Botao";
import Modal from "../common/Modal";

const SENTIDO = {
  melhor: { simbolo: "▲", texto: "melhor", classe: "text-sucesso" },
  pior: { simbolo: "▼", texto: "pior", classe: "text-perigo" },
  igual: { simbolo: "=", texto: "igual", classe: "text-texto-3" },
};

const sinal = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

function contar(n, palavra) {
  return `${n} ${palavra}${n === 1 ? "" : "s"}`;
}

// "Melhora 2 atributos e piora 1 em relação ao que Mira usa."
function ResumoComparacao({ comparacao, item }) {
  const { heroi, atual, mesmoItem, melhores, piores } = comparacao;
  if (mesmoItem) return <p className="text-sm text-texto-2">{heroi.nome} já usa este item. Bônus atuais:</p>;
  const partes = [];
  if (melhores > 0) partes.push(`melhora ${contar(melhores, "atributo")}`);
  if (piores > 0) partes.push(`piora ${contar(piores, "atributo")}`);
  const resumo = partes.length > 0 ? partes.join(" e ") : "fica igual em tudo";
  return (
    <p className="text-sm text-texto-2">
      {atual ? (
        <>
          Contra <span className="text-texto [overflow-wrap:anywhere]">{nomeDoEquipamento(atual)}</span> (atual de {heroi.nome}):{" "}
        </>
      ) : (
        <>
          {heroi.nome} não usa nada em {NOMES_SLOT[item.slot].toLowerCase()}:{" "}
        </>
      )}
      <span className="text-texto">{resumo}.</span>
    </p>
  );
}

function TabelaComparacao({ comparacao }) {
  const { linhas, mesmoItem } = comparacao;
  if (linhas.length === 0) return <p className="text-sm text-texto-3">Este item não dá bônus.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-borda text-left text-texto-2">
          <th scope="col" className="py-1 font-normal">
            Atributo
          </th>
          <th scope="col" className="py-1 text-right font-normal">
            Este item
          </th>
          {!mesmoItem && (
            <>
              <th scope="col" className="py-1 text-right font-normal">
                Atual
              </th>
              <th scope="col" className="py-1 pl-2 text-right font-normal">
                Diferença
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => {
          const s = SENTIDO[l.sentido];
          return (
            <tr key={l.atributo} className="border-b border-borda/60 last:border-b-0">
              <th scope="row" className="py-1 text-left font-normal text-texto-2">
                {NOMES_ATRIBUTO[l.atributo]}
              </th>
              <td className="py-1 text-right text-texto">{l.valor}</td>
              {!mesmoItem && (
                <>
                  <td className="py-1 text-right text-texto-2">{l.atual}</td>
                  <td className={`py-1 pl-2 text-right font-semibold whitespace-nowrap ${s.classe}`}>
                    <span aria-hidden="true">{s.simbolo} </span>
                    {sinal(l.diferenca)}
                    <span className="sr-only"> ({s.texto})</span>
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Motivo({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="text-sm text-texto-2">
      <span aria-hidden="true">ⓘ </span>
      {children}
    </p>
  );
}

export default function DetalheEquipamento({ save, item, heroiId, aoEscolherHeroi, aoEquipar, aoTirar, aoVender, aoVoltar, tituloRef }) {
  const [confirmando, setConfirmando] = useState(false);
  const detalhes = detalhesDoEquipamento(save, item);
  const comparacao = comparacaoComHeroi(save, item, heroiId);
  const { dono } = detalhes;
  const { heroi } = comparacao;
  const { categoria, tipo } = categoriaDoEquipamento(item);
  const herois = opcoesDeHeroi(save);
  const nome = nomeDoEquipamento(item);

  const vender = () => (detalhes.pedeConfirmacao ? setConfirmando(true) : aoVender(item));
  const aoTeclar = (e) => {
    if (e.key === "Escape" && !confirmando) aoVoltar();
  };

  const opcaoHeroi = (h) => {
    const usa = comparacaoComHeroi(save, item, h.valor);
    const marca = usa.mesmoItem ? " · usa este" : usa.compativel ? "" : " · não usa";
    return (
      <option key={h.valor} value={h.valor}>
        {`${h.nome} · ${h.classe} nv ${h.nivel}${marca}`}
      </option>
    );
  };

  return (
    <>
      <section
        aria-labelledby="titulo-item"
        onKeyDown={aoTeclar}
        className="painel space-y-4 p-4 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto"
      >
        <Botao variante="discreto" className="-ml-2 px-2 md:hidden" onClick={aoVoltar}>
          <span aria-hidden="true">←</span> Voltar à lista
        </Botao>

        <header className="flex gap-3">
          <span aria-hidden="true" className={`w-1.5 shrink-0 rounded-sm ${fundoRaridade(item.raridade)}`} />
          <div className="min-w-0">
            <h2 id="titulo-item" ref={tituloRef} tabIndex={-1} className="titulo text-lg leading-snug [overflow-wrap:anywhere]">
              {item.nome}
              {item.aprimoramento > 0 && <span className="text-destaque"> +{item.aprimoramento}</span>}
            </h2>
            <p className="text-texto-2">
              <span className={`font-semibold ${classeRaridade(item.raridade)}`}>{item.raridade}</span> · nível{" "}
              <span className="text-texto">{item.nivel}</span> · {categoria} · {tipo}
            </p>
          </div>
        </header>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-texto-2">Situação</dt>
          <dd>
            {dono ? (
              <>
                <span aria-hidden="true">✦ </span>Em uso por {dono.nome}
              </>
            ) : (
              "Livre no inventário"
            )}
          </dd>
          <dt className="text-texto-2">Quem usa</dt>
          <dd>{detalhes.classes.length > 0 ? detalhes.classes.join(", ") : "Nenhuma classe"}</dd>
          <dt className="text-texto-2">Aprimoramento</dt>
          <dd>{item.aprimoramento > 0 ? `+${item.aprimoramento} de +${APRIMORAMENTO_MAX}` : `nenhum (até +${APRIMORAMENTO_MAX} na Ferraria)`}</dd>
          <dt className="text-texto-2">Venda</dt>
          <dd>{detalhes.preco} ouro</dd>
        </dl>

        <section aria-labelledby="titulo-comparar" className="space-y-2">
          <h3 id="titulo-comparar" className="titulo text-sm">
            Comparar com
          </h3>
          <label htmlFor="comparar-heroi" className="sr-only">
            Herói para comparar
          </label>
          <select id="comparar-heroi" value={heroi.id} onChange={(e) => aoEscolherHeroi(e.target.value)} className="campo">
            <optgroup label="Grupo">{herois.filter((h) => !h.reserva).map(opcaoHeroi)}</optgroup>
            {herois.some((h) => h.reserva) && <optgroup label="Reserva">{herois.filter((h) => h.reserva).map(opcaoHeroi)}</optgroup>}
          </select>
          {!comparacao.compativel && (
            <p id="motivo-equipar" className="rounded border border-perigo/50 px-2 py-1 text-sm text-perigo">
              <span aria-hidden="true">✕ </span>
              {comparacao.motivoEquipar}
            </p>
          )}
          <ResumoComparacao comparacao={comparacao} item={item} />
          <TabelaComparacao comparacao={comparacao} />
        </section>

        <div className="space-y-2 border-t border-borda pt-3">
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <Botao
              variante="primario"
              className="min-[400px]:col-span-2"
              disabled={Boolean(comparacao.motivoEquipar)}
              aria-describedby={comparacao.motivoEquipar ? "motivo-equipar" : undefined}
              onClick={() => aoEquipar(heroi, item)}
            >
              Equipar em {heroi.nome}
            </Botao>
            {dono && (
              <Botao
                disabled={Boolean(detalhes.motivoTirar)}
                aria-describedby={detalhes.motivoTirar ? "motivo-tirar" : undefined}
                onClick={() => aoTirar(dono, item)}
              >
                Tirar de {dono.nome}
              </Botao>
            )}
            <Botao
              variante="perigo"
              className={dono ? "" : "min-[400px]:col-span-2"}
              disabled={Boolean(detalhes.motivoVender)}
              aria-describedby={detalhes.motivoVender ? "motivo-vender" : undefined}
              onClick={vender}
            >
              Vender por {detalhes.preco} ouro
            </Botao>
          </div>
          {comparacao.compativel && <Motivo id="motivo-equipar">{comparacao.motivoEquipar}</Motivo>}
          {!comparacao.motivoEquipar && dono && dono.id !== heroi.id && (
            <p className="text-sm text-texto-2">Ao equipar em {heroi.nome}, o item sai de {dono.nome}.</p>
          )}
          <Motivo id="motivo-tirar">{dono && detalhes.motivoTirar}</Motivo>
          <Motivo id="motivo-vender">{detalhes.motivoVender}</Motivo>
        </div>
      </section>

      {confirmando && (
        <Modal
          titulo="Vender equipamento?"
          aoFechar={() => setConfirmando(false)}
          acoes={
            <>
              <Botao onClick={() => setConfirmando(false)}>Cancelar</Botao>
              <Botao
                variante="perigo"
                onClick={() => {
                  setConfirmando(false);
                  aoVender(item);
                }}
              >
                Vender por {detalhes.preco} ouro
              </Botao>
            </>
          }
        >
          <p>
            <span className="text-texto [overflow-wrap:anywhere]">{nome}</span> ({item.raridade}, nível {item.nivel}) será vendido por{" "}
            {detalhes.preco} ouro. Não dá para desfazer.
          </p>
        </Modal>
      )}
    </>
  );
}
