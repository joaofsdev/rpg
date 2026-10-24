import GameProvider from "./state/GameProvider";
import { useEstado } from "./state/contextos";
import TelaSlots from "./components/screens/TelaSlots";
import TelaNovoJogo from "./components/screens/TelaNovoJogo";
import TelaMapa from "./components/screens/TelaMapa";
import TelaGrupo from "./components/screens/TelaGrupo";
import TelaInventario from "./components/screens/TelaInventario";
import TelaBatalha from "./components/screens/TelaBatalha";
import TelaResultado from "./components/screens/TelaResultado";
import TelaLoja from "./components/screens/TelaLoja";
import TelaBestiario from "./components/screens/TelaBestiario";
import TelaMais from "./components/screens/TelaMais";
import TelaMasmorra from "./components/screens/TelaMasmorra";
import Navegacao from "./components/common/Navegacao";
import Aviso from "./components/common/Aviso";

const TELAS = {
  slots: TelaSlots,
  novoJogo: TelaNovoJogo,
  mapa: TelaMapa,
  grupo: TelaGrupo,
  inventario: TelaInventario,
  batalha: TelaBatalha,
  resultado: TelaResultado,
  loja: TelaLoja,
  bestiario: TelaBestiario,
  mais: TelaMais,
  masmorra: TelaMasmorra,
};

const TELAS_COM_NAVEGACAO = ["mapa", "grupo", "inventario", "loja", "bestiario", "mais", "masmorra"];

function Roteador() {
  const { tela } = useEstado();
  if (tela === "carregando") {
    return <p className="p-6 text-texto-2">Abrindo o livro de registros…</p>;
  }
  const Tela = TELAS[tela];
  return (
    <>
      {TELAS_COM_NAVEGACAO.includes(tela) && <Navegacao />}
      <Tela />
      <Aviso />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Roteador />
    </GameProvider>
  );
}
