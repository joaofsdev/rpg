import { useEstado, useAcoes } from "../../state/contextos";
import { itens } from "../../data/itens";
import { golpes } from "../../data/golpes";
import { receitas } from "../../data/receitas";
import { NOMES_SLOT } from "../../data/textos";
import { PONTOS_POR_NIVEL } from "../../data/constants";
import { descreverItens } from "../common/descricoes";
import { classeRaridade } from "../common/cores";
import Botao from "../common/Botao";

const TITULOS = {
  vitoria: "Vitória",
  derrota: "O grupo recuou para a cidade",
  fuga: "O grupo fugiu do encontro",
};

const SUBTITULOS = {
  vitoria: "Recompensas guardadas.",
  derrota: "Ninguém perdeu nada do que já tinha. Descanse, ajuste o grupo e tente de novo.",
  fuga: "O encontro foi deixado para trás. Tudo o que já era seu continua salvo.",
};

function textos(r) {
  const m = r.masmorra;
  if (!m) return { titulo: TITULOS[r.resultado], subtitulo: SUBTITULOS[r.resultado] };
  if (m.tipo === "concluida") {
    return {
      titulo: "Masmorra concluída",
      subtitulo: "O chefe caiu. Tudo foi guardado, inclusive um equipamento Lendário.",
    };
  }
  if (m.tipo === "andar") {
    return {
      titulo: `Andar ${m.andar} concluído`,
      subtitulo: m.fogueira
        ? "Há uma fogueira logo adiante: o grupo descansa e recupera toda a vida."
        : "Recompensas guardadas. Um descanso curto recupera parte da vida antes do próximo andar.",
    };
  }
  return {
    titulo: "O grupo saiu da masmorra",
    subtitulo: "Tudo o que foi ganho nos andares continua guardado. A próxima descida recomeça do andar 1.",
  };
}

export default function TelaResultado() {
  const { resumoBatalha: r, save } = useEstado();
  const acoes = useAcoes();
  if (!r) return null;

  const podeContinuar = r.origem?.tipo === "zona" && !r.origem.chefe && r.resultado !== "derrota";
  const naMasmorra = Boolean(save.masmorraAtual);
  const { titulo, subtitulo } = textos(r);
  const itensGanhos = Object.entries(r.itens);

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-4 py-10">
      <section className="painel p-6" aria-labelledby="titulo-resultado">
        <h1 id="titulo-resultado" className={`titulo text-2xl ${r.resultado === "vitoria" ? "text-destaque" : "text-texto"}`}>
          {titulo}
        </h1>
        <p className="mt-1 text-texto-2">{subtitulo}</p>

        {r.resultado === "vitoria" && (
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between">
              <dt className="text-texto-2">Experiência para cada herói</dt>
              <dd>{r.xp}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-texto-2">Ouro</dt>
              <dd className="text-destaque-claro">{r.ouro}</dd>
            </div>
            {itensGanhos.length > 0 && (
              <div>
                <dt className="text-texto-2">Itens</dt>
                <dd>{itensGanhos.map(([id, qtd]) => `${itens[id].nome} ×${qtd}`).join(", ")}</dd>
              </div>
            )}
            {r.equipamentos.length > 0 && (
              <div>
                <dt className="text-texto-2">Equipamentos</dt>
                <dd>
                  <ul>
                    {r.equipamentos.map((e) => (
                      <li key={e.id}>
                        <span className={classeRaridade(e.raridade)}>{e.nome}</span>{" "}
                        <span className="text-sm text-texto-3">
                          {e.raridade}, {NOMES_SLOT[e.slot].toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {r.equipamentosVendidos.length > 0 && (
              <div className="text-sm text-texto-2">
                Inventário cheio: {r.equipamentosVendidos.length} equipamento(s) vendido(s) por{" "}
                {r.equipamentosVendidos.reduce((s, v) => s + v.valor, 0)} ouro.
              </div>
            )}
            {r.itensVendidos?.length > 0 && (
              <div className="text-sm text-texto-2">
                Pilha cheia: {descreverItens(Object.fromEntries(r.itensVendidos.map((v) => [v.itemId, v.qtd])))} vendido(s)
                por {r.itensVendidos.reduce((s, v) => s + v.valor, 0)} ouro.
              </div>
            )}
          </dl>
        )}

        {r.niveis.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-borda pt-3">
            {r.niveis.map((n) => (
              <li key={n.heroiId}>
                <span className="text-destaque">{save.herois[n.heroiId].nome}</span> chegou ao nível {n.para} e ganhou{" "}
                {(n.para - n.de) * PONTOS_POR_NIVEL} pontos para distribuir.
                {n.golpesNovos?.length > 0 && ` Novo golpe: ${n.golpesNovos.map((g) => golpes[g].nome).join(", ")}.`}
              </li>
            ))}
          </ul>
        )}

        {r.receitaNova && (
          <p className="mt-4 border-t border-borda pt-3">
            O chefe ensinou a receita <span className="text-destaque">{receitas[r.receitaNova].nome}</span>. Prepare na
            cozinha da Taverna.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {podeContinuar && (
            <Botao
              variante="primario"
              onClick={() => {
                acoes.fecharResultado();
                acoes.explorar(r.origem.zonaId);
              }}
            >
              Próximo encontro
            </Botao>
          )}
          {r.niveis.length > 0 && (
            <Botao
              onClick={() => {
                acoes.fecharResultado();
                acoes.navegar("grupo");
              }}
            >
              Distribuir pontos
            </Botao>
          )}
          <Botao variante={podeContinuar ? "discreto" : "primario"} onClick={acoes.fecharResultado}>
            {naMasmorra ? "Continuar na masmorra" : "Voltar ao mapa"}
          </Botao>
        </div>
      </section>
    </main>
  );
}
