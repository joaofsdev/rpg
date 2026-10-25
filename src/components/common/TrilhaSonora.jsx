import { useEffect } from "react";
import { useEstado } from "../../state/contextos";
import { ajustarVolumes, liberarAudio, tocarEfeito, tocarMusica } from "./som";

// Música por tela, volumes das configurações e o clique dos botões. Não desenha nada.
export default function TrilhaSonora() {
  const { tela, config } = useEstado();

  useEffect(() => {
    ajustarVolumes(config);
  }, [config]);

  useEffect(() => {
    tocarMusica(tela === "carregando" ? null : tela === "batalha" ? "batalha" : "cidade");
  }, [tela]);

  useEffect(() => {
    // O primeiro gesto libera o áudio; cliques em botões habilitados tocam o clique
    const aoTocar = () => liberarAudio();
    const aoClicar = (e) => {
      const botao = e.target.closest?.("button");
      if (botao && !botao.disabled) tocarEfeito("clique");
    };
    window.addEventListener("pointerdown", aoTocar);
    window.addEventListener("keydown", aoTocar);
    window.addEventListener("click", aoClicar);
    return () => {
      window.removeEventListener("pointerdown", aoTocar);
      window.removeEventListener("keydown", aoTocar);
      window.removeEventListener("click", aoClicar);
    };
  }, []);

  return null;
}
