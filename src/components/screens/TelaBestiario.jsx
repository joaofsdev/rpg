import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { zonas } from "../../data/zonas";
import { inimigos } from "../../data/inimigos";
import { itens } from "../../data/itens";
import { spritesInimigos } from "../../data/sprites";
import { ELEMENTOS } from "../../data/constants";
import Elemento from "../common/Elemento";
import { afinidadeContra } from "../../engine/dano";
import {
  DERROTAS_PARA_REVELAR_AFINIDADES,
  DERROTAS_PARA_BONUS_DROP,
  DERROTAS_PARA_TROFEU,
} from "../../engine/progressao";
import Sprite from "../battle/Sprite";
import Botao from "../common/Botao";

const TEXTO_AFINIDADE = { fraco: "fraco", resiste: "resiste", imune: "imune", neutro: "normal" };
const COR_AFINIDADE = { fraco: "text-sucesso", resiste: "text-vigor", imune: "text-perigo", neutro: "text-texto-2" };

const MARCOS = [
  { derrotas: DERROTAS_PARA_REVELAR_AFINIDADES, texto: "Revela todas as reações a elementos" },
  { derrotas: DERROTAS_PARA_BONUS_DROP, texto: "+10% de chance de materiais desta criatura" },
  { derrotas: DERROTAS_PARA_TROFEU, texto: "Moldura dourada no bestiário" },
];

function Detalhe({ id, entrada }) {
  const dados = inimigos[id];
  const trofeu = entrada.derrotas >= DERROTAS_PARA_TROFEU;
  return (
    <section
      className={`painel p-4 ${trofeu ? "border-raridade-lendario" : ""}`}
      aria-labelledby="titulo-criatura"
    >
      <div className="flex items-end gap-4">
        <div className="flex h-28 w-28 items-end justify-center">
          <Sprite sprite={spritesInimigos[id]} escala={3} olharEsquerda rotulo="" />
        </div>
        <div>
          <h2 id="titulo-criatura" className={`titulo text-xl ${trofeu ? "text-raridade-lendario" : "text-destaque"}`}>
            {dados.nome}
          </h2>
          <p className="text-texto-2">
            {dados.chefe ? "Chefe. " : ""}
            {entrada.derrotas} {entrada.derrotas === 1 ? "derrota" : "derrotas"}
          </p>
        </div>
      </div>

      <h3 className="titulo mt-4 mb-1 text-sm">Reação a elementos</h3>
      <ul className="grid grid-cols-2 gap-x-4 text-sm">
        {ELEMENTOS.map((elemento) => {
          const revelado = entrada.afinidadesReveladas.includes(elemento);
          const afinidade = afinidadeContra(dados, elemento);
          return (
            <li key={elemento} className="flex justify-between gap-2">
              <Elemento elemento={elemento} />
              <span className={revelado ? COR_AFINIDADE[afinidade] : "text-texto-3"}>
                {revelado ? TEXTO_AFINIDADE[afinidade] : "?"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-xs text-texto-3">Acertar uma criatura com um elemento revela a reação a ele.</p>

      <h3 className="titulo mt-4 mb-1 text-sm">Itens que já deixou cair</h3>
      <p className="text-sm text-texto-2">
        {entrada.dropsVistos.length ? entrada.dropsVistos.map((i) => itens[i].nome).join(", ") : "Nenhum ainda."}
      </p>

      <h3 className="titulo mt-4 mb-1 text-sm">Marcos</h3>
      <ul className="space-y-1 text-sm">
        {MARCOS.map((m) => {
          const feito = entrada.derrotas >= m.derrotas;
          return (
            <li key={m.derrotas} className={feito ? "text-sucesso" : "text-texto-2"}>
              {feito ? "Concluído: " : `${Math.min(entrada.derrotas, m.derrotas)}/${m.derrotas} derrotas: `}
              {m.texto}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function TelaBestiario() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const visiveis = zonas.filter((z) => save.progresso.zonas[z.id].desbloqueada);
  const [selecionado, setSelecionado] = useState(
    () => visiveis.flatMap((z) => [...z.inimigos, z.chefe]).find((id) => save.bestiario[id]?.visto) ?? null,
  );

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4 flex items-baseline gap-4">
        <h1 className="titulo text-2xl text-destaque">Bestiário</h1>
        <Botao variante="discreto" className="ml-auto" onClick={() => acoes.navegar("mais")}>
          Voltar
        </Botao>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {visiveis.map((zona) => (
            <section key={zona.id} aria-labelledby={`bz-${zona.id}`}>
              <h2 id={`bz-${zona.id}`} className="titulo mb-2 text-sm text-texto-2">
                {zona.nome}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {[...zona.inimigos, zona.chefe].map((id) => {
                  const entrada = save.bestiario[id];
                  const visto = entrada?.visto;
                  const trofeu = entrada?.derrotas >= DERROTAS_PARA_TROFEU;
                  return (
                    <li key={id}>
                      <button
                        disabled={!visto}
                        onClick={() => setSelecionado(id)}
                        aria-pressed={selecionado === id}
                        aria-label={visto ? inimigos[id].nome : "Criatura desconhecida"}
                        className={`painel flex h-24 w-24 flex-col items-center justify-end p-1 text-xs ${
                          selecionado === id ? "border-destaque" : trofeu ? "border-raridade-lendario" : ""
                        } ${visto ? "hover:border-borda-forte" : "cursor-default"}`}
                      >
                        <div style={{ filter: visto ? undefined : "brightness(0) opacity(0.45)" }}>
                          <Sprite sprite={spritesInimigos[id]} escala={2} olharEsquerda rotulo="" />
                        </div>
                        <span className={`mt-1 w-full truncate text-center ${visto ? "" : "text-texto-3"}`}>
                          {visto ? inimigos[id].nome : "???"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <div className="md:sticky md:top-4 md:self-start">
          {selecionado && save.bestiario[selecionado] ? (
            <Detalhe id={selecionado} entrada={save.bestiario[selecionado]} />
          ) : (
            <p className="painel p-4 text-texto-2">Encontre criaturas nas zonas para registrá-las aqui.</p>
          )}
        </div>
      </div>
    </main>
  );
}
