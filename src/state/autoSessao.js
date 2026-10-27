// Estado do Auto e da sessão de farm (SPEC.md §3.13). Fica só no estado global, fora do save:
// recarregar a página começa uma sessão nova. Funções puras.
//
// estado: "desligado" | "ativo" | "pausado" (retomável) | "encerrado" (parada obrigatória: derrota,
// fim da sequência, erro); motivo: texto mostrado ao jogador.

export const AUTO_DESLIGADO = {
  estado: "desligado",
  motivo: null,
  sessao: null,
  // Ao retomar, a batalha atual não pausa de novo por vida baixa
  vidaLiberadaNaBatalha: null,
  // A pausa veio de uma parada opcional (chefe, inventário, vida, limite) antes do próximo encontro
  pausaOpcional: false,
  // Ao retomar depois dela, as paradas opcionais não valem para o próximo encontro
  liberarProximo: false,
};

export function novaSessao(agora, comBatalha) {
  return {
    inicio: agora,
    encontro: comBatalha ? 1 : 0, // número do encontro atual
    vitorias: 0,
    derrotas: 0,
    ouro: 0,
    xp: 0,
    itens: 0,
    concluidosNoTrecho: 0, // encontros concluídos desde que foi ligado ou retomado (limite)
  };
}

export function ligarAuto(auto, agora, comBatalha) {
  if (auto.estado === "ativo") return auto;
  return { ...AUTO_DESLIGADO, estado: "ativo", sessao: novaSessao(agora, comBatalha) };
}

export function pausarAuto(auto, motivo, { opcional = false } = {}) {
  if (auto.estado !== "ativo") return auto;
  return { ...auto, estado: "pausado", motivo, pausaOpcional: opcional };
}

// Parada obrigatória: a sessão continua à vista, mas só um novo "Auto" recomeça
export function encerrarAuto(auto, motivo) {
  if (auto.estado === "desligado") return auto;
  return { ...auto, estado: "encerrado", motivo, liberarProximo: false };
}

// Pausa que vem de fora (página recarregada): sem sessão até "Retomar Auto", que começa uma nova
export function autoPausadoAoVoltar(motivo) {
  return { ...AUTO_DESLIGADO, estado: "pausado", motivo };
}

export function retomarAuto(auto, agora, { batalhaId = null, comBatalha = false } = {}) {
  if (auto.estado !== "pausado") return auto;
  const sessao = auto.sessao ?? novaSessao(agora, comBatalha);
  return {
    ...auto,
    estado: "ativo",
    motivo: null,
    sessao: { ...sessao, concluidosNoTrecho: 0 },
    vidaLiberadaNaBatalha: batalhaId,
    liberarProximo: auto.pausaOpcional && !batalhaId,
    pausaOpcional: false,
  };
}

// Fim de uma batalha jogada pelo Auto. `ouro`: diferença real do ouro (inclui vendas por inventário
// ou pilha cheia). XP é o que cada herói recebeu; itens contam o que foi guardado.
export function contabilizarBatalha(sessao, resumo, ouro) {
  const vitoria = resumo.resultado === "vitoria";
  const itens = Object.values(resumo.itens ?? {}).reduce((s, q) => s + q, 0) + (resumo.equipamentos?.length ?? 0);
  return {
    ...sessao,
    vitorias: sessao.vitorias + (vitoria ? 1 : 0),
    derrotas: sessao.derrotas + (resumo.resultado === "derrota" ? 1 : 0),
    ouro: sessao.ouro + ouro,
    xp: sessao.xp + (vitoria ? resumo.xp : 0),
    itens: sessao.itens + (vitoria ? itens : 0),
    concluidosNoTrecho: sessao.concluidosNoTrecho + 1,
  };
}

export function contarEncontro(sessao) {
  return { ...sessao, encontro: sessao.encontro + 1 };
}

// "5 vitórias, 1 derrota, 240 ouro"
export function resumirSessao(sessao) {
  if (!sessao) return "";
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const partes = [plural(sessao.vitorias, "vitória", "vitórias")];
  if (sessao.derrotas > 0) partes.push(plural(sessao.derrotas, "derrota", "derrotas"));
  partes.push(`${sessao.ouro} ouro`);
  return partes.join(", ");
}
