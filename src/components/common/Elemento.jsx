import { NOMES_ELEMENTO, CORES_ELEMENTO } from "../../data/textos";

// Nome do elemento com um marcador na cor dele. A cor fica só no marcador (decorativo): as cores
// dos elementos são pensadas para fundo escuro e não teriam contraste como texto no tema claro.
export default function Elemento({ elemento }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="text-[0.7em]" style={{ color: CORES_ELEMENTO[elemento], textShadow: "0 0 1px #0008" }}>
        ◆
      </span>
      {NOMES_ELEMENTO[elemento]}
    </span>
  );
}
