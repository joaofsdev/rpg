import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDoGrupo, heroisDaReserva, atributosDoHeroi, heroiTravado } from "../../state/seletores";
import { classesHeroi } from "../../data/classesHeroi";
import { golpes } from "../../data/golpes";
import { spritesHerois } from "../../data/sprites";
import { TAXA_PONTO, SLOTS_EQUIPAMENTO, MAX_GOLPES_EQUIPADOS, MAX_GRUPO, MAX_HEROIS } from "../../data/constants";
import { NOMES_ATRIBUTO, NOMES_SLOT, NOMES_ELEMENTO, DESCRICAO_ALVO } from "../../data/textos";
import { atributosDistribuiveis } from "../../engine/herois";
import { xpParaProximoNivel } from "../../engine/progressao";
import { atividadeDoHeroi, atividadeConcluida, tempoRestante } from "../../engine/atividades";
import { motivoNaoEntraNoGrupo, motivoNaoSaiDoGrupo, motivoNaoDispensa } from "../../engine/grupo";
import { classeRaridade, corRecurso } from "../common/cores";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";
import Sprite from "../battle/Sprite";
import Modal from "../common/Modal";
import { formatarDuracao, useAgoraDoJogo } from "../common/tempo";

function Atributos({ save, heroi, acoes }) {
  const [planejados, setPlanejados] = useState({});
  const atributos = atributosDoHeroi(save, heroi);
  const usados = Object.values(planejados).reduce((s, v) => s + v, 0);
  const restantes = heroi.pontosLivres - usados;
  const mudar = (atributo, delta) =>
    setPlanejados((p) => ({ ...p, [atributo]: Math.max(0, (p[atributo] || 0) + delta) }));

  const confirmar = () => {
    acoes.distribuirPontos(heroi.id, planejados);
    setPlanejados({});
  };

  return (
    <section aria-labelledby="titulo-atributos">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 id="titulo-atributos" className="titulo text-sm">
          Atributos
        </h3>
        {heroi.pontosLivres > 0 && (
          <span className="text-sm text-destaque">{restantes} pontos para distribuir</span>
        )}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {atributosDistribuiveis(heroi.classeId).map((a) => {
            const valor = a === "manaMax" ? atributos.manaMax : atributos[a];
            const extra = (planejados[a] || 0) * TAXA_PONTO[a];
            return (
              <tr key={a} className="border-b border-borda/60 last:border-b-0">
                <th scope="row" className="py-1 text-left font-normal text-texto-2">
                  {NOMES_ATRIBUTO[a]}
                </th>
                <td className="py-1 text-right">
                  {valor}
                  {extra > 0 && <span className="text-sucesso"> +{extra}</span>}
                </td>
                {heroi.pontosLivres > 0 && (
                  <td className="w-24 py-1 text-right">
                    <button
                      className="botao botao-discreto min-h-7 px-2"
                      aria-label={`Tirar ponto de ${NOMES_ATRIBUTO[a]}`}
                      disabled={!planejados[a]}
                      onClick={() => mudar(a, -1)}
                    >
                      −
                    </button>
                    <button
                      className="botao botao-secundario min-h-7 px-2"
                      aria-label={`Pôr ponto em ${NOMES_ATRIBUTO[a]}`}
                      disabled={restantes <= 0}
                      onClick={() => mudar(a, 1)}
                    >
                      +
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {heroi.pontosLivres > 0 && (
        <div className="mt-2 flex gap-2">
          <Botao variante="primario" disabled={usados === 0} onClick={confirmar}>
            Confirmar pontos
          </Botao>
          <Botao variante="discreto" disabled={usados === 0} onClick={() => setPlanejados({})}>
            Desfazer
          </Botao>
        </div>
      )}
    </section>
  );
}

function Equipamento({ save, heroi, acoes }) {
  const travado = heroiTravado(save, heroi.id);
  return (
    <section aria-labelledby="titulo-equipamento">
      <h3 id="titulo-equipamento" className="titulo mb-2 text-sm">
        Equipamento
      </h3>
      {travado && <p className="mb-2 text-sm text-texto-3">Em batalha: o equipamento não pode ser trocado agora.</p>}
      <ul className="space-y-1">
        {SLOTS_EQUIPAMENTO.map((slot) => {
          const item = heroi.equipamento[slot] ? save.inventario.equipamentos[heroi.equipamento[slot]] : null;
          return (
            <li key={slot} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-texto-3">{NOMES_SLOT[slot]}</span>
              {item ? (
                <>
                  <span className={`flex-1 truncate ${classeRaridade(item.raridade)}`}>{item.nome}</span>
                  <button
                    className="botao botao-discreto min-h-7 px-2"
                    disabled={travado}
                    onClick={() => acoes.desequipar(heroi.id, slot)}
                  >
                    Tirar
                  </button>
                </>
              ) : (
                <span className="flex-1 text-texto-3">Vazio</span>
              )}
            </li>
          );
        })}
      </ul>
      <Botao variante="discreto" className="mt-2 px-0" onClick={() => acoes.navegar("inventario")}>
        Trocar equipamento no inventário
      </Botao>
    </section>
  );
}

function DescricaoGolpe({ id, recurso }) {
  const g = golpes[id];
  return (
    <>
      <span className="titulo">{g.nome}</span>{" "}
      <span style={{ color: corRecurso(recurso) }}>{g.custo > 0 ? `${g.custo} ${recurso}` : "grátis"}</span>
      <span className="block text-texto-2">
        {g.elemento && g.elemento !== "arma" ? `${NOMES_ELEMENTO[g.elemento]}, ` : ""}
        {g.poder ? `poder ${g.poder}${g.acertos > 1 ? ` ×${g.acertos}` : ""}, ` : ""}
        {DESCRICAO_ALVO[g.alvo]}. {g.descricao}
      </span>
    </>
  );
}

function Golpes({ save, heroi, acoes }) {
  const classe = classesHeroi[heroi.classeId];
  const [trocando, setTrocando] = useState(null);
  const travado = heroiTravado(save, heroi.id);
  const reserva = heroi.golpesAprendidos.filter((id) => !heroi.golpesEquipados.includes(id));
  const proximos = classe.golpesPorNivel.filter((g) => !heroi.golpesAprendidos.includes(g.golpeId));
  const cheio = heroi.golpesEquipados.length >= MAX_GOLPES_EQUIPADOS;

  const equipar = (id) => {
    if (!cheio) acoes.equiparGolpes(heroi.id, [...heroi.golpesEquipados, id]);
    else setTrocando((atual) => (atual === id ? null : id));
  };
  const substituir = (antigo) => {
    acoes.equiparGolpes(
      heroi.id,
      heroi.golpesEquipados.map((id) => (id === antigo ? trocando : id)),
    );
    setTrocando(null);
  };

  return (
    <section aria-labelledby="titulo-golpes">
      <h3 id="titulo-golpes" className="titulo mb-2 text-sm">
        Golpes em uso ({heroi.golpesEquipados.length}/{MAX_GOLPES_EQUIPADOS})
      </h3>
      {travado && <p className="mb-2 text-sm text-texto-3">Em batalha: os golpes não podem ser trocados agora.</p>}
      <ul className="space-y-2">
        {heroi.golpesEquipados.map((id) => (
          <li key={id} className="text-sm">
            <DescricaoGolpe id={id} recurso={classe.recurso} />
            {trocando && (
              <button className="botao botao-secundario mt-1 min-h-7 px-2" onClick={() => substituir(id)}>
                Trocar por {golpes[trocando].nome}
              </button>
            )}
          </li>
        ))}
        <li className="text-sm text-texto-2">
          <DescricaoGolpe id={classe.golpeBasico} recurso={classe.recurso} />
          <span className="block text-xs text-texto-3">Sempre disponível, não ocupa espaço.</span>
        </li>
      </ul>

      {reserva.length > 0 && (
        <>
          <h3 className="titulo mt-4 mb-2 text-sm">Aprendidos, fora de uso</h3>
          <ul className="space-y-2">
            {reserva.map((id) => (
              <li key={id} className="text-sm">
                <DescricaoGolpe id={id} recurso={classe.recurso} />
                <button
                  className={`botao mt-1 min-h-7 px-2 ${trocando === id ? "botao-secundario text-destaque" : "botao-secundario"}`}
                  disabled={travado}
                  aria-pressed={trocando === id}
                  onClick={() => equipar(id)}
                >
                  {cheio ? (trocando === id ? "Escolha qual substituir" : "Usar no lugar de outro") : "Usar"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {proximos.length > 0 && (
        <>
          <h3 className="titulo mt-4 mb-1 text-sm">Próximos golpes</h3>
          <ul className="text-sm text-texto-3">
            {proximos.map((g) => (
              <li key={g.golpeId}>
                Nível {g.nivel}: {golpes[g.golpeId].nome}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-sm text-texto-2">
        <span className="text-texto">Passivo:</span> {classe.passivo.descricao}
      </p>
    </section>
  );
}

function CartaoHeroi({ save, heroi, selecionado, agora, aoEscolher }) {
  const atividade = atividadeDoHeroi(save, heroi.id);
  let situacao = null;
  if (atividade) {
    const expedicao = atividade.tipo === "expedicao";
    situacao = atividadeConcluida(atividade, agora)
      ? `${expedicao ? "expedição concluída" : "treino concluído"}: coletar`
      : `${expedicao ? "expedição" : "treino"}, faltam ${formatarDuracao(tempoRestante(atividade, agora))}`;
  }
  return (
    <button
      role="tab"
      aria-selected={selecionado}
      onClick={() => aoEscolher(heroi.id)}
      className={`painel flex items-end gap-2 px-3 py-2 ${selecionado ? "border-destaque" : "hover:border-borda-forte"}`}
    >
      <Sprite sprite={spritesHerois[heroi.classeId]} escala={2} rotulo="" />
      <span className="text-left">
        <span className="titulo block">{heroi.nome}</span>
        <span className="text-sm text-texto-2">
          {classesHeroi[heroi.classeId].nome}, nível {heroi.nivel}
          {heroi.pontosLivres > 0 && <span className="text-destaque"> (+{heroi.pontosLivres})</span>}
        </span>
        {situacao && <span className="block text-xs text-texto-3">{situacao}</span>}
      </span>
    </button>
  );
}

// Botão de entrar/sair do grupo com o motivo quando está desabilitado (SPEC.md §3.2)
function LugarNoGrupo({ save, heroi, agora, acoes }) {
  const noGrupo = save.grupo.includes(heroi.id);
  const atividade = atividadeDoHeroi(save, heroi.id);
  let motivo = noGrupo ? motivoNaoSaiDoGrupo(save, heroi.id) : motivoNaoEntraNoGrupo(save, heroi.id);
  if (!noGrupo && atividade) {
    motivo = atividadeConcluida(atividade, agora)
      ? `${atividade.tipo === "expedicao" ? "Expedição concluída" : "Treino pronto"}: colete em Atividades`
      : `${motivo} (termina em ${formatarDuracao(tempoRestante(atividade, agora))})`;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Botao
        disabled={Boolean(motivo)}
        onClick={() => (noGrupo ? acoes.tirarDoGrupo(heroi.id) : acoes.colocarNoGrupo(heroi.id))}
      >
        {noGrupo ? "Mover para a reserva" : "Colocar no grupo"}
      </Botao>
      {motivo && <span className="text-sm text-texto-3">{motivo}</span>}
      {atividade && (
        <Botao variante="discreto" onClick={() => acoes.navegar("atividades")}>
          Ver em Atividades
        </Botao>
      )}
    </div>
  );
}

// Dispensar com confirmação; o motivo aparece quando não é possível (SPEC.md §3.2)
function Dispensar({ save, heroi, acoes }) {
  const [confirmando, setConfirmando] = useState(false);
  const motivo = motivoNaoDispensa(save, heroi.id);
  const itens = Object.values(heroi.equipamento).filter(Boolean).length;
  const dispensar = () => {
    setConfirmando(false);
    acoes.dispensarHeroi(heroi.id);
  };
  return (
    <section className="mt-6 border-t border-borda pt-3" aria-labelledby="titulo-dispensar">
      <h3 id="titulo-dispensar" className="sr-only">
        Dispensar
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <Botao variante="perigo" disabled={Boolean(motivo)} onClick={() => setConfirmando(true)}>
          Dispensar {heroi.nome}
        </Botao>
        {motivo && <span className="text-sm text-texto-3">{motivo}</span>}
      </div>
      {confirmando && (
        <Modal
          titulo={`Dispensar ${heroi.nome}?`}
          aoFechar={() => setConfirmando(false)}
          acoes={
            <>
              <Botao variante="discreto" onClick={() => setConfirmando(false)}>
                Manter
              </Botao>
              <Botao variante="perigo" onClick={dispensar}>
                Dispensar
              </Botao>
            </>
          }
        >
          <p>
            {heroi.nome} ({classesHeroi[heroi.classeId].nome}, nível {heroi.nivel}) deixa a companhia para sempre, com o nível
            e os pontos. {itens > 0 ? `O equipamento (${itens} ${itens === 1 ? "item" : "itens"}) volta ao inventário.` : ""} Não dá
            para desfazer.
          </p>
        </Modal>
      )}
    </section>
  );
}

export default function TelaGrupo() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const grupo = heroisDoGrupo(save);
  const reserva = heroisDaReserva(save);
  const todos = [...grupo, ...reserva];
  const [escolhido, setEscolhido] = useState(todos.find((h) => h.pontosLivres > 0)?.id ?? grupo[0].id);
  const heroi = save.herois[escolhido] ?? grupo[0];
  const necessario = xpParaProximoNivel(heroi.nivel);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <h2 className="titulo mb-2 text-sm text-texto-2">
        Grupo ({grupo.length}/{MAX_GRUPO})
      </h2>
      <div role="tablist" aria-label="Heróis do grupo" className="mb-4 flex flex-wrap gap-2">
        {grupo.map((h) => (
          <CartaoHeroi key={h.id} save={save} heroi={h} selecionado={h.id === heroi.id} agora={agora} aoEscolher={setEscolhido} />
        ))}
      </div>

      <h2 className="titulo mb-2 text-sm text-texto-2">
        Reserva ({reserva.length}) · {todos.length}/{MAX_HEROIS} heróis
      </h2>
      {reserva.length === 0 ? (
        <p className="mb-4 text-sm text-texto-3">
          Ninguém na reserva. Heróis da reserva podem treinar em Atividades; contrate mais na Taverna.
        </p>
      ) : (
        <div role="tablist" aria-label="Heróis da reserva" className="mb-4 flex flex-wrap gap-2">
          {reserva.map((h) => (
            <CartaoHeroi key={h.id} save={save} heroi={h} selecionado={h.id === heroi.id} agora={agora} aoEscolher={setEscolhido} />
          ))}
        </div>
      )}

      <div className="painel p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="titulo text-lg text-destaque">{heroi.nome}</h2>
          <LugarNoGrupo save={save} heroi={heroi} agora={agora} acoes={acoes} />
        </div>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="titulo">Experiência</span>
            <span className="text-texto-2">
              {heroi.xp} de {necessario} para o nível {heroi.nivel + 1}
            </span>
          </div>
          <BarraValor atual={heroi.xp} maximo={necessario} cor="var(--color-info)" rotulo="Experiência" fina />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Atributos key={heroi.id} save={save} heroi={heroi} acoes={acoes} />
          <Golpes key={`golpes-${heroi.id}`} save={save} heroi={heroi} acoes={acoes} />
          <Equipamento save={save} heroi={heroi} acoes={acoes} />
        </div>
        <Dispensar key={`dispensar-${heroi.id}`} save={save} heroi={heroi} acoes={acoes} />
      </div>
    </main>
  );
}
