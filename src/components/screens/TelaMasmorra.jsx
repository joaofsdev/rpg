import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDoGrupo, atributosDoHeroi } from "../../state/seletores";
import { buscarZona } from "../../data/zonas";
import { itens } from "../../data/itens";
import { spritesHerois } from "../../data/sprites";
import { ANDARES_MASMORRA, ANDARES_COM_FOGUEIRA } from "../../data/constants";
import { corDaVida } from "../common/cores";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";
import Modal from "../common/Modal";
import Sprite from "../battle/Sprite";

function nomeDoAndar(andar) {
  return andar === ANDARES_MASMORRA ? "Chefe" : `Andar ${andar}`;
}

function Andares({ atual, melhor }) {
  return (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Andares da masmorra">
      {Array.from({ length: ANDARES_MASMORRA }, (_, i) => i + 1).map((andar) => {
        const feito = andar < atual;
        const agora = andar === atual;
        return (
          <li key={andar} className="flex items-center gap-1">
            <span
              aria-current={agora ? "step" : undefined}
              className={`rounded border px-2 py-0.5 text-sm ${
                agora
                  ? "border-destaque bg-destaque/15 text-destaque"
                  : feito
                    ? "border-sucesso/50 text-sucesso"
                    : "border-borda text-texto-3"
              }`}
            >
              {nomeDoAndar(andar)}
              {!agora && !feito && andar <= melhor ? " ✓" : ""}
            </span>
            {ANDARES_COM_FOGUEIRA.includes(andar) && (
              <span className="text-xs text-vigor" title="Fogueira depois deste andar">
                fogueira
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function TelaMasmorra() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const atual = save.masmorraAtual;
  if (!atual) return null;

  const zona = buscarZona(atual.zonaId);
  const melhor = save.progresso.masmorras[zona.masmorra.id].melhorAndar;
  const herois = heroisDoGrupo(save);
  const itensGanhos = Object.entries(atual.ganhos.itens);
  const chefe = atual.andar === ANDARES_MASMORRA;

  return (
    <main className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4">
        <h1 className="titulo text-2xl text-destaque">{zona.masmorra.nome}</h1>
        <p className="text-texto-2">
          Zona: {zona.nome}. Melhor andar alcançado: {melhor > 0 ? nomeDoAndar(melhor) : "nenhum"}.
        </p>
      </header>

      <section className="painel p-4" aria-labelledby="titulo-andar">
        <h2 id="titulo-andar" className="titulo mb-2 text-lg">
          {chefe ? "O chefe espera no último andar" : `Próximo: ${nomeDoAndar(atual.andar)}`}
        </h2>
        <Andares atual={atual.andar} melhor={melhor} />
        {atual.fogueira && (
          <p className="mt-3 rounded border border-vigor/40 bg-vigor/10 px-3 py-2 text-sm">
            O grupo descansou na fogueira depois do andar {atual.fogueira.andar}: vida restaurada e caídos de pé.
          </p>
        )}

        <h3 className="titulo mt-4 mb-2 text-sm">Grupo</h3>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {herois.map((h) => {
            const maximo = atributosDoHeroi(save, h).vida;
            const vida = Math.min(maximo, atual.vida[h.id] ?? maximo);
            return (
              <li key={h.id} className="flex items-end gap-3">
                <div className={vida === 0 ? "opacity-40" : ""}>
                  <Sprite sprite={spritesHerois[h.classeId]} escala={2} caido={vida === 0} rotulo="" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{h.nome}</span>
                    <span className="text-texto-2">{vida === 0 ? "Caído" : `${vida}/${maximo}`}</span>
                  </div>
                  <BarraValor atual={vida} maximo={maximo} cor={corDaVida(vida, maximo)} rotulo={`Vida de ${h.nome}`} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-texto-3">
          A vida não volta cheia entre andares: depois de cada andar há um descanso curto, e as fogueiras curam tudo.
        </p>

        <h3 className="titulo mt-4 mb-1 text-sm">Ganhos nesta descida</h3>
        <p className="text-sm text-texto-2">
          {atual.ganhos.xp} de experiência, {atual.ganhos.ouro} ouro
          {atual.ganhos.equipamentos > 0 ? `, ${atual.ganhos.equipamentos} equipamento(s)` : ""}
          {itensGanhos.length > 0 ? `, ${itensGanhos.map(([id, q]) => `${itens[id].nome} ×${q}`).join(", ")}` : ""}. Já
          estão guardados no inventário.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {save.batalha ? (
            <Botao variante="primario" onClick={acoes.retomarBatalha}>
              Retomar batalha
            </Botao>
          ) : (
            <Botao variante="primario" onClick={acoes.descerAndar}>
              {chefe ? "Enfrentar o chefe" : `Descer para o ${nomeDoAndar(atual.andar).toLowerCase()}`}
            </Botao>
          )}
          <Botao variante="discreto" disabled={Boolean(save.batalha)} onClick={() => setConfirmarSaida(true)}>
            Sair da masmorra
          </Botao>
        </div>
      </section>

      {confirmarSaida && (
        <Modal
          titulo="Sair da masmorra"
          aoFechar={() => setConfirmarSaida(false)}
          acoes={
            <>
              <Botao variante="discreto" onClick={() => setConfirmarSaida(false)}>
                Continuar descendo
              </Botao>
              <Botao variante="primario" onClick={acoes.sairDaMasmorra}>
                Sair
              </Botao>
            </>
          }
        >
          Tudo o que o grupo ganhou continua guardado. Na próxima vez, a descida recomeça do andar 1.
        </Modal>
      )}
    </main>
  );
}
