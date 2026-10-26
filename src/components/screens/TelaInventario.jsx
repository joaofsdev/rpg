import { useEffect, useRef, useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import {
  FILTROS_PADRAO,
  alterarFiltro,
  filtrosAlterados,
  listarEquipamentos,
  heroiParaComparar,
} from "../../state/seletoresInventario";
import { inventarioLembrado, lembrarInventario } from "../../state/memoriaInventario";
import { MAX_EQUIPAMENTOS_INVENTARIO, ESPACOS_AVISO_INVENTARIO } from "../../data/constants";
import { precoVenda } from "../../engine/itens";
import { equipamentosLivres } from "../../engine/inventario";
import { nomeDoEquipamento } from "../common/descricoes";
import Botao from "../common/Botao";
import FiltrosEquipamentos from "../inventario/FiltrosEquipamentos";
import ListaEquipamentos from "../inventario/ListaEquipamentos";
import DetalheEquipamento from "../inventario/DetalheEquipamento";
import AbaItens from "../inventario/AbaItens";

const ABAS = ["equipamentos", "itens"];

// A partir desta largura a lista e os detalhes ficam lado a lado (o "md" do Tailwind)
const MEDIA_TELA_LARGA = "(min-width: 48rem)";

function telaLarga() {
  return window.matchMedia?.(MEDIA_TELA_LARGA).matches ?? true;
}

function Espacos({ livres, emUso }) {
  const restantes = MAX_EQUIPAMENTOS_INVENTARIO - livres;
  return (
    <p className="text-sm text-texto-2">
      Espaços ocupados: <span className="text-texto">{livres}</span> de {MAX_EQUIPAMENTOS_INVENTARIO}
      {emUso > 0 && ` · ${emUso} em uso pelos heróis (não ocupam espaço)`}
      {restantes < 0 && (
        // Save antigo acima do limite: nada é descartado; só não dá para guardar mais nada
        <span className="block text-vigor">
          Acima do limite: venda ou equipe {-restantes} {restantes === -1 ? "equipamento" : "equipamentos"} para voltar aos{" "}
          {MAX_EQUIPAMENTOS_INVENTARIO}. Até lá, não dá para tirar itens dos heróis e os novos são vendidos na hora.
        </span>
      )}
      {restantes >= 0 && restantes <= ESPACOS_AVISO_INVENTARIO && (
        <span className="block text-vigor">
          {restantes === 0 ? "Inventário cheio" : `Quase cheio (${restantes} livres)`}: o que não couber será vendido na hora.
        </span>
      )}
    </p>
  );
}

export default function TelaInventario() {
  const { save, slotAtivo } = useEstado();
  const acoes = useAcoes();
  // Sair e voltar ao inventário na mesma sessão mantém busca, filtros, ordem e escolhas
  const [lembrado] = useState(() => inventarioLembrado(slotAtivo, save));
  const [aba, setAba] = useState(lembrado.aba);
  const [filtros, setFiltros] = useState(lembrado.filtros);
  const [ordem, setOrdem] = useState(lembrado.ordem);
  const [selecionadoId, setSelecionadoId] = useState(lembrado.selecionadoId);
  const [heroiEscolhido, setHeroiEscolhido] = useState(lembrado.heroiEscolhido);
  // Celular: os detalhes ocupam a tela no lugar da lista
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [foco, setFoco] = useState(null); // { alvo: "titulo" | itemId, rolagem? }
  const listaRef = useRef(null);
  const tituloRef = useRef(null);
  const rolagemDaLista = useRef(0);

  const { entradas, total } = listarEquipamentos(save, filtros, ordem);
  // O item escolhido continua à vista depois de uma ação, mesmo que saia do filtro
  const selecionado = save.inventario.equipamentos[selecionadoId] ?? entradas[0]?.item ?? null;
  const heroiId =
    selecionado &&
    (heroiEscolhido && save.herois[heroiEscolhido] ? heroiEscolhido : heroiParaComparar(save, selecionado, filtros.heroiId));
  const livres = equipamentosLivres(save).length;
  const alterados = filtrosAlterados(filtros);

  useEffect(() => {
    lembrarInventario(slotAtivo, save, { aba, filtros, ordem, heroiEscolhido, selecionadoId });
  }, [slotAtivo, save, aba, filtros, ordem, heroiEscolhido, selecionadoId]);

  // Foco e rolagem ao abrir e fechar os detalhes no celular e depois de vender
  useEffect(() => {
    if (!foco) return;
    if (foco.alvo === "titulo") {
      window.scrollTo(0, 0);
      tituloRef.current?.focus({ preventScroll: true });
    } else {
      if (foco.rolagem !== undefined) window.scrollTo(0, foco.rolagem);
      listaRef.current
        ?.querySelector(`[data-item-id="${foco.alvo}"]`)
        ?.focus({ preventScroll: foco.rolagem !== undefined });
    }
    setFoco(null);
  }, [foco]);

  const mudarFiltro = (campo, valor) => {
    setFiltros((f) => alterarFiltro(f, campo, valor));
    setSelecionadoId(null);
    setMensagem("");
    if (campo === "heroiId") setHeroiEscolhido(null);
  };
  const limparFiltros = () => {
    setFiltros(FILTROS_PADRAO);
    setSelecionadoId(null);
    setMensagem("");
  };

  const escolher = (id, { abrir }) => {
    setSelecionadoId(id);
    setMensagem("");
    if (abrir && !telaLarga()) {
      rolagemDaLista.current = window.scrollY;
      setDetalheAberto(true);
      setFoco({ alvo: "titulo" });
    }
  };
  const voltar = () => {
    if (!detalheAberto) return;
    setDetalheAberto(false);
    if (selecionado) setFoco({ alvo: selecionado.id, rolagem: rolagemDaLista.current });
  };

  const equipar = (heroi, item) => {
    acoes.equipar(heroi.id, item.id);
    setMensagem(`${heroi.nome} agora usa ${nomeDoEquipamento(item)}.`);
  };
  const tirar = (dono, item) => {
    acoes.desequipar(dono.id, item.slot);
    setMensagem(`${nomeDoEquipamento(item)} saiu de ${dono.nome} e voltou ao inventário.`);
  };
  // Depois de vender, a seleção passa para o vizinho na lista (vender vários fica rápido)
  const vender = (item) => {
    const indice = entradas.findIndex((e) => e.item.id === item.id);
    const vizinho = entradas[indice + 1] ?? entradas[indice - 1] ?? null;
    acoes.venderEquipamento(item.id);
    setMensagem(`Vendido: ${nomeDoEquipamento(item)} por ${precoVenda(item)} ouro.`);
    setSelecionadoId(vizinho?.item.id ?? null);
    if (vizinho) setFoco({ alvo: vizinho.item.id, rolagem: detalheAberto ? rolagemDaLista.current : undefined });
    setDetalheAberto(false);
  };

  const aoTeclarAbas = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const proxima = ABAS[(ABAS.indexOf(aba) + (e.key === "ArrowRight" ? 1 : ABAS.length - 1)) % ABAS.length];
    setAba(proxima);
    document.getElementById(`aba-${proxima}`)?.focus();
  };

  const classeAba = (id) => `botao ${aba === id ? "botao-secundario text-destaque" : "botao-discreto"}`;
  const naLista = detalheAberto ? "hidden md:block" : "";

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:pb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Inventário" className="flex gap-1" onKeyDown={aoTeclarAbas}>
          <button
            id="aba-equipamentos"
            role="tab"
            aria-selected={aba === "equipamentos"}
            aria-controls="painel-equipamentos"
            tabIndex={aba === "equipamentos" ? 0 : -1}
            onClick={() => setAba("equipamentos")}
            className={classeAba("equipamentos")}
          >
            Equipamentos
            <span className="font-normal text-texto-2">
              {livres}/{MAX_EQUIPAMENTOS_INVENTARIO}
            </span>
          </button>
          <button
            id="aba-itens"
            role="tab"
            aria-selected={aba === "itens"}
            aria-controls="painel-itens"
            tabIndex={aba === "itens" ? 0 : -1}
            onClick={() => setAba("itens")}
            className={classeAba("itens")}
          >
            Itens
          </button>
        </div>
        <span className="ml-auto text-destaque-claro">{save.ouro} ouro</span>
      </div>

      {aba === "equipamentos" && (
        <div role="tabpanel" id="painel-equipamentos" aria-labelledby="aba-equipamentos" className="space-y-3">
          <Espacos livres={livres} emUso={total - livres} />

          {total === 0 ? (
            <section className="painel space-y-3 p-5" aria-labelledby="titulo-vazio">
              <h2 id="titulo-vazio" className="titulo text-lg">
                Nenhum equipamento ainda
              </h2>
              <p className="text-texto-2">Equipamentos caem dos inimigos, saem da Ferraria e ficam à venda na Loja.</p>
              <div className="flex flex-wrap gap-2">
                <Botao variante="primario" onClick={() => acoes.navegar("mapa")}>
                  Explorar o mapa
                </Botao>
                <Botao onClick={() => acoes.navegar("loja")}>Ir à Loja</Botao>
              </div>
            </section>
          ) : (
            <>
              <div className={naLista}>
                <FiltrosEquipamentos
                  save={save}
                  filtros={filtros}
                  ordem={ordem}
                  aoMudar={mudarFiltro}
                  aoOrdenar={setOrdem}
                />
              </div>

              <p role="status" className={mensagem ? "rounded border border-sucesso/50 px-3 py-1.5 text-sm" : "sr-only"}>
                {mensagem && <span aria-hidden="true" className="text-sucesso">✓ </span>}
                {mensagem}
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_22rem]">
                <div className={naLista}>
                  <div className="mb-2 flex min-h-10 flex-wrap items-center gap-x-3">
                    <p aria-live="polite" className="text-sm text-texto-2">
                      {entradas.length === total ? `${total} equipamentos` : `${entradas.length} de ${total} equipamentos`}
                    </p>
                    {alterados.length > 0 && (
                      <Botao variante="discreto" className="px-2" onClick={limparFiltros}>
                        Limpar filtros
                      </Botao>
                    )}
                  </div>
                  {entradas.length > 0 ? (
                    <ListaEquipamentos
                      entradas={entradas}
                      selecionadoId={selecionado?.id}
                      aoEscolher={escolher}
                      listaRef={listaRef}
                    />
                  ) : (
                    <div className="painel space-y-2 p-4">
                      <p className="font-semibold">Nenhum equipamento com esses filtros.</p>
                      <p className="text-sm text-texto-2">Tente outro nome ou tire algum filtro.</p>
                      <Botao onClick={limparFiltros}>Limpar filtros</Botao>
                    </div>
                  )}
                  <p id="dica-lista" className="sr-only">
                    Use as setas para cima e para baixo para percorrer a lista.
                  </p>
                </div>

                <div className={detalheAberto ? "" : "hidden md:block"}>
                  {selecionado ? (
                    <DetalheEquipamento
                      key={selecionado.id}
                      save={save}
                      item={selecionado}
                      heroiId={heroiId}
                      aoEscolherHeroi={setHeroiEscolhido}
                      aoEquipar={equipar}
                      aoTirar={tirar}
                      aoVender={vender}
                      aoVoltar={voltar}
                      tituloRef={tituloRef}
                    />
                  ) : (
                    <p className="painel p-4 text-texto-2">Escolha um equipamento da lista para ver os detalhes.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {aba === "itens" && (
        <div role="tabpanel" id="painel-itens" aria-labelledby="aba-itens">
          <AbaItens save={save} />
        </div>
      )}
    </main>
  );
}
