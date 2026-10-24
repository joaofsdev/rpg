import { useEstado, useAcoes } from "../../state/contextos";

const ABAS = [
  { tela: "mapa", nome: "Mapa", inclui: ["mapa", "masmorra"] },
  { tela: "grupo", nome: "Grupo" },
  { tela: "inventario", nome: "Inventário" },
  { tela: "mais", nome: "Mais", inclui: ["mais", "loja", "bestiario"] },
];

export default function Navegacao() {
  const { tela, save } = useEstado();
  const acoes = useAcoes();
  const pontosLivres = save.grupo.reduce((soma, id) => soma + save.herois[id].pontosLivres, 0);

  return (
    <nav
      aria-label="Seções do jogo"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-borda bg-superficie sm:static sm:border-t-0 sm:border-b-2"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-2 py-1.5 sm:px-4">
        <span className="titulo hidden text-destaque sm:mr-4 sm:inline">MagiChill</span>
        {ABAS.map((aba) => (
          <button
            key={aba.tela}
            onClick={() => acoes.navegar(aba.tela)}
            aria-current={(aba.inclui ?? [aba.tela]).includes(tela) ? "page" : undefined}
            className={`botao flex-1 sm:flex-none ${(aba.inclui ?? [aba.tela]).includes(tela) ? "botao-secundario text-destaque" : "botao-discreto"}`}
          >
            {aba.nome}
            {aba.tela === "grupo" && pontosLivres > 0 && (
              <span className="rounded bg-destaque px-1.5 text-xs text-[#241a0c]" aria-label={`${pontosLivres} pontos livres`}>
                {pontosLivres}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto hidden text-destaque-claro sm:inline" title="Ouro">
          {save.ouro} ouro
        </span>
      </div>
    </nav>
  );
}
