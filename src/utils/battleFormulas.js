export function calcularDano(ataque, atacante, defensor) {
  if (Math.random() < 0.1) return null;
  const ataqueTotal = (ataque.power * atacante.forca) / 10;
  const reducao = defensor.defesa * 0.7;
  let dano = Math.floor(ataqueTotal * (100 / (100 + reducao)));
  dano = Math.max(1, dano + Math.floor(Math.random() * 5) - 2);
  return dano;
}

export function aplicarPassivo(dano, ataque, classe, contexto) {
  if (!classe?.passivo || dano === null) return dano;
  const p = classe.passivo;
  switch (p.tipo) {
    case "reducao_dano":
      return dano;
    case "critico":
      if (Math.random() < p.valor) return Math.floor(dano * 1.5);
      return dano;
    case "dano_alto":
      if (ataque.power > p.limiar) return Math.floor(dano * (1 + p.valor));
      return dano;
    case "primeiro_ataque":
      if (contexto?.primeiroAtaque && contexto?.agiuPrimeiro)
        return Math.floor(dano * (1 + p.valor));
      return dano;
    case "furia": {
      const hpPerdidoPercent =
        1 - (contexto?.hpAtual || 1) / (contexto?.hpMax || 1);
      const stacks = Math.floor(hpPerdidoPercent / p.intervalo);
      return dano + stacks * p.valor;
    }
    default:
      return dano;
  }
}

export function aplicarReducaoDano(dano, classeDefensor) {
  if (
    !classeDefensor?.passivo ||
    classeDefensor.passivo.tipo !== "reducao_dano"
  )
    return dano;
  return Math.floor(dano * (1 - classeDefensor.passivo.valor));
}

export function calcularAtributosFinais(
  atributosBase,
  pontosDistribuidos,
  equipamentos,
) {
  const bonus = { vida: 0, forca: 0, defesa: 0, velocidade: 0 };
  Object.values(equipamentos || {}).forEach((item) => {
    if (!item) return;
    bonus.vida += item.bonusVida || 0;
    bonus.forca += item.bonusForca || 0;
    bonus.defesa += item.bonusDefesa || 0;
    bonus.velocidade += item.bonusVelocidade || 0;
  });
  const pd = pontosDistribuidos || {
    vida: 0,
    forca: 0,
    defesa: 0,
    velocidade: 0,
  };
  return {
    vida: atributosBase.vida + pd.vida * 10 + bonus.vida,
    forca: atributosBase.forca + pd.forca * 2 + bonus.forca,
    defesa: atributosBase.defesa + pd.defesa * 2 + bonus.defesa,
    velocidade: atributosBase.velocidade + pd.velocidade * 1 + bonus.velocidade,
  };
}
