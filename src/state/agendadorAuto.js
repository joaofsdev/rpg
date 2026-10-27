// Agendador do Auto (SPEC.md §3.13): no máximo um temporizador por vez, só para o ritmo. A cada
// estado novo ele vê o que o Auto pediria; o mesmo passo mantém o temporizador que já corre, um
// passo novo troca por outro. Quem decide se ainda é a hora e o que acontece é o reducer, pelo motor.
//
// Página oculta (outra aba, janela minimizada ou coberta) não pausa. Sem ninguém olhando, o Auto
// não espera a animação terminar na tela: encerra a fila depois do tempo que ela levaria, para o
// ritmo ser o mesmo da página visível. O navegador pode atrasar os temporizadores; o Auto segue no
// ritmo que ele permitir e nada é compensado depois: cada disparo faz no máximo um passo.

import { AUTO_PAUSA_ACAO_MS, AUTO_PAUSA_RESULTADO_MS } from "../data/constants";

// O que o Auto pede agora, se pede algo: "agir", "fila" (encerrar a animação), "proximo" ou null
export function proximoPedido({ auto, tela, save, batalhaUi }, { oculta = false } = {}) {
  if (auto.estado !== "ativo" || !save) return null;
  if (tela === "batalha") {
    // Animação em curso: visível, a interface avisa quando termina; oculta, o Auto não depende dela
    if (batalhaUi.eventos.length > 0) return oculta ? "fila" : null;
    if (save.batalha?.fase === "escolhaAcao") return "agir";
    if (!save.batalha && batalhaUi.encerrada) return "fila";
    return null;
  }
  if (tela === "resultado" || (tela === "masmorra" && save.masmorraAtual)) return "proximo";
  return null;
}

// Identifica um estado estável: muda a cada ação, fila, encontro, andar ou velocidade
function chaveDoPasso(estado, pedido) {
  const { save, resumoBatalha, batalhaUi, config } = estado;
  return [
    pedido,
    save.batalha?.id,
    save.batalha?.turnoGlobal,
    batalhaUi.eventos.length,
    resumoBatalha?.origem?.zonaId,
    save.masmorraAtual?.andar,
    config.velocidadeAnimacao,
  ].join("|");
}

function esperaDoPedido(pedido, estado, duracaoDaFila) {
  const velocidade = estado.config.velocidadeAnimacao;
  if (pedido === "proximo") return AUTO_PAUSA_RESULTADO_MS / velocidade;
  const { eventos } = estado.batalhaUi;
  if (pedido === "fila" && eventos.length > 0) return duracaoDaFila(eventos, velocidade);
  return AUTO_PAUSA_ACAO_MS / velocidade;
}

// acoes: autoAgir, filaConcluida e autoProximo (criarAcoes). documento: só lido para saber se a
// página está oculta e para reavaliar quando isso muda; nenhum evento de foco, mouse ou
// visibilidade pausa o Auto. duracaoDaFila(eventos, velocidade): quanto a animação levaria.
// agendar/cancelar: setTimeout/clearTimeout (trocáveis nos testes).
export function criarAgendadorAuto({ acoes, documento, duracaoDaFila, agendar = setTimeout, cancelar = clearTimeout }) {
  const oculta = () => documento?.visibilityState === "hidden";
  const executar = { agir: () => acoes.autoAgir(), fila: () => acoes.filaConcluida(), proximo: () => acoes.autoProximo() };
  let agendado = null; // { chave, timer, disparado }
  let ultimoEstado = null;

  function limpar() {
    if (agendado && !agendado.disparado) cancelar(agendado.timer);
    agendado = null;
  }

  function atualizar(estado) {
    ultimoEstado = estado;
    const pedido = proximoPedido(estado, { oculta: oculta() });
    const chave = pedido && chaveDoPasso(estado, pedido);
    if (agendado && agendado.chave === chave) return; // mesmo passo: nada de temporizador novo
    limpar();
    if (!pedido) return;
    const entrada = { chave, timer: null, disparado: false };
    entrada.timer = agendar(() => {
      // Atrasado (o estado já mudou) ou repetido: não faz nada
      if (agendado !== entrada || entrada.disparado) return;
      entrada.disparado = true;
      executar[pedido]();
    }, esperaDoPedido(pedido, estado, duracaoDaFila));
    agendado = entrada;
  }

  const reavaliar = () => ultimoEstado && atualizar(ultimoEstado);

  return {
    atualizar,
    iniciar() {
      documento?.addEventListener("visibilitychange", reavaliar);
    },
    encerrar() {
      documento?.removeEventListener("visibilitychange", reavaliar);
      limpar();
      ultimoEstado = null;
    },
    // Para os testes: há um temporizador esperando?
    pendente: () => Boolean(agendado && !agendado.disparado),
  };
}
