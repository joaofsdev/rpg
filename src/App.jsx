import { Suspense, lazy, useEffect } from "react";
import GameProvider from "./state/GameProvider";
import { useEstado } from "./state/contextos";
import { useAutoBatalha } from "./state/useAutoBatalha";
import TelaSlots from "./components/screens/TelaSlots";
import TelaMapa from "./components/screens/TelaMapa";
import Navegacao from "./components/common/Navegacao";
import Aviso from "./components/common/Aviso";
import ResumoRetorno from "./components/common/ResumoRetorno";
import TrilhaSonora from "./components/common/TrilhaSonora";
import { usePaginaOculta } from "./components/common/usePaginaOculta";

// Divisão por telas: a de slots e o mapa (as primeiras que aparecem) vão no pacote principal; as
// outras viram arquivos separados, baixados logo depois da primeira tela (precarregarTelas) para
// que a navegação não espere a rede.
const CARREGAR_TELA = {
  novoJogo: () => import("./components/screens/TelaNovoJogo"),
  grupo: () => import("./components/screens/TelaGrupo"),
  inventario: () => import("./components/screens/TelaInventario"),
  batalha: () => import("./components/screens/TelaBatalha"),
  resultado: () => import("./components/screens/TelaResultado"),
  loja: () => import("./components/screens/TelaLoja"),
  bestiario: () => import("./components/screens/TelaBestiario"),
  mais: () => import("./components/screens/TelaMais"),
  masmorra: () => import("./components/screens/TelaMasmorra"),
  atividades: () => import("./components/screens/TelaAtividades"),
  taverna: () => import("./components/screens/TelaTaverna"),
  ferraria: () => import("./components/screens/TelaFerraria"),
  colecao: () => import("./components/screens/TelaColecao"),
};

const TELAS = {
  slots: TelaSlots,
  mapa: TelaMapa,
  ...Object.fromEntries(Object.entries(CARREGAR_TELA).map(([tela, carregar]) => [tela, lazy(carregar)])),
};

function precarregarTelas() {
  for (const carregar of Object.values(CARREGAR_TELA)) carregar();
}

// Telas por onde o Auto passa a cada encontro (SPEC.md §3.13)
const TELAS_DO_AUTO = ["batalha", "resultado", "masmorra"];

const TELAS_COM_NAVEGACAO = ["mapa", "grupo", "atividades", "taverna", "inventario", "loja", "bestiario", "mais", "masmorra", "ferraria", "colecao"];

function Roteador() {
  const { tela, retorno, auto } = useEstado();
  const oculta = usePaginaOculta();
  useAutoBatalha();
  if (tela === "carregando") {
    return <p className="p-6 text-texto-2">Abrindo o livro de registros…</p>;
  }
  const Tela = TELAS[tela];
  const comNavegacao = TELAS_COM_NAVEGACAO.includes(tela);
  // Auto com a página oculta: o jogo segue no estado, mas as telas não são montadas a cada encontro.
  // Sem quadros na tela, o navegador só libera os elementos removidos quando volta a desenhar, e a
  // memória cresceria durante horas em segundo plano.
  if (oculta && auto.estado === "ativo" && TELAS_DO_AUTO.includes(tela)) {
    return <p className="p-6 text-texto-2">O Auto continua jogando em segundo plano.</p>;
  }
  return (
    <>
      {comNavegacao && <Navegacao />}
      <Suspense fallback={null}>
        <Tela />
      </Suspense>
      {/* Fora da batalha e dos resultados, para não interromper uma animação */}
      {comNavegacao && retorno && <ResumoRetorno />}
      <Aviso />
    </>
  );
}

export default function App() {
  useEffect(precarregarTelas, []);
  return (
    <GameProvider>
      <TrilhaSonora />
      <Roteador />
    </GameProvider>
  );
}
