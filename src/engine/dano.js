import {
  MULT_AFINIDADE,
  FATOR_DEFESA,
  VARIACAO_DANO_MIN,
  VARIACAO_DANO_MAX,
  MULT_CRITICO,
  CRITICO_BASE,
  PRECISAO_PADRAO,
  ACERTO_MIN,
  ACERTO_MAX,
  FATOR_VELOCIDADE_ACERTO,
  PENALIDADE_EVASAO,
  ACERTO_MIN_COM_EVASAO,
} from "../data/constants";

// Dano antes de afinidade, crítico, variação e modificadores (SPEC.md §4.2)
export function calcularDanoBase(poder, ataque, defesa) {
  return ((poder * ataque) / 10) * (100 / (100 + defesa * FATOR_DEFESA));
}

export function calcularDano({
  poder,
  ataque,
  defesa,
  afinidade = "neutro",
  critico = false,
  variacao = 1,
  modificador = 1,
}) {
  const multAfinidade = MULT_AFINIDADE[afinidade];
  if (multAfinidade === 0) return 0;
  const dano = Math.floor(
    calcularDanoBase(poder, ataque, defesa) *
      multAfinidade *
      (critico ? MULT_CRITICO : 1) *
      variacao *
      modificador,
  );
  return Math.max(1, dano);
}

export function faixaDano(parametros) {
  return {
    min: calcularDano({ ...parametros, critico: false, variacao: VARIACAO_DANO_MIN }),
    max: calcularDano({ ...parametros, critico: false, variacao: VARIACAO_DANO_MAX }),
  };
}

export function sortearVariacao(rng) {
  return VARIACAO_DANO_MIN + rng.proximo() * (VARIACAO_DANO_MAX - VARIACAO_DANO_MIN);
}

export function afinidadeContra(dadosAlvo, elemento) {
  if (!dadosAlvo || !elemento) return "neutro";
  if (dadosAlvo.imunidades?.includes(elemento)) return "imune";
  if (dadosAlvo.fraquezas?.includes(elemento)) return "fraco";
  if (dadosAlvo.resistencias?.includes(elemento)) return "resiste";
  return "neutro";
}

// Chance de acerto em % (SPEC.md §4.3)
export function chanceAcerto({ precisao = PRECISAO_PADRAO, velAtacante, velAlvo, evasao = false }) {
  let chance =
    precisao >= 100
      ? 100
      : Math.min(
          ACERTO_MAX,
          Math.max(ACERTO_MIN, precisao + (velAtacante - velAlvo) * FATOR_VELOCIDADE_ACERTO),
        );
  if (evasao) chance = Math.max(ACERTO_MIN_COM_EVASAO, chance - PENALIDADE_EVASAO);
  return chance;
}

export function chanceCritico(bonus = 0) {
  return CRITICO_BASE + bonus;
}
