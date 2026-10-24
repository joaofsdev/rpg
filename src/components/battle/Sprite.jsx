import { useState } from "react";

// Durações dos efeitos em CSS para sprites sem quadros próprios (ms na velocidade 1×)
const DURACAO_EFEITO = { ataque: 420, dano: 280, derrota: 560 };
const CLASSE_EFEITO = { ataque: "efeito-ataque", dano: "efeito-dano" };

// animacao: idle | ataque | dano | derrota. "chave" muda a cada novo disparo para reiniciar.
// caido: mostra o herói/inimigo derrubado quando nenhuma animação está tocando.
// olharEsquerda: o sprite deve olhar para a esquerda (inimigos); espelha só se a arte olhar para o outro lado
export default function Sprite({ sprite, animacao = "idle", chave, caido = false, escala = 3, olharEsquerda = false, velocidade = 1, rotulo }) {
  const espelhar = olharEsquerda !== Boolean(sprite.viradoParaEsquerda);
  const [terminada, setTerminada] = useState(null);
  const tocando = animacao !== "idle" && terminada !== chave ? animacao : null;

  const quadros = sprite.animacoes;
  let def = quadros.idle;
  let estatico = false;
  let classeCorpo = "";
  let duracaoCorpo = 0;

  if (tocando) {
    def = quadros[tocando] ?? quadros.idle;
    duracaoCorpo = (quadros[tocando]?.ms ?? DURACAO_EFEITO[tocando]) / velocidade;
    if (tocando === "derrota") classeCorpo = quadros.derrota ? "" : "efeito-queda";
    else classeCorpo = CLASSE_EFEITO[tocando];
  } else if (caido) {
    if (quadros.derrota) {
      def = { ...quadros.derrota, inicio: quadros.derrota.inicio + quadros.derrota.quadros - 1, quadros: 1 };
      estatico = true;
    } else {
      classeCorpo = "caido";
    }
  }

  const animado = !estatico && def.quadros > 1;
  const repetir = !tocando && def.repetir;

  return (
    <div
      key={chave}
      role="img"
      aria-label={rotulo}
      className={classeCorpo}
      style={{ "--duracao": `${duracaoCorpo}ms`, "--direcao": olharEsquerda ? -1 : 1 }}
      onAnimationEnd={(e) => {
        if (tocando && e.animationName !== "subir" && e.animationName !== "espalhar") setTerminada(chave);
      }}
    >
      <div
        className={`sprite ${animado ? "sprite-animado" : ""}`}
        style={{
          "--imagem": `url(${sprite.arquivo})`,
          "--l": sprite.largura,
          "--a": sprite.altura,
          "--escala": escala,
          "--total": sprite.totalQuadros,
          "--inicio": def.inicio,
          "--quadros": def.quadros,
          "--duracao": `${(tocando ? duracaoCorpo : def.ms / velocidade) || def.ms}ms`,
          "--repeticoes": repetir ? "infinite" : 1,
          transform: espelhar ? "scaleX(-1)" : undefined,
          opacity: sprite.translucido ? 0.8 : undefined,
          filter: sprite.filtro,
        }}
      />
    </div>
  );
}
