import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { heroisDaReserva } from "../../state/seletores";
import { classesHeroi } from "../../data/classesHeroi";
import { golpes } from "../../data/golpes";
import { buscarZona } from "../../data/zonas";
import { spritesHerois } from "../../data/sprites";
import { NOMES_ATRIBUTO, DESCRICAO_ALVO } from "../../data/textos";
import { ZONAS_QUE_LIBERAM_VAGA_TREINO, NIVEIS_ANTECIPADOS_GOLPE } from "../../data/treino";
import { DURACOES_EXPEDICAO_MINUTOS, MINUTOS_POR_ROLAGEM, ZONAS_QUE_LIBERAM_VAGA_EXPEDICAO } from "../../data/expedicoes";
import { atividadeConcluida, atividadeDoHeroi, decorrido, fimDaAtividade, tempoRestante } from "../../engine/atividades";
import {
  vagasDeTreino,
  treinosEmAndamento,
  motivoNaoTreina,
  opcoesTreinoAtributo,
  opcoesTreinoGolpe,
} from "../../engine/treino";
import {
  vagasDeExpedicao,
  expedicoesEmAndamento,
  motivoNaoViaja,
  opcoesDeZona,
  rolagensCompletas,
  totalDeRolagens,
} from "../../engine/expedicoes";
import { atividadesConcluidas, previaDoGanho } from "../../engine/coleta";
import Sprite from "../battle/Sprite";
import BarraValor from "../common/BarraValor";
import Botao from "../common/Botao";
import Modal from "../common/Modal";
import { descreverAtividade, descreverGanho } from "../common/descricoes";
import { formatarDuracao, useAgoraDoJogo } from "../common/tempo";

const MINUTO_MS = 60 * 1000;

function CartaoAtividade({ save, atividade, agora, aoCancelar, acoes }) {
  const heroi = save.herois[atividade.heroiId];
  const pronto = atividadeConcluida(atividade, agora);
  const expedicao = atividade.tipo === "expedicao";
  const ganho = descreverGanho(previaDoGanho(save, atividade, agora));
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
          rotulo={`Progresso de ${heroi.nome}`}
          fina
        />
        <p className="mt-1 text-sm text-texto-2">
          {pronto ? "Pronto" : `Faltam ${formatarDuracao(tempoRestante(atividade, agora))}`}
          {expedicao && ` · ${rolagensCompletas(atividade, agora)}/${totalDeRolagens(atividade)} rolagens`}
        </p>
        {(pronto || expedicao) && ganho !== "nada ainda" && (
          <p className={`text-sm ${pronto ? "text-sucesso" : "text-texto-3"}`}>
            {pronto ? "" : "Até agora: "}
            {ganho}
          </p>
        )}
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

const TEXTO_CANCELAR = {
  expedicao: {
    titulo: "Encerrar a expedição?",
    manter: "Continuar viajando",
    confirmar: "Voltar agora",
    regra: "Só contam as rolagens de 15 min completas.",
  },
  treino: {
    titulo: "Cancelar o treino?",
    manter: "Continuar treinando",
    confirmar: "Cancelar treino",
    regra: "Só contam as horas completas.",
  },
};

function ConfirmarCancelamento({ save, atividade, agora, aoFechar, acoes }) {
  const heroi = save.herois[atividade.heroiId];
  const ganho = descreverGanho(previaDoGanho(save, atividade, agora));
  const texto = TEXTO_CANCELAR[atividade.tipo === "expedicao" ? "expedicao" : "treino"];
  const cancelar = () => {
    acoes.cancelarAtividade(atividade.id);
    aoFechar();
  };
  return (
    <Modal
      titulo={texto.titulo}
      aoFechar={aoFechar}
      acoes={
        <>
          <Botao variante="discreto" onClick={aoFechar}>
            {texto.manter}
          </Botao>
          <Botao variante="perigo" onClick={cancelar}>
            {texto.confirmar}
          </Botao>
        </>
      }
    >
      <p>
        {heroi.nome} volta agora e leva {ganho === "nada ainda" ? "nada" : ganho}. {texto.regra}
        {atividade.tipo === "treinoGolpe" && " O golpe só é aprendido no fim."}
        {atividade.custoPago > 0 && ` Os ${atividade.custoPago} de ouro pagos não são devolvidos.`}
      </p>
    </Modal>
  );
}

// Escolha de um herói da reserva, comum ao treino e às expedições
function EscolhaDeHeroi({ save, heroiId, aoEscolher, legenda }) {
  return (
    <fieldset className="mb-3">
      <legend className="mb-1 text-sm text-texto-2">{legenda}</legend>
      <div className="flex flex-wrap gap-1">
        {heroisDaReserva(save).map((h) => {
          const atividade = atividadeDoHeroi(save, h.id);
          const ocupado = atividade ? (atividade.tipo === "expedicao" ? ", viajando" : ", treinando") : "";
          return (
            <button
              key={h.id}
              aria-pressed={h.id === heroiId}
              onClick={() => aoEscolher(h.id)}
              className={`botao min-h-8 px-2 ${h.id === heroiId ? "botao-secundario text-destaque" : "botao-discreto"}`}
            >
              {h.nome}{" "}
              <span className="font-normal text-texto-3">
                nv {h.nivel}
                {ocupado}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Herói escolhido (só da reserva) e o texto que explica por que ele não pode começar algo agora
function useHeroiDaReserva(save) {
  const reserva = heroisDaReserva(save);
  const livre = reserva.find((h) => !atividadeDoHeroi(save, h.id));
  const [heroiId, setHeroiId] = useState(livre?.id ?? reserva[0]?.id ?? null);
  const heroi = save.herois[heroiId] && !save.grupo.includes(heroiId) ? save.herois[heroiId] : null;
  return { reserva, heroi, heroiId, setHeroiId };
}

function MotivoBloqueio({ save, heroi, motivo, agora }) {
  if (!motivo) return null;
  const atividade = atividadeDoHeroi(save, heroi.id);
  let texto = motivo;
  if (atividade) {
    const quando = atividadeConcluida(atividade, agora)
      ? "pronto para coletar"
      : `termina em ${formatarDuracao(fimDaAtividade(atividade) - agora)}`;
    texto = `${heroi.nome} já tem uma atividade: ${descreverAtividade(atividade)} (${quando}).`;
  }
  return <p className="mb-2 text-sm text-texto-3">{texto}</p>;
}

const SEM_RESERVA =
  "Só heróis da reserva fazem atividades. Tire alguém do grupo na tela Grupo ou contrate um recruta na Taverna.";

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
  const { reserva, heroi, heroiId, setHeroiId } = useHeroiDaReserva(save);
  const [tipo, setTipo] = useState("atributo");
  if (reserva.length === 0) return <p className="text-texto-2">{SEM_RESERVA}</p>;
  const motivo = heroi ? motivoNaoTreina(save, heroi.id) : "Escolha um herói da reserva.";

  return (
    <>
      <EscolhaDeHeroi save={save} heroiId={heroiId} aoEscolher={setHeroiId} legenda="Quem vai treinar" />
      {heroi && (
        <>
          <MotivoBloqueio save={save} heroi={heroi} motivo={motivo} agora={agora} />
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

function NovaExpedicao({ save, agora, acoes }) {
  const { reserva, heroi, heroiId, setHeroiId } = useHeroiDaReserva(save);
  const opcoes = heroi ? opcoesDeZona(save, heroi) : [];
  const [zonaId, setZonaId] = useState(null);
  if (reserva.length === 0) return <p className="text-texto-2">{SEM_RESERVA}</p>;
  const motivo = heroi ? motivoNaoViaja(save, heroi.id) : "Escolha um herói da reserva.";
  // Zona escolhida, ou a mais avançada que o herói pode visitar
  const abertas = opcoes.filter((o) => !o.motivo);
  const zona = opcoes.find((o) => o.zona.id === zonaId && !o.motivo)?.zona ?? abertas[abertas.length - 1]?.zona;

  return (
    <>
      <EscolhaDeHeroi save={save} heroiId={heroiId} aoEscolher={setHeroiId} legenda="Quem vai viajar" />
      {heroi && (
        <>
          <MotivoBloqueio save={save} heroi={heroi} motivo={motivo} agora={agora} />
          <fieldset className="mb-3">
            <legend className="mb-1 text-sm text-texto-2">Para onde</legend>
            <div className="flex flex-wrap gap-1">
              {opcoes
                .filter((o) => o.motivo !== "Zona bloqueada")
                .map(({ zona: z, motivo: fechada }) => (
                  <button
                    key={z.id}
                    aria-pressed={zona?.id === z.id}
                    disabled={Boolean(fechada)}
                    title={fechada ?? undefined}
                    onClick={() => setZonaId(z.id)}
                    className={`botao min-h-8 px-2 ${zona?.id === z.id ? "botao-secundario text-destaque" : "botao-discreto"}`}
                  >
                    {z.nome}
                    {fechada && <span className="font-normal text-texto-3"> ({fechada.toLowerCase()})</span>}
                  </button>
                ))}
            </div>
          </fieldset>
          {zona && (
            <>
              <p className="mb-2 text-sm text-texto-2">
                A cada {MINUTOS_POR_ROLAGEM} min, {heroi.nome} encontra um material de {zona.nome}, além de ouro e
                experiência. O que for achado só entra no inventário ao coletar.
              </p>
              <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
                {DURACOES_EXPEDICAO_MINUTOS.map((minutos) => (
                  <Botao
                    key={minutos}
                    className="min-h-8 px-2"
                    disabled={Boolean(motivo)}
                    onClick={() => acoes.iniciarExpedicao(heroi.id, zona.id, minutos)}
                  >
                    {formatarDuracao(minutos * MINUTO_MS)} · {minutos / MINUTOS_POR_ROLAGEM} rolagens
                  </Botao>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function Secao({ id, titulo, ocupadas, vagas, proximaVaga, vazio, atividades, save, agora, aoCancelar, acoes, children, tituloNovo }) {
  return (
    <section className="painel mt-4 p-4" aria-labelledby={`titulo-${id}`}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h2 id={`titulo-${id}`} className="titulo text-lg">
          {titulo} ({ocupadas}/{vagas} {vagas === 1 ? "vaga" : "vagas"})
        </h2>
        {proximaVaga && (
          <span className="text-sm text-texto-3">Mais uma vaga depois de vencer o chefe de {buscarZona(proximaVaga).nome}.</span>
        )}
      </div>
      {atividades.length === 0 ? (
        <p className="text-texto-2">{vazio}</p>
      ) : (
        <ul className="space-y-2">
          {atividades.map((a) => (
            <CartaoAtividade key={a.id} save={save} atividade={a} agora={agora} aoCancelar={aoCancelar} acoes={acoes} />
          ))}
        </ul>
      )}
      <h3 className="titulo mt-4 mb-2 border-t border-borda pt-3 text-base">{tituloNovo}</h3>
      {children}
    </section>
  );
}

const porFim = (a, b) => fimDaAtividade(a) - fimDaAtividade(b);
const proximaVagaEntre = (save, zonaIds) => zonaIds.find((id) => !save.progresso.zonas[id]?.chefeDerrotado);

export default function TelaAtividades() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const [cancelando, setCancelando] = useState(null);
  const expedicoes = expedicoesEmAndamento(save).sort(porFim);
  const treinos = treinosEmAndamento(save).sort(porFim);
  const prontas = atividadesConcluidas(save, agora);
  const comum = { save, agora, aoCancelar: setCancelando, acoes };

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="titulo text-2xl text-destaque">Atividades</h1>
        <span className="text-sm text-texto-2">Heróis da reserva viajam e treinam, mesmo com o jogo fechado.</span>
        {prontas.length > 0 && (
          <Botao variante="primario" className="ml-auto" onClick={acoes.coletarTudo}>
            Coletar tudo ({prontas.length})
          </Botao>
        )}
      </header>

      <Secao
        id="expedicoes"
        titulo="Expedições"
        ocupadas={expedicoes.length}
        vagas={vagasDeExpedicao(save)}
        proximaVaga={proximaVagaEntre(save, ZONAS_QUE_LIBERAM_VAGA_EXPEDICAO)}
        vazio="Ninguém está viajando agora."
        atividades={expedicoes}
        tituloNovo="Nova expedição"
        {...comum}
      >
        <NovaExpedicao save={save} agora={agora} acoes={acoes} />
      </Secao>

      <Secao
        id="treinos"
        titulo="Treino"
        ocupadas={treinos.length}
        vagas={vagasDeTreino(save)}
        proximaVaga={proximaVagaEntre(save, ZONAS_QUE_LIBERAM_VAGA_TREINO)}
        vazio="Ninguém está treinando agora."
        atividades={treinos}
        tituloNovo="Novo treino"
        {...comum}
      >
        <NovoTreino save={save} agora={agora} acoes={acoes} />
      </Secao>

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
