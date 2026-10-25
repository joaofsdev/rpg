import { useState } from "react";
import { itens } from "../../data/itens";
import { receitas, receitaDoPrato, VAGAS_COZINHA, PORCOES_MAX } from "../../data/receitas";
import { descreverEfeitoRefeicao } from "../../data/textos";
import { atividadeConcluida, decorrido, tempoRestante } from "../../engine/atividades";
import {
  receitasConhecidas,
  preparosEmAndamento,
  porcoesPossiveis,
  porcoesProntas,
  motivoNaoPrepara,
  motivoNaoCome,
} from "../../engine/cozinha";
import { zonas } from "../../data/zonas";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";
import Modal from "../common/Modal";
import { formatarDuracao } from "../common/tempo";

const MINUTO_MS = 60 * 1000;

function efeitoEDuracao(receita) {
  return `${descreverEfeitoRefeicao(receita.efeito)} por ${receita.duracaoEncontros} encontros`;
}

function Panela({ atividade, agora, acoes }) {
  const [cancelando, setCancelando] = useState(false);
  const { receitaId, porcoes } = atividade.parametros;
  const receita = receitas[receitaId];
  const prontas = porcoesProntas(atividade, agora);
  const concluida = atividadeConcluida(atividade, agora);
  return (
    <div className="rounded border border-borda bg-elevado p-3">
      <p>
        <span className="titulo">{receita.nome}</span>{" "}
        <span className="text-sm text-texto-2">
          ×{porcoes} · {prontas}/{porcoes} {porcoes === 1 ? "porção pronta" : "porções prontas"}
        </span>
      </p>
      <BarraValor
        atual={decorrido(atividade, agora)}
        maximo={atividade.duracao}
        cor={concluida ? "var(--color-sucesso)" : "var(--color-destaque)"}
        rotulo={`Preparo de ${receita.nome}`}
        fina
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-texto-2">
          {concluida ? "Pronto." : `Faltam ${formatarDuracao(tempoRestante(atividade, agora))}.`}
        </span>
        {concluida ? (
          <Botao variante="primario" onClick={() => acoes.coletarAtividade(atividade.id)}>
            Pegar as porções
          </Botao>
        ) : (
          <Botao variante="discreto" onClick={() => setCancelando(true)}>
            Tirar do fogo
          </Botao>
        )}
      </div>
      {cancelando && (
        <Modal
          titulo="Tirar a panela do fogo?"
          aoFechar={() => setCancelando(false)}
          acoes={
            <>
              <Botao variante="discreto" onClick={() => setCancelando(false)}>
                Deixar cozinhando
              </Botao>
              <Botao
                variante="perigo"
                onClick={() => {
                  setCancelando(false);
                  acoes.cancelarAtividade(atividade.id);
                }}
              >
                Tirar do fogo
              </Botao>
            </>
          }
        >
          <p>
            {prontas > 0 ? `${prontas} ${prontas === 1 ? "porção vai" : "porções vão"} para o inventário. ` : ""}
            Os ingredientes das porções que não ficaram prontas voltam ao inventário.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CartaoReceita({ save, receita, acoes }) {
  const possiveis = porcoesPossiveis(save, receita);
  const [porcoes, setPorcoes] = useState(1);
  const escolhidas = Math.max(1, Math.min(porcoes, possiveis || 1));
  const motivo = motivoNaoPrepara(save, receita.id, escolhidas);
  return (
    <li className="flex flex-col rounded border border-borda bg-elevado p-3">
      <p className="titulo">{receita.nome}</p>
      <p className="text-sm text-sucesso">{efeitoEDuracao(receita)}.</p>
      <p className="mt-1 text-sm text-texto-2">
        {receita.ingredientes
          .map(({ itemId, qtd }) => `${qtd} ${itens[itemId].nome} (tem ${save.inventario.itens[itemId] || 0})`)
          .join(", ")}{" "}
        por porção · {receita.minutos} min cada
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1 pt-3">
        <span className="text-sm text-texto-2">Porções:</span>
        {Array.from({ length: PORCOES_MAX }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            aria-pressed={n === escolhidas}
            disabled={n > possiveis}
            onClick={() => setPorcoes(n)}
            className={`botao min-h-8 px-2 ${n === escolhidas ? "botao-secundario text-destaque" : "botao-discreto"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <Botao
        variante="primario"
        className="mt-2"
        disabled={Boolean(motivo)}
        onClick={() => acoes.prepararReceita(receita.id, escolhidas)}
      >
        Preparar ({formatarDuracao(receita.minutos * escolhidas * MINUTO_MS)})
      </Botao>
      {motivo && <p className="mt-1 text-sm text-texto-3">{motivo}</p>}
    </li>
  );
}

function Pratos({ save, acoes }) {
  const [trocando, setTrocando] = useState(null);
  const pratos = Object.entries(save.inventario.itens).filter(([id, qtd]) => qtd > 0 && receitaDoPrato(id));
  const ativa = save.refeicaoAtiva ? receitaDoPrato(save.refeicaoAtiva.itemId) : null;
  const comer = (itemId) => (ativa ? setTrocando(itemId) : acoes.comer(itemId));

  if (pratos.length === 0) return <p className="text-sm text-texto-2">Nenhum prato pronto no inventário.</p>;
  return (
    <>
      <ul className="divide-y divide-borda">
        {pratos.map(([itemId, qtd]) => {
          const motivo = motivoNaoCome(save, itemId);
          return (
            <li key={itemId} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-48 flex-1">
                <span className="block">
                  {itens[itemId].nome} <span className="text-sm text-texto-3">×{qtd}</span>
                </span>
                <span className="text-sm text-texto-2">{efeitoEDuracao(receitaDoPrato(itemId))}.</span>
              </span>
              <Botao disabled={Boolean(motivo)} title={motivo ?? undefined} onClick={() => comer(itemId)}>
                Comer
              </Botao>
            </li>
          );
        })}
      </ul>
      {trocando && (
        <Modal
          titulo="Trocar a refeição?"
          aoFechar={() => setTrocando(null)}
          acoes={
            <>
              <Botao variante="discreto" onClick={() => setTrocando(null)}>
                Manter
              </Botao>
              <Botao
                variante="primario"
                onClick={() => {
                  acoes.comer(trocando);
                  setTrocando(null);
                }}
              >
                Comer {itens[trocando].nome}
              </Botao>
            </>
          }
        >
          <p>
            {ativa.nome} ainda vale por {save.refeicaoAtiva.encontrosRestantes} encontros e será substituído. Só uma
            refeição fica ativa por vez.
          </p>
        </Modal>
      )}
    </>
  );
}

export default function Cozinha({ save, agora, acoes }) {
  const preparos = preparosEmAndamento(save);
  const conhecidas = receitasConhecidas(save);
  const ativa = save.refeicaoAtiva ? receitaDoPrato(save.refeicaoAtiva.itemId) : null;
  const aprender = Object.values(receitas).filter((r) => !conhecidas.includes(r));

  return (
    <section className="painel mt-4 p-4" aria-labelledby="titulo-cozinha">
      <h2 id="titulo-cozinha" className="titulo mb-3 text-lg">
        Cozinha
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <h3 className="titulo mb-2 text-sm text-texto-2">
            Panela ({preparos.length}/{VAGAS_COZINHA})
          </h3>
          {preparos.length === 0 ? (
            <p className="text-sm text-texto-2">A panela está livre. Escolha uma receita abaixo.</p>
          ) : (
            preparos.map((a) => <Panela key={a.id} atividade={a} agora={agora} acoes={acoes} />)
          )}
        </div>
        <div>
          <h3 className="titulo mb-2 text-sm text-texto-2">Refeição do grupo</h3>
          {ativa ? (
            <p className="text-sm">
              <span className="titulo">{ativa.nome}</span>:{" "}
              <span className="text-sucesso">{descreverEfeitoRefeicao(ativa.efeito)}</span>, mais{" "}
              {save.refeicaoAtiva.encontrosRestantes} {save.refeicaoAtiva.encontrosRestantes === 1 ? "encontro" : "encontros"}.
            </p>
          ) : (
            <p className="text-sm text-texto-2">Nenhuma refeição ativa. O efeito dura encontros, não tempo.</p>
          )}
        </div>
      </div>

      <h3 className="titulo mt-4 mb-2 text-sm text-texto-2">Pratos prontos</h3>
      <Pratos save={save} acoes={acoes} />

      <h3 className="titulo mt-4 mb-2 text-sm text-texto-2">Receitas</h3>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {conhecidas.map((r) => (
          <CartaoReceita key={r.id} save={save} receita={r} acoes={acoes} />
        ))}
      </ul>
      {aprender.length > 0 && (
        <p className="mt-3 text-sm text-texto-3">
          Mais {aprender.length} {aprender.length === 1 ? "receita" : "receitas"} para aprender: o chefe de cada zona ensina a
          dele (a próxima: {zonas.find((z) => z.id === aprender[0].zonaId)?.nome}) e a loja vende uma por semana.
        </p>
      )}
    </section>
  );
}
