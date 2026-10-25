// Efeitos sonoros e música (SPEC.md §7.6). Só reprodução: nenhuma regra de jogo passa por aqui.
// Navegadores só tocam áudio depois do primeiro gesto do jogador; até lá a música fica pedida e
// começa em liberarAudio().

import golpeCorte from "../../assets/audio/efeitos/golpe_corte.ogg";
import golpeImpacto from "../../assets/audio/efeitos/golpe_impacto.ogg";
import golpeMagia from "../../assets/audio/efeitos/golpe_magia.ogg";
import critico from "../../assets/audio/efeitos/critico.ogg";
import errou from "../../assets/audio/efeitos/errou.ogg";
import cura from "../../assets/audio/efeitos/cura.ogg";
import nocaute from "../../assets/audio/efeitos/nocaute.ogg";
import status from "../../assets/audio/efeitos/status.ogg";
import item from "../../assets/audio/efeitos/item.ogg";
import vitoria from "../../assets/audio/efeitos/vitoria.ogg";
import derrota from "../../assets/audio/efeitos/derrota.ogg";
import clique from "../../assets/audio/efeitos/clique.ogg";
import cidade from "../../assets/audio/musica/cidade.mp3";
import batalha from "../../assets/audio/musica/batalha.mp3";

export const EFEITOS = { golpeCorte, golpeImpacto, golpeMagia, critico, errou, cura, nocaute, status, item, vitoria, derrota, clique };
export const MUSICAS = { cidade, batalha };

const volumes = { efeitos: 0, musica: 0 };
let liberado = false;
let faixaPedida = null;
let musica = null;
let faixaTocando = null;

function atualizarMusica() {
  if (!liberado || !faixaPedida || volumes.musica <= 0) {
    musica?.pause();
    return;
  }
  if (faixaTocando !== faixaPedida) {
    musica?.pause();
    musica = new Audio(MUSICAS[faixaPedida]);
    musica.loop = true;
    faixaTocando = faixaPedida;
  }
  musica.volume = volumes.musica;
  musica.play().catch(() => {});
}

// volumeEfeitos e volumeMusica de 0 a 1 (configurações do dispositivo)
export function ajustarVolumes({ volumeEfeitos, volumeMusica }) {
  volumes.efeitos = volumeEfeitos;
  volumes.musica = volumeMusica;
  atualizarMusica();
}

export function liberarAudio() {
  if (liberado) return;
  liberado = true;
  atualizarMusica();
}

export function tocarEfeito(nome) {
  if (!liberado || volumes.efeitos <= 0 || !EFEITOS[nome]) return;
  const audio = new Audio(EFEITOS[nome]);
  audio.volume = volumes.efeitos;
  audio.play().catch(() => {});
}

// faixa: "cidade" | "batalha" | null (silêncio)
export function tocarMusica(faixa) {
  faixaPedida = faixa;
  atualizarMusica();
}
