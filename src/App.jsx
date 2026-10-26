import { Suspense, lazy, useEffect } from "react";
import GameProvider from "./state/GameProvider";
import { useEstado } from "./state/contextos";
import TelaSlots from "./components/screens/TelaSlots";
import TelaMapa from "./components/screens/TelaMapa";
import Navegacao from "./components/common/Navegacao";
import Aviso from "./components/common/Aviso";
import ResumoRetorno from "./components/common/ResumoRetorno";
import TrilhaSonora from "./components/common/TrilhaSonora";

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

const TELAS_COM_NAVEGACAO = ["mapa", "grupo", "atividades", "taverna", "inventario", "loja", "bestiario", "mais", "masmorra", "ferraria", "colecao"];

function Roteador() {
  const { tela, retorno } = useEstado();
  if (tela === "carregando") {
    return <p className="p-6 text-texto-2">Abrindo o livro de registros…</p>;
  }
  const Tela = TELAS[tela];
  const comNavegacao = TELAS_COM_NAVEGACAO.includes(tela);
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
