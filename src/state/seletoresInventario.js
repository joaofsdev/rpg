// Inventário: busca, filtros, ordenação e comparação de equipamentos para a tela (SPEC.md §7.4).
// Só leem o save: nada aqui altera o inventário. As regras de equipar, tirar e vender são as do
// motor (as ações são simuladas para descobrir o motivo de estarem indisponíveis).

import { classesHeroi } from "../data/classesHeroi";
import { RARIDADES, TIPOS_ARMA, PESOS_ARMADURA } from "../data/equipamentos";
import { itens as dadosItens } from "../data/itens";
import { zonas } from "../data/zonas";
import { ATRIBUTOS, RARIDADE_CONFIRMAR_VENDA } from "../data/constants";
import { NOMES_ARMA, NOMES_TIPO_ARMADURA } from "../data/textos";
import { bonusDoEquipamento } from "../engine/atributos";
import { podeEquipar, precoVenda } from "../engine/itens";
import { equipar, desequipar, venderEquipamento, heroisEmBatalha } from "../engine/inventario";
import { heroisDoGrupo, heroisDaReserva } from "../engine/grupo";

export const FILTROS_PADRAO = {
  busca: "",
  slot: "todos",
  tipo: "todos",
  raridade: "todas",
  faixa: "todas",
  situacao: "todos",
  heroiId: "todos",
};

export const ORDENS = [
  { id: "nivelDesc", nome: "Nível: maior primeiro" },
  { id: "nivelAsc", nome: "Nível: menor primeiro" },
  { id: "raridade", nome: "Raridade" },
  { id: "nome", nome: "Nome (A–Z)" },
  { id: "recentes", nome: "Mais recentes" },
];
export const ORDEM_PADRAO = "nivelDesc";

export const SITUACOES = [
  { id: "todos", nome: "Todos" },
  { id: "equipados", nome: "Em uso" },
  { id: "disponiveis", nome: "Livres" },
];

// "Espada Ágil" e "espada agil" viram o mesmo texto
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Faixas de nível das zonas; a última não tem teto (itens podem passar do nível 100)
export function faixasDeNivel() {
  return zonas.map((zona, i) => ({
    id: zona.id,
    nome: zona.nome,
    min: zona.nivelMin,
    max: i === zonas.length - 1 ? Infinity : zona.nivelMax,
  }));
}

function nomeDoTipo(tipo) {
  return NOMES_ARMA[tipo] ?? NOMES_TIPO_ARMADURA[tipo];
}

function tipoDoItem(item) {
  return item.slot === "arma" ? item.tipoArma : item.pesoArmadura;
}

// O tipo escolhido só vale se existir no slot: armas têm tipos de arma; armaduras, pesos
function tipoCabeNoSlot(tipo, slot) {
  if (tipo === "todos" || slot === "todos") return true;
  return slot === "arma" ? TIPOS_ARMA.includes(tipo) : PESOS_ARMADURA.includes(tipo);
}

// Troca um filtro; ao mudar de categoria, um tipo que não existe nela volta para "todos"
export function alterarFiltro(filtros, campo, valor) {
  const novos = { ...filtros, [campo]: valor };
  if (campo === "slot" && !tipoCabeNoSlot(novos.tipo, valor)) novos.tipo = "todos";
  return novos;
}

export function filtrosAlterados(filtros) {
  return Object.keys(FILTROS_PADRAO).filter((campo) => filtros[campo] !== FILTROS_PADRAO[campo]);
}

// Equipamentos na ordem em que entraram no inventário (a ordem das chaves do save), com o dono
export function entradasDoInventario(save) {
  const donos = {};
  for (const heroi of Object.values(save.herois)) {
    for (const id of Object.values(heroi.equipamento)) if (id) donos[id] = heroi;
  }
  return Object.values(save.inventario.equipamentos).map((item, ordemEntrada) => ({
    item,
    dono: donos[item.id] ?? null,
    ordemEntrada,
  }));
}

function passaNosFiltros(entrada, filtros, termos, faixa, heroi) {
  const { item, dono } = entrada;
  if (filtros.slot !== "todos" && item.slot !== filtros.slot) return false;
  if (filtros.tipo !== "todos" && tipoDoItem(item) !== filtros.tipo) return false;
  if (filtros.raridade !== "todas" && item.raridade !== filtros.raridade) return false;
  if (faixa && (item.nivel < faixa.min || item.nivel > faixa.max)) return false;
  if (filtros.situacao === "equipados" && !dono) return false;
  if (filtros.situacao === "disponiveis" && dono) return false;
  if (heroi && !podeEquipar(heroi.classeId, item)) return false;
  if (termos.length > 0) {
    const nome = normalizarTexto(item.nome);
    if (!termos.every((termo) => nome.includes(termo))) return false;
  }
  return true;
}

export function filtrarEquipamentos(entradas, save, filtros) {
  const termos = normalizarTexto(filtros.busca).split(" ").filter(Boolean);
  const faixa = filtros.faixa === "todas" ? null : faixasDeNivel().find((f) => f.id === filtros.faixa);
  const heroi = filtros.heroiId === "todos" ? null : save.herois[filtros.heroiId];
  return entradas.filter((entrada) => passaNosFiltros(entrada, filtros, termos, faixa, heroi));
}

const indiceRaridade = (item) => RARIDADES.indexOf(item.raridade);
const porNome = (a, b) => a.item.nome.localeCompare(b.item.nome, "pt-BR", { sensitivity: "base" });

const COMPARADORES = {
  nivelDesc: (a, b) => b.item.nivel - a.item.nivel || indiceRaridade(b.item) - indiceRaridade(a.item) || porNome(a, b),
  nivelAsc: (a, b) => a.item.nivel - b.item.nivel || indiceRaridade(b.item) - indiceRaridade(a.item) || porNome(a, b),
  raridade: (a, b) => indiceRaridade(b.item) - indiceRaridade(a.item) || b.item.nivel - a.item.nivel || porNome(a, b),
  nome: (a, b) => porNome(a, b) || b.item.nivel - a.item.nivel,
  recentes: (a, b) => b.ordemEntrada - a.ordemEntrada,
};

// Empates ficam na ordem de entrada no inventário: a lista não "pula" entre renderizações
export function ordenarEquipamentos(entradas, ordem) {
  const comparar = COMPARADORES[ordem] ?? COMPARADORES[ORDEM_PADRAO];
  return [...entradas].sort((a, b) => comparar(a, b) || a.ordemEntrada - b.ordemEntrada);
}

export function listarEquipamentos(save, filtros, ordem) {
  const todas = entradasDoInventario(save);
  return { entradas: ordenarEquipamentos(filtrarEquipamentos(todas, save, filtros), ordem), total: todas.length };
}

// Tipos presentes no inventário para a categoria escolhida (e o tipo escolhido, mesmo sem itens):
// [{ valor, nome, quantidade }]
export function opcoesDeTipo(save, slot, tipoEscolhido = "todos") {
  const contagem = {};
  for (const item of Object.values(save.inventario.equipamentos)) {
    if (slot !== "todos" && item.slot !== slot) continue;
    const tipo = tipoDoItem(item);
    if (tipo) contagem[tipo] = (contagem[tipo] || 0) + 1;
  }
  return [...TIPOS_ARMA, ...PESOS_ARMADURA]
    .filter((tipo) => contagem[tipo] || tipo === tipoEscolhido)
    .map((tipo) => ({ valor: tipo, nome: nomeDoTipo(tipo), quantidade: contagem[tipo] || 0 }));
}

// Todas as raridades, com quantos itens de cada há no inventário
export function opcoesDeRaridade(save) {
  const lista = Object.values(save.inventario.equipamentos);
  return RARIDADES.map((raridade) => ({
    valor: raridade,
    nome: raridade,
    quantidade: lista.filter((i) => i.raridade === raridade).length,
  }));
}

// Faixas de nível que têm itens (e a escolhida, mesmo vazia, para o filtro não sumir)
export function opcoesDeFaixa(save, faixaEscolhida = "todas") {
  const lista = Object.values(save.inventario.equipamentos);
  return faixasDeNivel()
    .map((f) => ({
      valor: f.id,
      nome: `${f.min}–${f.max === Infinity ? `${f.min + 9}+` : f.max} · ${f.nome}`,
      quantidade: lista.filter((i) => i.nivel >= f.min && i.nivel <= f.max).length,
    }))
    .filter((o) => o.quantidade > 0 || o.valor === faixaEscolhida);
}

// Heróis do grupo e da reserva: [{ valor, nome, classe, nivel, reserva }]
export function opcoesDeHeroi(save) {
  const opcao = (reserva) => (h) => ({
    valor: h.id,
    nome: h.nome,
    classe: classesHeroi[h.classeId].nome,
    nivel: h.nivel,
    reserva,
  });
  return [...heroisDoGrupo(save).map(opcao(false)), ...heroisDaReserva(save).map(opcao(true))];
}

// Nomes das classes que podem usar o item: ["Cavaleiro", "Bárbaro"]
export function classesQueUsam(item) {
  return Object.values(classesHeroi)
    .filter((classe) => podeEquipar(classe.id, item))
    .map((classe) => classe.nome);
}

function donoDe(save, itemId) {
  return entradasDoInventario(save).find((e) => e.item.id === itemId)?.dono ?? null;
}

function emBatalha(save, heroiId) {
  return heroisEmBatalha(save).includes(heroiId);
}

// "Mago não usa espada. Usa: cajado, varinha, grimório."
function motivoIncompativel(classe, item) {
  const usa = item.slot === "arma" ? classe.armasPermitidas : classe.armadurasPermitidas;
  return `${classe.nome} não usa ${nomeDoTipo(tipoDoItem(item))}. Usa: ${usa.map(nomeDoTipo).join(", ")}.`;
}

export function motivoNaoEquipa(save, heroiId, item) {
  const heroi = save.herois[heroiId];
  const dono = donoDe(save, item.id);
  if (dono?.id === heroi.id) return `${heroi.nome} já usa este item.`;
  if (!podeEquipar(heroi.classeId, item)) return motivoIncompativel(classesHeroi[heroi.classeId], item);
  if (emBatalha(save, heroi.id)) return `${heroi.nome} está em uma batalha em andamento.`;
  if (dono && emBatalha(save, dono.id)) return `${dono.nome} está usando este item em uma batalha em andamento.`;
  return equipar(save, heroiId, item.id).erro ?? null;
}

export function motivoNaoTira(save, item) {
  const dono = donoDe(save, item.id);
  if (!dono) return "Ninguém está usando este item.";
  if (emBatalha(save, dono.id)) return `${dono.nome} está em uma batalha em andamento.`;
  return desequipar(save, dono.id, item.slot).erro ?? null;
}

export function motivoNaoVende(save, item) {
  const dono = donoDe(save, item.id);
  if (dono) return `Em uso por ${dono.nome}. Tire o item antes de vender.`;
  return venderEquipamento(save, item.id).erro ?? null;
}

export function pedeConfirmacaoVenda(item) {
  return item.aprimoramento > 0 || RARIDADES.indexOf(item.raridade) >= RARIDADES.indexOf(RARIDADE_CONFIRMAR_VENDA);
}

// Bônus do item contra os de outro (ou contra o espaço vazio): melhor, pior ou igual por atributo
export function compararBonus(item, atual) {
  const bonus = bonusDoEquipamento(item);
  const outro = atual ? bonusDoEquipamento(atual) : null;
  return ATRIBUTOS.filter((a) => bonus[a] !== 0 || (outro && outro[a] !== 0)).map((atributo) => {
    const valorAtual = outro ? outro[atributo] : 0;
    const diferenca = bonus[atributo] - valorAtual;
    return {
      atributo,
      valor: bonus[atributo],
      atual: valorAtual,
      diferenca,
      sentido: diferenca > 0 ? "melhor" : diferenca < 0 ? "pior" : "igual",
    };
  });
}

// Herói sugerido para comparar: o do filtro "serve para"; senão, o primeiro (grupo, depois
// reserva) que pode usar o item e ainda não o usa
export function heroiParaComparar(save, item, heroiDoFiltro = "todos") {
  if (heroiDoFiltro !== "todos" && save.herois[heroiDoFiltro]) return heroiDoFiltro;
  const herois = [...heroisDoGrupo(save), ...heroisDaReserva(save)];
  const dono = donoDe(save, item.id);
  return (herois.find((h) => podeEquipar(h.classeId, item) && h.id !== dono?.id) ?? herois[0])?.id ?? null;
}

// Tudo o que o painel de detalhes mostra sobre o item visto pelo herói escolhido
export function comparacaoComHeroi(save, item, heroiId) {
  const heroi = save.herois[heroiId];
  const idAtual = heroi.equipamento[item.slot];
  const atual = idAtual && idAtual !== item.id ? save.inventario.equipamentos[idAtual] ?? null : null;
  const mesmoItem = idAtual === item.id;
  const linhas = compararBonus(item, mesmoItem ? null : atual);
  return {
    heroi,
    classe: classesHeroi[heroi.classeId],
    compativel: podeEquipar(heroi.classeId, item),
    atual,
    mesmoItem,
    linhas,
    melhores: mesmoItem ? 0 : linhas.filter((l) => l.sentido === "melhor").length,
    piores: mesmoItem ? 0 : linhas.filter((l) => l.sentido === "pior").length,
    motivoEquipar: motivoNaoEquipa(save, heroiId, item),
  };
}

export function detalhesDoEquipamento(save, item) {
  return {
    dono: donoDe(save, item.id),
    classes: classesQueUsam(item),
    preco: precoVenda(item),
    motivoTirar: motivoNaoTira(save, item),
    motivoVender: motivoNaoVende(save, item),
    pedeConfirmacao: pedeConfirmacaoVenda(item),
  };
}

// ---------- Aba Itens ----------

export const CATEGORIAS_ITEM = [
  { id: "consumivel", nome: "Consumíveis", uso: "Usados na batalha, pelo menu Itens.", dica: "Compre na Loja." },
  { id: "material", nome: "Materiais", uso: "Usados na Ferraria para forjar e aprimorar.", dica: "Vêm de inimigos e expedições." },
  { id: "ingrediente", nome: "Ingredientes", uso: "Usados na cozinha da Taverna.", dica: "Vêm de inimigos e expedições." },
  { id: "refeicao", nome: "Refeições", uso: "Coma na Taverna antes de explorar.", dica: "Prepare na cozinha da Taverna." },
];

// Zona de onde vem cada material ou ingrediente (tabela de expedição)
function zonasDeOrigem() {
  const origem = {};
  for (const zona of zonas) for (const { itemId } of zona.tabelaExpedicao) origem[itemId] ??= zona.nome;
  return origem;
}

// Itens empilháveis por categoria, na ordem dos dados: [{ ...categoria, itens: [{ item, quantidade,
// cheia, origem }] }]
export function itensPorCategoria(save) {
  const origem = zonasDeOrigem();
  const ordemDados = Object.keys(dadosItens);
  const presentes = Object.entries(save.inventario.itens)
    .filter(([id, qtd]) => qtd > 0 && dadosItens[id])
    .sort(([a], [b]) => ordemDados.indexOf(a) - ordemDados.indexOf(b))
    .map(([id, quantidade]) => ({
      item: dadosItens[id],
      quantidade,
      cheia: quantidade >= dadosItens[id].empilhaAte,
      origem: origem[id] ?? null,
    }));
  return CATEGORIAS_ITEM.map((categoria) => ({
    ...categoria,
    itens: presentes.filter((p) => p.item.categoria === categoria.id),
  }));
}
