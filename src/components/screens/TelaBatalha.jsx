import { useCallback, useEffect, useMemo, useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { itensDeBatalha } from "../../state/seletores";
import { buscarZona } from "../../data/zonas";
import { golpes } from "../../data/golpes";
import { cenario } from "../../data/sprites";
import { acoesDisponiveis, alvosParaItem } from "../../engine/combate";
import { useReproducao } from "../battle/useReproducao";
import Combatente from "../battle/Combatente";
import BarraOrdem from "../battle/BarraOrdem";
import MenuAcoes from "../battle/MenuAcoes";
import Previa from "../battle/Previa";
import Botao from "../common/Botao";

const ALVO_UNICO = ["inimigo", "aliado"];

// Parede de pedra com estandartes no alto, chão de lajes embaixo, luz de lampião no centro
function fundoDaArena(escala) {
  const t = 16 * escala;
  const camadas = [
    ["radial-gradient(ellipse at 50% 35%, #f3b65a33, transparent 60%)", "100% 100%", "no-repeat", "0 0"],
    [`url(${cenario.estandarte})`, `${t}px ${t}px`, "no-repeat", `22% ${t}px`],
    [`url(${cenario.estandarte})`, `${t}px ${t}px`, "no-repeat", `78% ${t}px`],
    [`url(${cenario.paredeTopo})`, `${t}px ${t}px`, "repeat-x", "0 0"],
    [`url(${cenario.parede})`, `${t}px ${t}px`, "repeat-x", `0 ${t}px`],
    [`url(${cenario.parede})`, `${t}px ${t}px`, "repeat-x", `0 ${2 * t}px`],
    [`linear-gradient(#1c1814, #1c1814)`, `100% ${t}px`, "no-repeat", "0 0"],
    ["linear-gradient(#1c181480, #1c181480)", "100% 100%", "no-repeat", "0 0"],
    [`url(${cenario.chao})`, `${t}px ${t}px`, "repeat", "0 0"],
  ];
  return {
    backgroundImage: camadas.map((c) => c[0]).join(", "),
    backgroundSize: camadas.map((c) => c[1]).join(", "),
    backgroundRepeat: camadas.map((c) => c[2]).join(", "),
    backgroundPosition: camadas.map((c) => c[3]).join(", "),
    imageRendering: "pixelated",
  };
}

function useEscala() {
  const consulta = "(min-width: 640px)";
  const [grande, setGrande] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const aoMudar = () => setGrande(mq.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);
  return grande ? 3 : 2;
}

export default function TelaBatalha() {
  const { save, batalhaUi, config } = useEstado();
  const acoes = useAcoes();
  const escala = useEscala();

  // A batalha estável mais recente: a do save ou, se acabou, a encerrada
  const atual = save.batalha ?? batalhaUi.encerrada;
  const { exibicao, efeitos, reproduzindo, registro, adiantar } = useReproducao({
    base: batalhaUi.inicial ?? atual,
    final: atual,
    eventos: batalhaUi.eventos,
    velocidade: config.velocidadeAnimacao,
    aoConcluir: acoes.filaConcluida,
  });

  const [aba, setAba] = useState("golpes");
  const [selecao, setSelecao] = useState(null);
  const [alvoFoco, setAlvoFoco] = useState(null);
  const [alvoEscolhido, setAlvoEscolhido] = useState(null);

  const podeAgir = !reproduzindo && atual?.fase === "escolhaAcao" && batalhaUi.eventos.length === 0;
  const opcoes = useMemo(() => (podeAgir ? acoesDisponiveis(atual) : null), [podeAgir, atual]);
  const ativo = podeAgir ? atual.combatentes[atual.ativoId] : null;
  const itens = itensDeBatalha(save);

  const limparSelecao = useCallback(() => {
    setSelecao(null);
    setAlvoEscolhido(null);
    setAlvoFoco(null);
  }, []);

  // Nova vez de agir: começa sem nada selecionado
  useEffect(() => {
    limparSelecao();
  }, [atual?.ativoId, atual?.turnoGlobal, limparSelecao]);

  const alvosValidos = useMemo(() => {
    if (!podeAgir || !selecao) return [];
    if (selecao.tipo === "item") return alvosParaItem(atual, selecao.itemId);
    const opcao = opcoes.golpes.find((g) => g.golpeId === selecao.golpeId);
    return ALVO_UNICO.includes(opcao.tipoAlvo) ? opcao.alvos : [];
  }, [podeAgir, selecao, atual, opcoes]);

  const exigeAlvo = selecao && (selecao.tipo === "item" || ALVO_UNICO.includes(golpes[selecao.golpeId].alvo));

  const executar = useCallback(
    (alvoId) => {
      if (!selecao) return;
      if (selecao.tipo === "item") acoes.agir({ tipo: "item", itemId: selecao.itemId, alvoId });
      else acoes.agir({ tipo: "golpe", golpeId: selecao.golpeId, alvoId });
    },
    [selecao, acoes],
  );

  const escolherAlvo = (alvoId, tipoPonteiro) => {
    if (!alvosValidos.includes(alvoId)) return;
    // Mouse e teclado executam direto; no toque o primeiro toque mostra a prévia
    if (tipoPonteiro === "mouse" || tipoPonteiro === "teclado" || alvoEscolhido === alvoId) executar(alvoId);
    else setAlvoEscolhido(alvoId);
  };

  const escolherGolpe = (golpeId) => {
    setAlvoEscolhido(null);
    setSelecao((s) => (s?.tipo === "golpe" && s.golpeId === golpeId ? null : { tipo: "golpe", golpeId }));
  };

  const escolherItem = (itemId) => {
    setAlvoEscolhido(null);
    setSelecao((s) => (s?.tipo === "item" && s.itemId === itemId ? null : { tipo: "item", itemId }));
  };

  // Atalhos de teclado (SPEC.md §7.3)
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      if (reproduzindo && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        adiantar();
        return;
      }
      if (!podeAgir) return;
      const disponiveis = opcoes.golpes;
      if (/^[1-4]$/.test(e.key)) {
        const opcao = disponiveis.filter((g) => !g.basico)[Number(e.key) - 1];
        if (opcao?.disponivel) {
          setAba("golpes");
          escolherGolpe(opcao.golpeId);
        }
      } else if (e.key.toLowerCase() === "b") {
        const basico = disponiveis.find((g) => g.basico);
        if (basico?.disponivel) escolherGolpe(basico.golpeId);
      } else if (e.key.toLowerCase() === "d") {
        acoes.agir({ tipo: "defender" });
      } else if (e.key === "Escape") {
        limparSelecao();
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && alvosValidos.length > 0) {
        e.preventDefault();
        const i = alvosValidos.indexOf(alvoEscolhido);
        const passo = e.key === "ArrowRight" ? 1 : -1;
        setAlvoEscolhido(alvosValidos[(i + passo + alvosValidos.length) % alvosValidos.length]);
      } else if (e.key === "Enter" && selecao) {
        if (!exigeAlvo) executar(undefined);
        else if (alvoEscolhido) executar(alvoEscolhido);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  if (!atual) return null;
  const zona = buscarZona(atual.origem.zonaId);
  const nomes = Object.fromEntries(Object.values(exibicao.combatentes).map((c) => [c.id, c.nome]));
  const porLado = (lado) =>
    Object.values(exibicao.combatentes)
      .filter((c) => c.lado === lado)
      .sort((a, b) => a.posicao - b.posicao);
  const efeitosDe = (id) => efeitos.filter((e) => e.alvoId === id);
  const alvoDaPrevia = alvoEscolhido ?? alvoFoco;

  return (
    <div className="flex min-h-full flex-col" data-movimento={config.reduzirMovimento ? "reduzido" : undefined}>
      <header className="border-b-2 border-borda bg-superficie">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
          <h1 className="titulo text-destaque">
            {atual.origem.tipo === "masmorra"
              ? `${zona.masmorra.nome}, ${atual.origem.chefe ? "chefe" : `andar ${atual.origem.andar}`}`
              : `${zona.nome}${atual.origem.chefe ? ", chefe" : ""}`}
          </h1>
          <span className="text-sm text-texto-2">Rodada {exibicao.rodada}</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-texto-3" id="rotulo-velocidade">
              Animação
            </span>
            {[1, 2, 3].map((v) => (
              <button
                key={v}
                aria-labelledby="rotulo-velocidade"
                aria-pressed={config.velocidadeAnimacao === v}
                onClick={() => acoes.alterarConfig({ velocidadeAnimacao: v })}
                className={`botao min-h-8 px-2 ${config.velocidadeAnimacao === v ? "botao-secundario text-destaque" : "botao-discreto"}`}
              >
                {v}×
              </button>
            ))}
            <button
              aria-pressed={config.reduzirMovimento}
              onClick={() => acoes.alterarConfig({ reduzirMovimento: !config.reduzirMovimento })}
              className={`botao min-h-8 px-2 ${config.reduzirMovimento ? "botao-secundario text-destaque" : "botao-discreto"}`}
            >
              Menos movimento
            </button>
            <Botao variante="discreto" className="min-h-8" onClick={acoes.sairDaBatalha}>
              Sair
            </Botao>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-3 pb-2">
          <BarraOrdem exibicao={exibicao} />
        </div>
      </header>

      <section
        aria-label="Arena"
        onClick={reproduzindo ? adiantar : undefined}
        className="relative overflow-hidden border-b-2 border-borda"
        style={fundoDaArena(escala)}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
        <div className="relative mx-auto flex max-w-5xl items-end justify-between gap-2 px-2 pt-16 pb-3 sm:px-8 sm:pt-24">
          <div className="flex flex-col-reverse items-start gap-1 sm:flex-row sm:items-end sm:gap-3">
            {porLado("herois").map((c) => (
              <Combatente
                key={c.id}
                c={c}
                efeitos={efeitosDe(c.id)}
                nomes={nomes}
                ativo={exibicao.ativoId === c.id && !c.nocauteado}
                alvoValido={alvosValidos.includes(c.id)}
                alvoEscolhido={alvoEscolhido === c.id}
                velocidade={config.velocidadeAnimacao}
                escala={escala}
                aoEscolher={escolherAlvo}
                aoFocar={setAlvoFoco}
              />
            ))}
          </div>
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-end sm:gap-3">
            {porLado("inimigos").map((c) => (
              <Combatente
                key={c.id}
                c={c}
                efeitos={efeitosDe(c.id)}
                nomes={nomes}
                ativo={exibicao.ativoId === c.id && !c.nocauteado}
                alvoValido={alvosValidos.includes(c.id)}
                alvoEscolhido={alvoEscolhido === c.id}
                velocidade={config.velocidadeAnimacao}
                escala={escala}
                aoEscolher={escolherAlvo}
                aoFocar={setAlvoFoco}
              />
            ))}
          </div>
        </div>
        {reproduzindo && (
          <p className="absolute bottom-1 right-3 text-xs text-texto-2">Clique na arena ou aperte espaço para adiantar</p>
        )}
      </section>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_18rem]">
        <section aria-label="Ações" className="painel p-3">
          {podeAgir && opcoes ? (
            <>
              <h2 className="titulo mb-2 text-sm">
                Vez de <span className="text-destaque">{ativo.nome}</span>
              </h2>
              <MenuAcoes
                opcoes={opcoes}
                itens={itens}
                aba={aba}
                aoTrocarAba={setAba}
                selecao={selecao}
                bloqueado={!podeAgir}
                aoEscolherGolpe={escolherGolpe}
                aoEscolherItem={escolherItem}
                aoDefender={() => acoes.agir({ tipo: "defender" })}
                aoFugir={() => acoes.agir({ tipo: "fugir" })}
                recursoAtivo={ativo.recurso?.tipo}
                naMasmorra={atual.origem.tipo === "masmorra"}
              />
              {selecao && (
                <div className="mt-3 border-t border-borda pt-2">
                  <Previa batalha={atual} selecao={selecao} alvoId={alvoDaPrevia} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(!exigeAlvo || alvoEscolhido) && (
                      <Botao variante="primario" onClick={() => executar(alvoEscolhido ?? undefined)}>
                        Confirmar
                      </Botao>
                    )}
                    <Botao variante="discreto" onClick={limparSelecao}>
                      Cancelar
                    </Botao>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-texto-2" aria-live="polite">
              {atual.fase === "fim" ? "A batalha terminou." : "Resolvendo a rodada…"}
            </p>
          )}
        </section>

        <section aria-label="Registro da batalha" className="painel p-3">
          <h2 className="titulo mb-1 text-sm text-texto-2">Registro</h2>
          <ol className="space-y-0.5 text-sm text-texto-2" aria-live="polite">
            {registro.map((linha, i) => (
              <li key={`${registro.length}-${i}`} className={i === registro.length - 1 ? "text-texto" : ""}>
                {linha}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
