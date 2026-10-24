import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDaReserva } from "../../state/seletores";
import { classesHeroi } from "../../data/classesHeroi";
import { golpes } from "../../data/golpes";
import { buscarZona } from "../../data/zonas";
import { spritesHerois } from "../../data/sprites";
import { NOMES_ATRIBUTO, DESCRICAO_ALVO } from "../../data/textos";
import { ZONAS_QUE_LIBERAM_VAGA_TREINO, NIVEIS_ANTECIPADOS_GOLPE } from "../../data/treino";
import { atividadeConcluida, atividadeDoHeroi, decorrido, fimDaAtividade, tempoRestante } from "../../engine/atividades";
import {
  vagasDeTreino,
  treinosEmAndamento,
  motivoNaoTreina,
  opcoesTreinoAtributo,
  opcoesTreinoGolpe,
} from "../../engine/treino";
import { atividadesConcluidas, previaDoGanho } from "../../engine/coleta";
import Sprite from "../battle/Sprite";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";
import Modal from "../common/Modal";
import { descreverAtividade, descreverGanho } from "../common/descricoes";
import { formatarDuracao, useAgoraDoJogo } from "../common/tempo";

function CartaoTreino({ save, atividade, agora, aoCancelar, acoes }) {
  const heroi = save.herois[atividade.heroiId];
  const pronto = atividadeConcluida(atividade, agora);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded border border-borda bg-elevado p-3">
      <Sprite sprite={spritesHerois[heroi.classeId]} escala={2} rotulo="" />
      <div className="min-w-48 flex-1">
        <p>
          <span className="titulo">{heroi.nome}</span>{" "}
          <span className="text-sm text-texto-2">
            {descreverAtividade(atividade)}, {formatarDuracao(atividade.duracao)}
          </span>
        </p>
        <BarraValor
          atual={decorrido(atividade, agora)}
          maximo={atividade.duracao}
          cor={pronto ? "var(--color-sucesso)" : "var(--color-destaque)"}
          rotulo={`Progresso do treino de ${heroi.nome}`}
          fina
        />
        <p className="mt-1 text-sm text-texto-2">
          {pronto ? (
            <span className="text-sucesso">Pronto: {descreverGanho(previaDoGanho(save, atividade, agora))}</span>
          ) : (
            `Faltam ${formatarDuracao(tempoRestante(atividade, agora))}`
          )}
        </p>
      </div>
      {pronto ? (
        <Botao variante="primario" onClick={() => acoes.coletarAtividade(atividade.id)}>
          Coletar
        </Botao>
      ) : (
        <Botao variante="discreto" onClick={() => aoCancelar(atividade)}>
          Cancelar
        </Botao>
      )}
    </li>
  );
}

function ConfirmarCancelamento({ save, atividade, agora, aoFechar, acoes }) {
  const heroi = save.herois[atividade.heroiId];
  const ganho = descreverGanho(previaDoGanho(save, atividade, agora));
  const cancelar = () => {
    acoes.cancelarAtividade(atividade.id);
    aoFechar();
  };
  return (
    <Modal
      titulo="Cancelar o treino?"
      aoFechar={aoFechar}
      acoes={
        <>
          <Botao variante="discreto" onClick={aoFechar}>
            Continuar treinando
          </Botao>
          <Botao variante="perigo" onClick={cancelar}>
            Cancelar treino
          </Botao>
        </>
      }
    >
      <p>
        {heroi.nome} volta agora e leva {ganho === "nada ainda" ? "nada do treino" : ganho}. Só contam as horas
        completas{atividade.tipo === "treinoGolpe" ? " e o golpe só é aprendido no fim" : ""}. Os{" "}
        {atividade.custoPago} de ouro pagos não são devolvidos.
      </p>
    </Modal>
  );
}

function TreinoDeAtributo({ save, heroi, bloqueado, acoes }) {
  return (
    <>
      <p className="mb-2 text-sm text-texto-2">
        Cada hora completa vale 1 ponto, igual a um ponto de nível. Cada atributo aceita até {heroi.nivel} pontos de treino
        (o nível do herói). O ouro é pago no início.
      </p>
      <ul className="divide-y divide-borda">
        {opcoesTreinoAtributo(save, heroi).map((opcao) => (
          <li key={opcao.atributo} className="flex flex-wrap items-center gap-2 py-2">
            <span className="w-32">
              <span className="block">{NOMES_ATRIBUTO[opcao.atributo]}</span>
              <span className={`text-xs ${opcao.motivo ? "text-perigo" : "text-texto-3"}`}>
                {opcao.motivo ?? `Treino ${opcao.atual}/${opcao.limite}`}
              </span>
            </span>
            <span className="grid flex-1 grid-cols-2 gap-1 sm:flex sm:flex-wrap">
              {opcao.duracoes.map((d) => (
                <Botao
                  key={d.horas}
                  className="min-h-8 px-2"
                  disabled={Boolean(bloqueado || d.motivo)}
                  title={d.motivo ?? undefined}
                  onClick={() => acoes.treinarAtributo(heroi.id, opcao.atributo, d.horas)}
                >
                  {d.horas}h · {d.custo} ouro
                </Botao>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function TreinoDeGolpe({ save, heroi, bloqueado, acoes }) {
  const opcoes = opcoesTreinoGolpe(save, heroi);
  const recurso = classesHeroi[heroi.classeId].recurso;
  if (opcoes.length === 0) return <p className="text-sm text-texto-2">{heroi.nome} já conhece todos os golpes da classe.</p>;
  return (
    <>
      <p className="mb-2 text-sm text-texto-2">
        Aprenda um golpe avançado antes do nível, até {NIVEIS_ANTECIPADOS_GOLPE} níveis antes do exigido. O golpe só é aprendido no fim do treino.
      </p>
      <ul className="divide-y divide-borda">
        {opcoes.map((opcao) => {
          const g = golpes[opcao.golpeId];
          return (
            <li key={opcao.golpeId} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-48 flex-1 text-sm">
                <span className="titulo">{g.nome}</span> <span className="text-texto-3">nível {opcao.nivel}</span>
                <span className="block text-texto-2">
                  {g.custo > 0 ? `${g.custo} ${recurso}, ` : ""}
                  {DESCRICAO_ALVO[g.alvo]}. {g.descricao}
                </span>
                {opcao.motivo && <span className="block text-xs text-perigo">{opcao.motivo}</span>}
              </span>
              <Botao
                disabled={Boolean(bloqueado || opcao.motivo)}
                onClick={() => acoes.treinarGolpe(heroi.id, opcao.golpeId)}
              >
                Treinar · {opcao.horas}h · {opcao.ouro} ouro
              </Botao>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function NovoTreino({ save, agora, acoes }) {
  const reserva = heroisDaReserva(save);
  const livre = reserva.find((h) => !atividadeDoHeroi(save, h.id));
  const [heroiId, setHeroiId] = useState(livre?.id ?? reserva[0]?.id ?? null);
  const [tipo, setTipo] = useState("atributo");
  const heroi = save.herois[heroiId] && !save.grupo.includes(heroiId) ? save.herois[heroiId] : null;

  if (reserva.length === 0) {
    return (
      <p className="text-texto-2">
        Só heróis da reserva treinam. Tire alguém do grupo na tela Grupo ou contrate um recruta na Taverna.
      </p>
    );
  }

  const motivo = heroi ? motivoNaoTreina(save, heroi.id) : "Escolha um herói da reserva.";
  const atividade = heroi ? atividadeDoHeroi(save, heroi.id) : null;

  return (
    <>
      <fieldset className="mb-3">
        <legend className="mb-1 text-sm text-texto-2">Quem vai treinar</legend>
        <div className="flex flex-wrap gap-1">
          {reserva.map((h) => {
            const ocupado = atividadeDoHeroi(save, h.id);
            return (
              <button
                key={h.id}
                aria-pressed={h.id === heroiId}
                onClick={() => setHeroiId(h.id)}
                className={`botao min-h-8 px-2 ${h.id === heroiId ? "botao-secundario text-destaque" : "botao-discreto"}`}
              >
                {h.nome} <span className="font-normal text-texto-3">nv {h.nivel}{ocupado ? ", treinando" : ""}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {heroi && (
        <>
          {motivo && (
            <p className="mb-2 text-sm text-texto-3">
              {atividade
                ? `${heroi.nome} já está treinando (${atividadeConcluida(atividade, agora) ? "pronto para coletar" : `termina em ${formatarDuracao(fimDaAtividade(atividade) - agora)}`}).`
                : motivo}
            </p>
          )}
          <div role="tablist" aria-label="Tipo de treino" className="mb-2 flex gap-1">
            {[
              ["atributo", "Atributo"],
              ["golpe", "Golpe"],
            ].map(([id, nome]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tipo === id}
                onClick={() => setTipo(id)}
                className={`botao min-h-8 px-3 ${tipo === id ? "botao-secundario text-destaque" : "botao-discreto"}`}
              >
                {nome}
              </button>
            ))}
          </div>
          {tipo === "atributo" ? (
            <TreinoDeAtributo save={save} heroi={heroi} bloqueado={motivo} acoes={acoes} />
          ) : (
            <TreinoDeGolpe save={save} heroi={heroi} bloqueado={motivo} acoes={acoes} />
          )}
        </>
      )}
    </>
  );
}

export default function TelaAtividades() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const [cancelando, setCancelando] = useState(null);
  const vagas = vagasDeTreino(save);
  const treinos = treinosEmAndamento(save).sort((a, b) => fimDaAtividade(a) - fimDaAtividade(b));
  const prontas = atividadesConcluidas(save, agora);
  const proximaVaga = ZONAS_QUE_LIBERAM_VAGA_TREINO.find((id) => !save.progresso.zonas[id]?.chefeDerrotado);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="titulo text-2xl text-destaque">Atividades</h1>
        <span className="text-sm text-texto-2">Heróis da reserva treinam no quartel, mesmo com o jogo fechado.</span>
        {prontas.length > 0 && (
          <Botao variante="primario" className="ml-auto" onClick={acoes.coletarTudo}>
            Coletar tudo ({prontas.length})
          </Botao>
        )}
      </header>

      <section className="painel p-4" aria-labelledby="titulo-treinos">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
          <h2 id="titulo-treinos" className="titulo text-lg">
            Treino ({treinos.length}/{vagas} {vagas === 1 ? "vaga" : "vagas"})
          </h2>
          {proximaVaga && (
            <span className="text-sm text-texto-3">
              Mais uma vaga depois de vencer o chefe de {buscarZona(proximaVaga).nome}.
            </span>
          )}
        </div>
        {treinos.length === 0 ? (
          <p className="text-texto-2">Ninguém está treinando agora.</p>
        ) : (
          <ul className="space-y-2">
            {treinos.map((a) => (
              <CartaoTreino key={a.id} save={save} atividade={a} agora={agora} aoCancelar={setCancelando} acoes={acoes} />
            ))}
          </ul>
        )}
      </section>

      <section className="painel mt-4 p-4" aria-labelledby="titulo-novo-treino">
        <h2 id="titulo-novo-treino" className="titulo mb-3 text-lg">
          Novo treino
        </h2>
        <NovoTreino save={save} agora={agora} acoes={acoes} />
      </section>

      {cancelando && save.atividades[cancelando.id] && (
        <ConfirmarCancelamento
          save={save}
          atividade={save.atividades[cancelando.id]}
          agora={agora}
          aoFechar={() => setCancelando(null)}
          acoes={acoes}
        />
      )}
    </main>
  );
}
