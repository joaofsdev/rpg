import { golpes } from "../../data/golpes";
import { iconesItens } from "../../data/sprites";
import { NOMES_ELEMENTO, DESCRICAO_ALVO, CORES_ELEMENTO } from "../../data/textos";
import { corRecurso } from "../common/cores";
import Botao from "../common/Botao";

const ABAS = [
  { id: "golpes", nome: "Golpes" },
  { id: "itens", nome: "Itens" },
  { id: "outros", nome: "Defender ou fugir" },
];

function CartaoGolpe({ opcao, atalho, selecionado, bloqueado, aoEscolher }) {
  const golpe = golpes[opcao.golpeId];
  const elemento = golpe.elemento && golpe.elemento !== "arma" ? golpe.elemento : null;
  return (
    <button
      type="button"
      disabled={bloqueado || !opcao.disponivel}
      aria-pressed={selecionado}
      onClick={() => aoEscolher(opcao.golpeId)}
      className={`painel flex min-h-20 flex-col items-start gap-0.5 p-2 text-left transition-colors disabled:cursor-not-allowed ${
        selecionado ? "border-destaque" : "hover:border-borda-forte"
      } ${!opcao.disponivel ? "opacity-60" : ""}`}
    >
      <span className="flex w-full items-baseline justify-between gap-2">
        <span className="titulo text-sm">
          <span className="mr-1 text-texto-3">{atalho}</span>
          {golpe.nome}
        </span>
        <span
          className="shrink-0 text-sm"
          style={{ color: opcao.disponivel || opcao.custo === 0 ? corRecurso(opcao.recurso) : "var(--color-perigo)" }}
        >
          {opcao.custo > 0 ? `${opcao.custo} ${opcao.recurso}` : "grátis"}
        </span>
      </span>
      <span className="text-xs text-texto-2">
        {elemento && (
          <span style={{ color: CORES_ELEMENTO[elemento] }}>{NOMES_ELEMENTO[elemento]} </span>
        )}
        {golpe.poder ? `poder ${golpe.poder}${golpe.acertos > 1 ? ` ×${golpe.acertos}` : ""}, ` : ""}
        {DESCRICAO_ALVO[golpe.alvo]}
      </span>
      <span className="text-xs text-texto-3">{opcao.motivo ?? golpe.descricao}</span>
    </button>
  );
}

export default function MenuAcoes({
  opcoes,
  itens,
  aba,
  aoTrocarAba,
  selecao,
  bloqueado,
  aoEscolherGolpe,
  aoEscolherItem,
  aoDefender,
  aoFugir,
  recursoAtivo,
  naMasmorra = false,
}) {
  return (
    <div>
      <div role="tablist" aria-label="Tipo de ação" className="mb-2 flex gap-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => aoTrocarAba(a.id)}
            className={`botao min-h-8 px-3 ${aba === a.id ? "botao-secundario text-destaque" : "botao-discreto"}`}
          >
            {a.nome}
          </button>
        ))}
      </div>

      {aba === "golpes" && (
        <div role="tabpanel" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {opcoes.golpes.map((opcao, i) => (
            <CartaoGolpe
              key={opcao.golpeId}
              opcao={opcao}
              atalho={opcao.basico ? "B" : i + 1}
              selecionado={selecao?.tipo === "golpe" && selecao.golpeId === opcao.golpeId}
              bloqueado={bloqueado}
              aoEscolher={aoEscolherGolpe}
            />
          ))}
        </div>
      )}

      {aba === "itens" && (
        <div role="tabpanel">
          {itens.length === 0 && <p className="text-sm text-texto-2">Nenhum item usável em batalha na mochila.</p>}
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {itens.map(({ item, quantidade }) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={bloqueado}
                  aria-pressed={selecao?.tipo === "item" && selecao.itemId === item.id}
                  onClick={() => aoEscolherItem(item.id)}
                  className={`painel flex w-full items-center gap-2 p-2 text-left ${
                    selecao?.itemId === item.id ? "border-destaque" : "hover:border-borda-forte"
                  }`}
                >
                  {iconesItens[item.id] && (
                    <img src={iconesItens[item.id]} alt="" className="h-8 w-8" style={{ imageRendering: "pixelated" }} />
                  )}
                  <span className="flex-1">
                    <span className="titulo block text-sm">
                      {item.nome} <span className="text-texto-2">×{quantidade}</span>
                    </span>
                    <span className="text-xs text-texto-2">{item.descricao}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aba === "outros" && (
        <div role="tabpanel" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="painel p-2">
            <Botao variante="secundario" className="w-full" disabled={bloqueado} onClick={aoDefender}>
              Defender (D)
            </Botao>
            <p className="mt-1 text-xs text-texto-2">
              Recebe metade do dano até o próximo turno e recupera {recursoAtivo === "mana" ? "mana" : "vigor"}.
            </p>
          </div>
          <div className="painel p-2">
            <Botao variante="secundario" className="w-full" disabled={bloqueado || !opcoes.fugir.disponivel} onClick={aoFugir}>
              {naMasmorra ? "Sair da masmorra" : "Fugir"}
            </Botao>
            <p className="mt-1 text-xs text-texto-2">
              {opcoes.fugir.motivo ??
                (naMasmorra
                  ? "Sai da masmorra levando o que os andares anteriores deram. A próxima descida recomeça do andar 1."
                  : "Sai do encontro sem as recompensas dele. O que já foi ganho continua salvo.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
