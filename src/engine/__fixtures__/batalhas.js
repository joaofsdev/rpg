// Auxiliares para montar heróis e batalhas nos testes
import { criarHeroi } from "../herois";
import { criarBatalha } from "../combate";

let contador = 0;

export function heroiTeste(classeId, nivel = 1, extras = {}) {
  contador += 1;
  return {
    ...criarHeroi({ id: `heroi-${contador}`, nome: `${classeId}-${contador}`, classeId, nivel }),
    ...extras,
  };
}

export function batalhaTeste({
  herois = [heroiTeste("cavaleiro", 5)],
  inimigos = [{ id: "esqueleto_fraco", nivel: 5 }],
  semente = 42,
  origem = { tipo: "zona", zonaId: "cemiterio" },
  equipamentos = {},
  afinidadesConhecidas = {},
} = {}) {
  return criarBatalha({ herois, inimigos, semente, origem, equipamentos, afinidadesConhecidas });
}

// Altera um combatente de uma batalha de teste (retorna uma cópia)
export function ajustar(batalha, combatenteId, mudancas) {
  const copia = structuredClone(batalha);
  const c = copia.combatentes[combatenteId];
  for (const [chave, valor] of Object.entries(mudancas)) {
    if (chave === "atributos") Object.assign(c.atributos, valor);
    else c[chave] = valor;
  }
  return copia;
}

// Escolhe a primeira ação de dano disponível no primeiro alvo vivo
export function golpeQualquer(batalha, golpeId) {
  const ativo = batalha.combatentes[batalha.ativoId];
  const alvo = Object.values(batalha.combatentes).find(
    (c) => c.lado !== ativo.lado && !c.nocauteado,
  );
  return { tipo: "golpe", golpeId: golpeId ?? ativo.golpeBasico, alvoId: alvo?.id };
}
