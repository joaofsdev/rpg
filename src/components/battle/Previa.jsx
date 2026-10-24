import { golpes } from "../../data/golpes";
import { itens } from "../../data/itens";
import { status as dadosStatus } from "../../data/status";
import { NOMES_ELEMENTO, NOMES_ATRIBUTO } from "../../data/textos";
import { preverAcao } from "../../engine/combate";

const TEXTO_AFINIDADE = {
  fraco: "fraco a",
  resiste: "resiste a",
  imune: "imune a",
  neutro: "neutro a",
};

function linhaDano(p, nome) {
  const vezes = p.acertos > 1 ? ` (×${p.acertos})` : "";
  const afinidade =
    p.afinidade === "desconhecida"
      ? `reação a ${NOMES_ELEMENTO[p.elemento]} desconhecida`
      : `${TEXTO_AFINIDADE[p.afinidade]} ${NOMES_ELEMENTO[p.elemento]}`;
  return `${nome}: ${p.danoMin}–${p.danoMax} de dano${vezes}, ${Math.round(p.chanceAcerto)}% de acerto, ${afinidade}`;
}

function efeitosDeSuporte(golpe) {
  return (golpe.efeitos || [])
    .map((e) => {
      if (e.tipo === "status") return `${dadosStatus[e.statusId].nome} por ${e.turnos ?? dadosStatus[e.statusId].turnos} turnos`;
      if (e.tipo === "modificador") return `${NOMES_ATRIBUTO[e.atributo]} +${e.valor} por ${e.turnos} turnos`;
      return null;
    })
    .filter(Boolean);
}

// Prévia do que a ação vai fazer, sem sortear nada
export default function Previa({ batalha, selecao, alvoId }) {
  if (!selecao) return null;
  const nome = (id) => batalha.combatentes[id]?.nome;

  if (selecao.tipo === "item") {
    const item = itens[selecao.itemId];
    return (
      <p className="text-sm text-texto-2">
        {item.nome}: {item.descricao}
        {alvoId ? ` Alvo: ${nome(alvoId)}.` : " Escolha quem vai receber."}
      </p>
    );
  }

  const golpe = golpes[selecao.golpeId];
  const unico = golpe.alvo === "inimigo" || golpe.alvo === "aliado";
  if (unico && !alvoId) {
    return <p className="text-sm text-texto-2">Escolha o alvo de {golpe.nome}.</p>;
  }

  const previas = preverAcao(batalha, { tipo: "golpe", golpeId: golpe.id, alvoId });
  const extras = efeitosDeSuporte(golpe);
  return (
    <ul className="space-y-0.5 text-sm text-texto-2">
      {previas.map((p) =>
        p.tipo === "dano" ? (
          <li key={p.alvoId}>{linhaDano(p, nome(p.alvoId))}</li>
        ) : (
          <li key={p.alvoId}>
            {nome(p.alvoId)}
            {p.cura !== null ? `: recupera até ${p.cura} de vida` : ""}
          </li>
        ),
      )}
      {extras.length > 0 && <li>Efeito: {extras.join(", ")}</li>}
    </ul>
  );
}
