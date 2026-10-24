// Tempo real no motor (SPEC.md §3.9, §6.6). O instante atual sempre chega por parâmetro.

// Relógio que nunca volta: o save guarda o maior instante já visto em ultimaVisita. Se o
// relógio do sistema for atrasado, o tempo do jogo fica parado até alcançar esse instante.
export function relogio(save, agora) {
  return Math.max(agora, save.ultimaVisita ?? agora);
}

export function registrarRelogio(save, agora) {
  const instante = relogio(save, agora);
  return instante === save.ultimaVisita ? save : { ...save, ultimaVisita: instante };
}

// Rotações por prazo (loja, mural). Relógio voltando no tempo não vence o prazo.
export function prazoVencido(desde, duracao, agora) {
  return agora - desde >= duracao;
}

export function tempoAtePrazo(desde, duracao, agora) {
  return Math.max(0, Math.min(duracao, desde + duracao - agora));
}
