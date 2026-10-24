import { useEstado, useAcoes } from "../../state/contextos";
import { atividadesConcluidas } from "../../engine/coleta";
import { useAgoraDoJogo } from "./tempo";

const ABAS = [
  { tela: "mapa", nome: "Mapa", inclui: ["mapa", "masmorra"] },
  { tela: "grupo", nome: "Grupo" },
  { tela: "atividades", nome: "Atividades", curto: "Ativ." },
  { tela: "taverna", nome: "Taverna" },
  { tela: "inventario", nome: "Inventário", curto: "Itens" },
  { tela: "mais", nome: "Mais", inclui: ["mais", "loja", "bestiario"] },
];

function Selo({ valor, rotulo }) {
  return (
    <span className="rounded bg-destaque px-1.5 text-xs text-[#241a0c]" aria-label={rotulo}>
      {valor}
    </span>
  );
}

export default function Navegacao() {
  const { tela, save } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const pontosLivres = Object.values(save.herois).reduce((soma, h) => soma + h.pontosLivres, 0);
  const prontas = atividadesConcluidas(save, agora).length;
  // A taverna precisa conferir o mural ao abrir (renovação a cada 24 h)
  const abrir = (aba) => (aba === "taverna" ? acoes.abrirTaverna() : acoes.navegar(aba));

  return (
    <nav
      aria-label="Seções do jogo"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-borda bg-superficie sm:static sm:border-t-0 sm:border-b-2"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-0.5 px-1 py-1.5 sm:gap-1 sm:px-4">
        <span className="titulo hidden text-destaque lg:mr-4 lg:inline">MagiChill</span>
        {ABAS.map((aba) => {
          const atual = (aba.inclui ?? [aba.tela]).includes(tela);
          return (
            <button
              key={aba.tela}
              onClick={() => abrir(aba.tela)}
              aria-current={atual ? "page" : undefined}
              className={`botao min-w-0 flex-auto gap-1 px-1 text-[0.7rem] sm:flex-none sm:px-3 sm:text-[0.85rem] ${atual ? "botao-secundario text-destaque" : "botao-discreto"}`}
            >
              {aba.curto ? (
                <>
                  <span className="truncate sm:hidden" aria-hidden="true">{aba.curto}</span>
                  <span className="sr-only sm:not-sr-only">{aba.nome}</span>
                </>
              ) : (
                <span className="truncate">{aba.nome}</span>
              )}
              {aba.tela === "grupo" && pontosLivres > 0 && <Selo valor={pontosLivres} rotulo={`${pontosLivres} pontos livres`} />}
              {aba.tela === "atividades" && prontas > 0 && <Selo valor={prontas} rotulo={`${prontas} atividades prontas`} />}
            </button>
          );
        })}
        <span className="ml-auto hidden text-destaque-claro sm:inline" title="Ouro">
          {save.ouro} ouro
        </span>
      </div>
    </nav>
  );
}
