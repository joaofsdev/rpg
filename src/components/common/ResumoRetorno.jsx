import { useEstado, useAcoes } from "../../state/contextos";
import { resumoDoRetorno, previaDoGanho } from "../../engine/coleta";
import Modal from "./Modal";
import Botao from "./Botao";
import { CATEGORIAS_ATIVIDADE, descreverAtividade, descreverGanho } from "./descricoes";
import { formatarDuracao, useAgoraDoJogo } from "./tempo";

// Modal "Bem-vindo de volta" (SPEC.md §3.9): o que ficou pronto, por categoria, e o que ainda falta
export default function ResumoRetorno() {
  const { save, retorno } = useEstado();
  const acoes = useAcoes();
  const agora = useAgoraDoJogo(save);
  const { concluidas, emAndamento } = resumoDoRetorno(save, agora);
  const nome = (heroiId) => save.herois[heroiId]?.nome ?? "Herói";

  return (
    <Modal
      titulo="Bem-vindo de volta"
      aoFechar={acoes.fecharRetorno}
      acoes={
        <>
          <Botao variante="discreto" onClick={acoes.fecharRetorno}>
            Depois
          </Botao>
          <Botao variante="primario" disabled={concluidas.length === 0} onClick={acoes.coletarTudo}>
            Coletar tudo
          </Botao>
        </>
      }
    >
      <p className="mb-3">Você ficou fora por {formatarDuracao(retorno.tempoFora)}.</p>

      {CATEGORIAS_ATIVIDADE.map((categoria) => {
        const prontas = concluidas.filter((a) => categoria.tipos.includes(a.tipo));
        if (prontas.length === 0) return null;
        return (
          <section key={categoria.id} aria-labelledby={`retorno-${categoria.id}`} className="mb-3">
            <h3 id={`retorno-${categoria.id}`} className="titulo mb-1 text-sm text-texto">
              {categoria.nome}: pronto para coletar
            </h3>
            <ul className="space-y-1 text-sm">
              {prontas.map((a) => (
                <li key={a.id}>
                  <span className="text-texto">{nome(a.heroiId)}</span>, {descreverAtividade(a)}.{" "}
                  <span className="text-sucesso">{descreverGanho(previaDoGanho(save, a, agora))}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {emAndamento.length > 0 && (
        <section aria-labelledby="retorno-andamento">
          <h3 id="retorno-andamento" className="titulo mb-1 text-sm text-texto">
            Em andamento
          </h3>
          <ul className="space-y-1 text-sm">
            {emAndamento.map(({ atividade, restante }) => (
              <li key={atividade.id}>
                <span className="text-texto">{nome(atividade.heroiId)}</span>, {descreverAtividade(atividade)}: faltam{" "}
                {formatarDuracao(restante)}.
              </li>
            ))}
          </ul>
        </section>
      )}
    </Modal>
  );
}
