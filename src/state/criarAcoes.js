// Criadores de ação: o único lugar da interface que lê relógio, gera sementes e acessa o
// storage. Tudo o que muda o estado passa pelo reducer puro.

import { criarRng } from "../engine/rng";
import {
  migrarLegado,
  lerSlot,
  apagarSlot,
  gravarSlot,
  listarSlots,
  lerConfig,
} from "../save/armazenamento";
import { exportarSave, importarSave } from "../save/exportar";

function novaSemente() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

function baixarArquivo(nomeArquivo, conteudo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function criarAcoes(dispatch, storage) {
  const atualizarSlots = () => dispatch({ type: "SLOTS_ATUALIZADOS", slots: listarSlots(storage) });
  const avisar = (mensagem) => dispatch({ type: "AVISO", mensagem });

  return {
    iniciar() {
      const config = lerConfig(storage);
      const migracao = migrarLegado(storage, { agora: Date.now(), rng: criarRng(novaSemente()) });
      dispatch({
        type: "INICIADO",
        config,
        slots: listarSlots(storage),
        migracao: migracao.status === "escolhaNecessaria" ? { contas: migracao.contas } : null,
      });
    },

    escolherContasAntigas(usernames) {
      migrarLegado(storage, { agora: Date.now(), rng: criarRng(novaSemente()), usernames });
      dispatch({ type: "MIGRACAO_CONCLUIDA", slots: listarSlots(storage) });
    },

    abrirSlot(numero) {
      const lido = lerSlot(storage, numero);
      if (lido.status !== "ok") return avisar("Não foi possível abrir este save.");
      dispatch({ type: "SAVE_ABERTO", slot: numero, save: lido.save, agora: Date.now() });
    },

    novoJogo(slot) {
      dispatch({ type: "ABRIR_NOVO_JOGO", slot, semente: novaSemente() });
    },

    cancelarNovoJogo() {
      dispatch({ type: "CANCELAR_NOVO_JOGO" });
    },

    criarJogo(nomeHeroi, classeId) {
      dispatch({ type: "CRIAR_JOGO", nomeHeroi, classeId, agora: Date.now(), semente: novaSemente() });
    },

    apagarSlot(numero) {
      apagarSlot(storage, numero);
      atualizarSlots();
    },

    exportarSlot(numero) {
      const lido = lerSlot(storage, numero);
      if (lido.status === "ok") {
        const { nomeArquivo, conteudo } = exportarSave(lido.save, Date.now());
        baixarArquivo(nomeArquivo, conteudo);
      } else if (lido.status === "danificado") {
        baixarArquivo(`magichill-espaco-${numero + 1}-danificado.json`, lido.bruto);
      }
    },

    importarSave(texto, numero) {
      const resultado = importarSave(texto);
      if (!resultado.ok) return avisar(resultado.erro);
      gravarSlot(storage, numero, resultado.save, { agora: Date.now(), forcar: true });
      atualizarSlots();
      avisar(`Save importado no espaço ${numero + 1}.`);
    },

    fecharSlot() {
      dispatch({ type: "FECHAR_SLOT", slots: listarSlots(storage) });
    },

    navegar(tela) {
      dispatch({ type: "NAVEGAR", tela });
    },

    explorar(zonaId) {
      dispatch({ type: "INICIAR_ENCONTRO", zonaId, chefe: false, semente: novaSemente() });
    },

    enfrentarChefe(zonaId) {
      dispatch({ type: "INICIAR_ENCONTRO", zonaId, chefe: true, semente: novaSemente() });
    },

    entrarNaMasmorra(zonaId) {
      dispatch({ type: "ENTRAR_MASMORRA", zonaId });
    },

    descerAndar() {
      dispatch({ type: "DESCER_ANDAR", semente: novaSemente() });
    },

    sairDaMasmorra() {
      dispatch({ type: "SAIR_DA_MASMORRA" });
    },

    retomarBatalha() {
      dispatch({ type: "RETOMAR_BATALHA" });
    },

    agir(acao) {
      dispatch({ type: "ACAO_BATALHA", acao });
    },

    filaConcluida() {
      dispatch({ type: "FILA_CONCLUIDA" });
    },

    sairDaBatalha() {
      dispatch({ type: "SAIR_DA_BATALHA" });
    },

    fecharResultado() {
      dispatch({ type: "FECHAR_RESULTADO" });
    },

    distribuirPontos(heroiId, pontos) {
      dispatch({ type: "DISTRIBUIR_PONTOS", heroiId, pontos });
    },

    equiparGolpes(heroiId, golpes) {
      dispatch({ type: "EQUIPAR_GOLPES", heroiId, golpes });
    },

    abrirLoja() {
      dispatch({ type: "ABRIR_LOJA", agora: Date.now(), semente: novaSemente() });
    },

    renovarLoja() {
      dispatch({ type: "RENOVAR_LOJA", agora: Date.now(), semente: novaSemente() });
    },

    comprarEquipamento(indice) {
      dispatch({ type: "COMPRAR_EQUIPAMENTO", indice });
    },

    comprarItem(itemId, quantidade) {
      dispatch({ type: "COMPRAR_ITEM", itemId, quantidade });
    },

    equipar(heroiId, equipamentoId) {
      dispatch({ type: "EQUIPAR", heroiId, equipamentoId });
    },

    desequipar(heroiId, slot) {
      dispatch({ type: "DESEQUIPAR", heroiId, slot });
    },

    venderEquipamento(equipamentoId) {
      dispatch({ type: "VENDER_EQUIPAMENTO", equipamentoId });
    },

    // Relógio do jogo: chamado pelo Provider a cada 30 s com a aba visível e ao voltar para ela
    marcarRelogio() {
      dispatch({ type: "RELOGIO", agora: Date.now() });
    },

    voltouAoJogo() {
      dispatch({ type: "VOLTOU_AO_JOGO", agora: Date.now() });
    },

    fecharRetorno() {
      dispatch({ type: "FECHAR_RETORNO" });
    },

    coletarAtividade(atividadeId) {
      dispatch({ type: "COLETAR_ATIVIDADE", atividadeId, agora: Date.now() });
    },

    cancelarAtividade(atividadeId) {
      dispatch({ type: "CANCELAR_ATIVIDADE", atividadeId, agora: Date.now() });
    },

    coletarTudo() {
      dispatch({ type: "COLETAR_TUDO", agora: Date.now() });
    },

    treinarAtributo(heroiId, atributo, horas) {
      dispatch({ type: "INICIAR_TREINO", heroiId, atributo, horas, agora: Date.now(), semente: novaSemente() });
    },

    treinarGolpe(heroiId, golpeId) {
      dispatch({ type: "INICIAR_TREINO", heroiId, golpeId, agora: Date.now(), semente: novaSemente() });
    },

    colocarNoGrupo(heroiId) {
      dispatch({ type: "COLOCAR_NO_GRUPO", heroiId });
    },

    tirarDoGrupo(heroiId) {
      dispatch({ type: "TIRAR_DO_GRUPO", heroiId });
    },

    dispensarHeroi(heroiId) {
      dispatch({ type: "DISPENSAR_HEROI", heroiId });
    },

    abrirTaverna() {
      dispatch({ type: "ABRIR_TAVERNA", agora: Date.now(), semente: novaSemente() });
    },

    contratarRecruta(indice) {
      dispatch({ type: "CONTRATAR_RECRUTA", indice, semente: novaSemente() });
    },

    alterarConfig(mudancas) {
      dispatch({ type: "CONFIG_ALTERADA", mudancas });
    },

    avisar,

    limparAviso() {
      dispatch({ type: "AVISO_LIMPO" });
    },
  };
}
