import { useEstado, useAcoes } from "../../state/contextos";
import { classesHeroi } from "../../data/classesHeroi";
import { spritesHerois } from "../../data/sprites";
import { MAX_HEROIS, MAX_GRUPO } from "../../data/constants";
import { NOMES_RECURSO } from "../../data/textos";
import { NIVEIS_ABAIXO_DO_GRUPO } from "../../data/recrutamento";
import {
  nivelDoRecruta,
  custoDoRecruta,
  motivoNaoContrata,
  tempoAteRenovarMural,
} from "../../engine/recrutamento";
import { motivoGrupoTravado } from "../../engine/grupo";
import Sprite from "../battle/Sprite";
import Cozinha from "../taverna/Cozinha";
import Botao from "../common/Botao";
import { formatarDuracao, useAgoraDoJogo } from "../common/tempo";

function CartaoRecruta({ save, opcao, indice, nivel, custo, acoes }) {
  const classe = classesHeroi[opcao.classeId];
  const motivo = motivoNaoContrata(save, indice);
  return (
    <li className={`flex flex-col rounded border border-borda bg-elevado p-3 ${opcao.contratado ? "opacity-50" : ""}`}>
      <div className="flex items-end gap-3">
        <Sprite sprite={spritesHerois[opcao.classeId]} escala={3} rotulo="" />
        <div>
          <p className="titulo text-lg">{opcao.nome}</p>
          <p className="text-sm text-texto-2">
            {classe.nome}, nível {nivel}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-texto-2">{classe.descricao}</p>
      <p className="mt-1 text-sm">
        <span className="text-texto-3">Usa {NOMES_RECURSO[classe.recurso]}.</span> {classe.passivo.descricao}.
      </p>
      <div className="mt-auto pt-3">
        <Botao variante="primario" className="w-full" disabled={Boolean(motivo)} onClick={() => acoes.contratarRecruta(indice)}>
          {opcao.contratado ? "Contratado" : `Contratar por ${custo} ouro`}
        </Botao>
        {motivo && !opcao.contratado && <p className="mt-1 text-sm text-texto-3">{motivo}</p>}
      </div>
    </li>
  );
}

export default function TelaTaverna() {
  const { save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const nivel = nivelDoRecruta(save);
  const custo = custoDoRecruta(nivel);
  const total = Object.keys(save.herois).length;
  const vaiParaReserva = save.grupo.length >= MAX_GRUPO || Boolean(motivoGrupoTravado(save));

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="titulo text-2xl text-destaque">Taverna</h1>
        <span className="text-destaque-claro">{save.ouro} ouro</span>
        <span className="text-sm text-texto-2">
          Heróis: {total}/{MAX_HEROIS}
        </span>
      </header>

      <section className="painel p-4" aria-labelledby="titulo-mural">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="titulo-mural" className="titulo text-lg">
            Mural de recrutas
          </h2>
          <span className="text-sm text-texto-2">
            Novos recrutas em {formatarDuracao(tempoAteRenovarMural(save.recrutas, agora))}.
          </span>
        </div>
        <p className="mb-3 text-sm text-texto-2">
          Recrutas chegam {NIVEIS_ABAIXO_DO_GRUPO} níveis abaixo da média do grupo, com equipamento Comum e os pontos do nível para distribuir.{" "}
          {vaiParaReserva ? "Quem for contratado agora vai para a reserva." : "Quem for contratado entra no grupo."} Vencer
          chefes de zona traz novas classes ao mural.
        </p>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {save.recrutas.opcoes.map((opcao, indice) => (
            <CartaoRecruta
              key={indice}
              save={save}
              opcao={opcao}
              indice={indice}
              nivel={nivel}
              custo={custo}
              acoes={acoes}
            />
          ))}
        </ul>
      </section>

      <Cozinha save={save} agora={agora} acoes={acoes} />
    </main>
  );
}
