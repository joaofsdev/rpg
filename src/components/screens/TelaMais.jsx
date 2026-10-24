import { useEstado, useAcoes } from "../../state/contextos";
import Botao from "../common/Botao";

function Atalho({ titulo, descricao, aoAbrir }) {
  return (
    <li>
      <button onClick={aoAbrir} className="painel flex w-full flex-col items-start p-4 text-left hover:border-borda-forte">
        <span className="titulo text-lg text-destaque">{titulo}</span>
        <span className="text-sm text-texto-2">{descricao}</span>
      </button>
    </li>
  );
}

export default function TelaMais() {
  const { config, save } = useEstado();
  const acoes = useAcoes();
  const vistos = Object.values(save.bestiario).filter((e) => e.visto).length;

  return (
    <main className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:pb-6">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Atalho
          titulo="Loja"
          descricao="Equipamentos que mudam todo dia e consumíveis sempre à venda."
          aoAbrir={acoes.abrirLoja}
        />
        <Atalho
          titulo="Bestiário"
          descricao={`${vistos} criaturas registradas. Fraquezas, drops e marcos de derrotas.`}
          aoAbrir={() => acoes.navegar("bestiario")}
        />
      </ul>

      <section className="painel mt-4 p-4" aria-labelledby="titulo-config">
        <h2 id="titulo-config" className="titulo mb-3 text-lg">
          Configurações
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-48 text-texto-2" id="rotulo-vel">
              Velocidade das animações
            </span>
            {[1, 2, 3].map((v) => (
              <button
                key={v}
                aria-describedby="rotulo-vel"
                aria-pressed={config.velocidadeAnimacao === v}
                onClick={() => acoes.alterarConfig({ velocidadeAnimacao: v })}
                className={`botao min-h-8 px-3 ${config.velocidadeAnimacao === v ? "botao-secundario text-destaque" : "botao-discreto"}`}
              >
                {v}×
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.reduzirMovimento}
              onChange={() => acoes.alterarConfig({ reduzirMovimento: !config.reduzirMovimento })}
            />
            <span>Menos movimento (sem tremidas e partículas nas batalhas)</span>
          </label>
        </div>
      </section>

      <div className="mt-6 flex justify-center">
        <Botao variante="discreto" onClick={acoes.fecharSlot}>
          Voltar aos espaços de save
        </Botao>
      </div>
    </main>
  );
}
