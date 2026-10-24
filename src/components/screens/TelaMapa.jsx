import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { situacaoDasZonas, heroisDoGrupo } from "../../state/seletores";
import { buscarZona } from "../../data/zonas";
import { inimigos } from "../../data/inimigos";
import { spritesInimigos, spritesHerois } from "../../data/sprites";
import { ANDARES_MASMORRA } from "../../data/constants";
import Sprite from "../battle/Sprite";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";

function estadoDaZona(s) {
  if (!s.desbloqueada) return "Bloqueada";
  if (!s.jogavel) return "Em breve";
  if (s.chefeDerrotado) return "Concluída";
  return `${s.encontrosVencidos}/${s.zona.encontrosParaChefe} encontros`;
}

function Masmorra({ zona, save, acoes }) {
  const progresso = save.progresso.masmorras[zona.masmorra.id];
  const atual = save.masmorraAtual;
  const aqui = atual?.zonaId === zona.id;
  return (
    <div className="mt-4 border-t border-borda pt-3">
      <h3 className="titulo text-sm">Masmorra: {zona.masmorra.nome}</h3>
      {!progresso.desbloqueada ? (
        <p className="text-sm text-texto-3">Abre depois de vencer o chefe desta zona.</p>
      ) : (
        <>
          <p className="text-sm text-texto-2">
            {progresso.concluida
              ? "Concluída. Dá para descer de novo atrás de outro equipamento Lendário."
              : progresso.melhorAndar > 0
                ? `Melhor andar alcançado: ${progresso.melhorAndar} de ${ANDARES_MASMORRA}.`
                : `${ANDARES_MASMORRA - 1} andares e o chefe no fundo, com um equipamento Lendário como prêmio.`}
          </p>
          {aqui ? (
            <Botao className="mt-2" onClick={() => acoes.navegar("masmorra")}>
              Continuar a descida
            </Botao>
          ) : (
            <Botao className="mt-2" disabled={Boolean(atual) || Boolean(save.batalha)} onClick={() => acoes.entrarNaMasmorra(zona.id)}>
              Entrar na masmorra
            </Botao>
          )}
          {atual && !aqui && <p className="mt-1 text-sm text-texto-3">O grupo já está em outra masmorra.</p>}
        </>
      )}
    </div>
  );
}

function PainelZona({ s, save, acoes }) {
  const { zona } = s;
  const batalhaAtiva = Boolean(save.batalha);
  const motivoChefe = s.chefeDisponivel
    ? null
    : `O chefe aparece depois de ${zona.encontrosParaChefe} vitórias nesta zona.`;

  return (
    <section className="painel p-4" aria-labelledby="titulo-zona">
      <h2 id="titulo-zona" className="titulo text-xl text-destaque">
        {zona.nome}
      </h2>
      <p className="text-sm text-texto-2">
        Níveis {zona.nivelMin} a {zona.nivelMax}. {zona.tema[0].toUpperCase() + zona.tema.slice(1)}.
      </p>

      {s.jogavel && s.desbloqueada ? (
        <>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-sm">
              <span>Caminho até o chefe</span>
              <span className="text-texto-2">
                {s.encontrosVencidos}/{zona.encontrosParaChefe}
              </span>
            </div>
            <BarraValor
              atual={s.encontrosVencidos}
              maximo={zona.encontrosParaChefe}
              cor="var(--color-destaque)"
              rotulo="Progresso até o chefe"
            />
          </div>

          <h3 className="titulo mt-4 mb-2 text-sm text-texto-2">Criaturas da zona</h3>
          <ul className="flex flex-wrap gap-3">
            {[...zona.inimigos, zona.chefe].map((id) => {
              const visto = save.bestiario[id]?.visto;
              return (
                <li key={id} className="flex w-20 flex-col items-center text-center text-xs">
                  <div className="flex h-14 items-end" style={{ filter: visto ? undefined : "brightness(0) opacity(0.5)" }}>
                    <Sprite sprite={spritesInimigos[id]} escala={2} olharEsquerda rotulo="" />
                  </div>
                  <span className={visto ? "text-texto-2" : "text-texto-3"}>{visto ? inimigos[id].nome : "Desconhecido"}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Botao variante="primario" disabled={batalhaAtiva} onClick={() => acoes.explorar(zona.id)}>
              Explorar
            </Botao>
            <Botao disabled={batalhaAtiva || !s.chefeDisponivel} onClick={() => acoes.enfrentarChefe(zona.id)}>
              {s.chefeDerrotado ? "Enfrentar o chefe de novo" : "Enfrentar o chefe"}
            </Botao>
          </div>
          {motivoChefe && <p className="mt-2 text-sm text-texto-3">{motivoChefe}</p>}
          {batalhaAtiva && <p className="mt-2 text-sm text-texto-3">Termine ou retome a batalha em andamento primeiro.</p>}
          <Masmorra zona={zona} save={save} acoes={acoes} />
        </>
      ) : (
        <p className="mt-3 text-texto-2">
          {s.desbloqueada
            ? "Esta zona ainda está sendo preparada e chega em uma próxima versão."
            : "Vença o chefe da zona anterior para abrir o caminho."}
        </p>
      )}
    </section>
  );
}

export default function TelaMapa() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const zonas = situacaoDasZonas(save);
  const primeiraJogavel = zonas.find((s) => s.desbloqueada && s.jogavel && !s.chefeDerrotado) ?? zonas[0];
  const [selecionada, setSelecionada] = useState(primeiraJogavel.zona.id);
  const atual = zonas.find((s) => s.zona.id === selecionada);
  const herois = heroisDoGrupo(save);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      {save.batalha && (
        <div className="painel mb-4 flex flex-wrap items-center justify-between gap-2 border-destaque/60 px-4 py-3">
          <span>
            Batalha em andamento em{" "}
            {save.batalha.origem.tipo === "masmorra"
              ? buscarZona(save.batalha.origem.zonaId).masmorra.nome
              : buscarZona(save.batalha.origem.zonaId).nome}
            .
          </span>
          <Botao variante="primario" onClick={acoes.retomarBatalha}>
            Retomar
          </Botao>
        </div>
      )}

      <section aria-label="Grupo" className="mb-4 flex flex-wrap items-end gap-4">
        {herois.map((h) => (
          <div key={h.id} className="flex items-end gap-2">
            <Sprite sprite={spritesHerois[h.classeId]} escala={2} rotulo="" />
            <div className="text-sm">
              <p className="titulo">{h.nome}</p>
              <p className="text-texto-2">Nível {h.nivel}</p>
            </div>
          </div>
        ))}
        <span className="ml-auto text-destaque-claro sm:hidden">{save.ouro} ouro</span>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[16rem_1fr]">
        <nav aria-label="Zonas">
          <ol className="painel overflow-hidden">
            {zonas.map((s, i) => (
              <li key={s.zona.id} className="border-b border-borda last:border-b-0">
                <button
                  onClick={() => setSelecionada(s.zona.id)}
                  aria-current={selecionada === s.zona.id ? "true" : undefined}
                  className={`flex w-full items-baseline gap-2 px-3 py-2 text-left ${
                    selecionada === s.zona.id ? "bg-elevado" : "hover:bg-elevado/60"
                  } ${!s.desbloqueada ? "text-texto-3" : ""}`}
                >
                  <span className="w-5 text-right text-xs text-texto-3">{i + 1}</span>
                  <span className="flex-1">
                    <span className={`block ${selecionada === s.zona.id ? "text-destaque" : ""}`}>{s.zona.nome}</span>
                    <span className="text-xs text-texto-3">{estadoDaZona(s)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="order-first md:order-none">
          <PainelZona s={atual} save={save} acoes={acoes} />
        </div>
      </div>
    </main>
  );
}
