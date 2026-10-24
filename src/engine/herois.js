import { classesHeroi } from "../data/classesHeroi";
import { nomesHerois } from "../data/nomesHerois";
import { SLOTS_EQUIPAMENTO, ATRIBUTOS, MAX_GOLPES_EQUIPADOS } from "../data/constants";
import { escolher, gerarId } from "./rng";
import { conjuntoComum } from "./itens";

function pontosVazios() {
  return { vida: 0, forca: 0, magia: 0, defesa: 0, resistencia: 0, velocidade: 0, manaMax: 0 };
}

// Golpes que a classe conhece até o nível informado (iniciais + golpes por nível)
export function golpesAteONivel(classeId, nivel) {
  const classe = classesHeroi[classeId];
  return [
    ...classe.golpesIniciais,
    ...classe.golpesPorNivel.filter((g) => g.nivel <= nivel).map((g) => g.golpeId),
  ];
}

export function criarHeroi({ id, nome, classeId, nivel = 1 }) {
  const classe = classesHeroi[classeId];
  return {
    id,
    nome,
    classeId,
    nivel,
    xp: 0,
    pontosLivres: 0,
    pontosNivel: pontosVazios(),
    pontosTreino: pontosVazios(),
    golpesAprendidos: golpesAteONivel(classeId, nivel),
    golpesEquipados: [...classe.golpesIniciais],
    equipamento: Object.fromEntries(SLOTS_EQUIPAMENTO.map((slot) => [slot, null])),
  };
}

// Herói novo já equipado com um conjunto Comum do nível (companheiro, recruta).
// Retorna { heroi, equipamentos }.
export function criarHeroiEquipado(rng, { classeId, nome, nivel }) {
  const heroi = criarHeroi({ id: gerarId(rng), nome, classeId, nivel });
  const equipamentos = conjuntoComum(rng, classeId, nivel);
  for (const item of equipamentos) heroi.equipamento[item.slot] = item.id;
  return { heroi, equipamentos };
}

// Companheiro de classe diferente. Retorna { heroi, equipamentos }.
export function criarCompanheiro(rng, { excluirClasseId, nivel, nomesEmUso = [] }) {
  const classeId = escolher(
    rng,
    Object.keys(classesHeroi).filter((id) => id !== excluirClasseId),
  );
  const nomesLivres = nomesHerois.filter((n) => !nomesEmUso.includes(n));
  const nome = escolher(rng, nomesLivres.length ? nomesLivres : nomesHerois);
  return criarHeroiEquipado(rng, { classeId, nome, nivel });
}

// Adiciona um herói e seus equipamentos ao save, no fim do grupo ou na reserva
export function adicionarHeroi(save, heroi, equipamentos = [], { noGrupo = true } = {}) {
  const novosEquipamentos = { ...save.inventario.equipamentos };
  for (const item of equipamentos) novosEquipamentos[item.id] = item;
  return {
    ...save,
    herois: { ...save.herois, [heroi.id]: heroi },
    grupo: noGrupo ? [...save.grupo, heroi.id] : save.grupo,
    inventario: { ...save.inventario, equipamentos: novosEquipamentos },
  };
}

// Atributos em que o herói pode colocar pontos (manaMax só para classes de mana)
export function atributosDistribuiveis(classeId) {
  const base = [...ATRIBUTOS];
  return classesHeroi[classeId].recurso === "mana" ? [...base, "manaMax"] : base;
}

// Gasta pontos livres. pontos: { [atributo]: quantidade }. Retorna { heroi } ou { erro }.
export function distribuirPontos(heroi, pontos) {
  const validos = atributosDistribuiveis(heroi.classeId);
  let total = 0;
  for (const [atributo, qtd] of Object.entries(pontos)) {
    if (!validos.includes(atributo)) return { erro: `Atributo inválido: ${atributo}.` };
    if (!Number.isInteger(qtd) || qtd < 0) return { erro: "Quantidade inválida." };
    total += qtd;
  }
  if (total === 0) return { erro: "Nenhum ponto escolhido." };
  if (total > heroi.pontosLivres) return { erro: "Pontos livres insuficientes." };

  const pontosNivel = { ...heroi.pontosNivel };
  for (const [atributo, qtd] of Object.entries(pontos)) pontosNivel[atributo] += qtd;
  return { heroi: { ...heroi, pontosNivel, pontosLivres: heroi.pontosLivres - total } };
}

// Acrescenta os golpes que o nível atual libera. Retorna { heroi, novos }.
export function aprenderGolpesDoNivel(heroi) {
  const novos = golpesAteONivel(heroi.classeId, heroi.nivel).filter(
    (id) => !heroi.golpesAprendidos.includes(id),
  );
  if (novos.length === 0) return { heroi, novos };
  return { heroi: { ...heroi, golpesAprendidos: [...heroi.golpesAprendidos, ...novos] }, novos };
}

// Garante que todos os heróis do save conhecem os golpes do próprio nível
export function sincronizarGolpes(save) {
  let mudou = false;
  const herois = {};
  for (const [id, heroi] of Object.entries(save.herois)) {
    const { heroi: atualizado, novos } = aprenderGolpesDoNivel(heroi);
    if (novos.length > 0) mudou = true;
    herois[id] = atualizado;
  }
  return mudou ? { ...save, herois } : save;
}

// Escolhe os golpes equipados (1 a 4, todos aprendidos, sem repetir). Retorna { heroi } ou { erro }.
export function equiparGolpes(heroi, golpeIds) {
  if (golpeIds.length === 0 || golpeIds.length > MAX_GOLPES_EQUIPADOS) {
    return { erro: `Escolha de 1 a ${MAX_GOLPES_EQUIPADOS} golpes.` };
  }
  if (new Set(golpeIds).size !== golpeIds.length) return { erro: "Um golpe não pode ser equipado duas vezes." };
  if (golpeIds.some((id) => !heroi.golpesAprendidos.includes(id))) {
    return { erro: "Este herói ainda não aprendeu esse golpe." };
  }
  return { heroi: { ...heroi, golpesEquipados: [...golpeIds] } };
}
