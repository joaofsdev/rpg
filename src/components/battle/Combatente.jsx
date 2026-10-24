import { golpes } from "../../data/golpes";
import { status as dadosStatus } from "../../data/status";
import { spriteDoCombatente } from "../../data/sprites";
import { CORES_ELEMENTO, NOMES_ATRIBUTO } from "../../data/textos";
import BarraValor from "../common/BarraValor";
import { corDaVida, corRecurso } from "../common/cores";
import Sprite from "./Sprite";

const POSITIVOS = ["protecao", "evasao", "regeneracao", "provocacao"];

const COR_NUMERO = {
  dano: "#f3ead8",
  critico: "#ffd36b",
  fraco: "#ff9a5a",
  cura: "#9be08a",
  status: "#d9c4ff",
  errou: "#b5a68e",
  afinidade: "#ffb36b",
};

function rotuloStatus(s) {
  if (s.statusId === "modificador") {
    return `${NOMES_ATRIBUTO[s.atributo]} ${s.valor > 0 ? "+" : ""}${s.valor}`;
  }
  return dadosStatus[s.statusId].nome;
}

function positivo(s) {
  return s.statusId === "modificador" ? s.valor > 0 : POSITIVOS.includes(s.statusId);
}

function Particulas({ efeito, velocidade }) {
  const cor = CORES_ELEMENTO[efeito.elemento] || "#f3ead8";
  return Array.from({ length: 6 }, (_, i) => {
    const angulo = (i / 6) * Math.PI * 2 + 0.4;
    return (
      <span
        key={i}
        className="particula"
        style={{
          "--cor": cor,
          "--dx": `${Math.cos(angulo) * 26}px`,
          "--dy": `${Math.sin(angulo) * 22}px`,
          "--duracao": `${420 / velocidade}ms`,
        }}
      />
    );
  });
}

function Intencao({ intencao, nomes }) {
  if (!intencao) return <div className="h-10" />;
  const golpe = golpes[intencao.golpeId];
  const alvos = intencao.alvos.map((id) => nomes[id]).filter(Boolean);
  const paraQuem = alvos.length > 1 ? "todo o grupo" : alvos[0];
  return (
    <div className="mx-auto flex h-10 max-w-full items-end">
      <span
        className={`rounded bg-black/60 px-1.5 text-center text-xs leading-4 ${intencao.telegrafado ? "text-[#f08b7e]" : "text-texto"}`}
        title="Próxima ação deste inimigo"
      >
        {intencao.telegrafado ? "Preparando " : ""}
        {golpe.nome}
        {paraQuem && golpe.alvo !== "proprio" ? ` em ${paraQuem}` : ""}
      </span>
    </div>
  );
}

export default function Combatente({
  c,
  efeitos,
  nomes,
  ativo,
  alvoValido,
  alvoEscolhido,
  velocidade,
  escala,
  aoEscolher,
  aoFocar,
}) {
  const sprite = spriteDoCombatente(c);
  const animacoes = efeitos.filter((e) => e.tipo === "animacao");
  const ultima = animacoes[animacoes.length - 1];
  const numeros = efeitos.filter((e) => e.tipo === "numero");
  const particulas = efeitos.filter((e) => e.tipo === "particulas");

  const rotulo = `${c.nome}, nível ${c.nivel}, vida ${c.hpAtual} de ${c.hpMax}${c.nocauteado ? ", caído" : ""}`;

  return (
    <div
      className={`relative flex w-28 flex-col items-center sm:w-36 ${alvoValido ? "alvo-valido" : ""} ${alvoEscolhido ? "alvo-escolhido" : ""}`}
      onPointerUp={alvoValido ? (e) => aoEscolher(c.id, e.pointerType) : undefined}
      onPointerEnter={alvoValido ? () => aoFocar(c.id) : undefined}
      onPointerLeave={alvoValido ? () => aoFocar(null) : undefined}
      role={alvoValido ? "button" : undefined}
      tabIndex={alvoValido ? 0 : undefined}
      aria-label={alvoValido ? `Escolher ${c.nome} como alvo` : undefined}
      onKeyDown={alvoValido ? (e) => e.key === "Enter" && aoEscolher(c.id, "teclado") : undefined}
    >
      {c.lado === "inimigos" ? <Intencao intencao={c.intencao} nomes={nomes} /> : <div className="h-10" />}

      <div className="relative flex h-28 items-end justify-center sm:h-32">
        {ativo && (
          <span aria-hidden="true" className="absolute -top-1 text-destaque">
            ▼
          </span>
        )}
        <Sprite
          sprite={sprite}
          animacao={ultima?.animacao ?? "idle"}
          chave={ultima?.id}
          caido={c.nocauteado}
          escala={escala}
          olharEsquerda={c.lado === "inimigos"}
          velocidade={velocidade}
          rotulo={rotulo}
        />
        <div className="pointer-events-none absolute inset-x-0 top-6">
          {numeros.map((n, i) => (
            <span
              key={n.id}
              className="numero-flutuante"
              style={{ "--duracao": `${n.duracao}ms`, color: COR_NUMERO[n.estilo], marginTop: `${(i % 3) * -16}px` }}
            >
              {n.texto}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 h-0">
          {particulas.map((p) => (
            <Particulas key={p.id} efeito={p} velocidade={velocidade} />
          ))}
        </div>
      </div>

      <div className={`mt-1 w-full ${c.nocauteado ? "opacity-50" : ""}`}>
        <div className="flex items-baseline justify-between gap-1 text-sm">
          <span className={`truncate ${ativo ? "text-destaque" : ""}`}>{c.nome}</span>
          <span className="shrink-0 text-xs text-texto-3">nv {c.nivel}</span>
        </div>
        <BarraValor atual={c.hpAtual} maximo={c.hpMax} cor={corDaVida(c.hpAtual, c.hpMax)} rotulo={`Vida de ${c.nome}`} />
        <div className="flex justify-between text-xs text-texto-2">
          <span>
            {c.hpAtual}/{c.hpMax}
          </span>
          {c.recurso && (
            <span style={{ color: corRecurso(c.recurso.tipo) }}>
              {c.recurso.atual} {c.recurso.tipo}
            </span>
          )}
        </div>
        {c.recurso && (
          <BarraValor
            atual={c.recurso.atual}
            maximo={c.recurso.max}
            cor={corRecurso(c.recurso.tipo)}
            rotulo={`${c.recurso.tipo} de ${c.nome}`}
            fina
          />
        )}
        <ul className="mt-1 flex min-h-5 flex-wrap gap-1" aria-label={`Efeitos em ${c.nome}`}>
          {c.defendendo && <li className="rounded bg-info/20 px-1 text-xs text-info">Defendendo</li>}
          {c.status
            .filter((s) => !dadosStatus[s.statusId].oculto)
            .map((s, i) => (
              <li
                key={`${s.statusId}-${i}`}
                className={`rounded px-1 text-xs ${positivo(s) ? "bg-sucesso/15 text-sucesso" : "bg-perigo/15 text-perigo"}`}
                title={dadosStatus[s.statusId].descricao}
              >
                {rotuloStatus(s)}
                {s.turnos ? ` ${s.turnos}t` : ""}
                {s.acumulos > 1 ? ` ×${s.acumulos}` : ""}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
