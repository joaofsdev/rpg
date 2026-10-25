import { useEstado, useAcoes } from "../../state/contextos";
import Botao from "../common/Botao";
import { temas } from "../../data/temas";
import { progressoDaColecao } from "../../engine/colecao";

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
  const colecao = progressoDaColecao(save);

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
        <Atalho
          titulo="Ferraria"
          descricao="Forje equipamentos com materiais das zonas e aprimore até +5, sem falhar."
          aoAbrir={() => acoes.navegar("ferraria")}
        />
        <Atalho
          titulo="Coleção"
          descricao={`${colecao.total.percentual}% concluída. Equipamentos, itens e ${colecao.reliquias.obtidos}/${colecao.reliquias.total} relíquias.`}
          aoAbrir={() => acoes.navegar("colecao")}
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-48 text-texto-2" id="rotulo-tema">
              Tema de cor
            </span>
            {Object.values(temas).map((t) => (
              <button
                key={t.id}
                aria-describedby="rotulo-tema"
                aria-pressed={config.tema === t.id}
                onClick={() => acoes.alterarConfig({ tema: t.id })}
                className={`botao min-h-8 gap-2 px-3 ${config.tema === t.id ? "botao-secundario text-destaque" : "botao-discreto"}`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 rounded-sm border border-borda-forte"
                  style={{ background: `linear-gradient(135deg, ${t.cores.fundo} 50%, ${t.cores.destaque} 50%)` }}
                />
                {t.nome}
              </button>
            ))}
          </div>
          {[
            ["volumeEfeitos", "Volume dos efeitos"],
            ["volumeMusica", "Volume da música"],
          ].map(([chave, rotulo]) => (
            <label key={chave} className="flex flex-wrap items-center gap-2">
              <span className="w-48 text-texto-2">{rotulo}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={Math.round(config[chave] * 100)}
                onChange={(e) => acoes.alterarConfig({ [chave]: Number(e.target.value) / 100 })}
                className="w-40 accent-[var(--color-destaque)]"
              />
              <span className="w-12 text-sm">{config[chave] > 0 ? `${Math.round(config[chave] * 100)}%` : "mudo"}</span>
            </label>
          ))}
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
