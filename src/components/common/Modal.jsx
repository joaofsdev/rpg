import { useEffect, useRef } from "react";

export default function Modal({ titulo, aoFechar, children, acoes }) {
  const caixa = useRef(null);

  useEffect(() => {
    const anterior = document.activeElement;
    caixa.current?.querySelector("button, input, [tabindex]")?.focus();
    const aoTeclar = (e) => e.key === "Escape" && aoFechar?.();
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      anterior?.focus?.();
    };
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar?.()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="painel w-full max-w-md p-5"
      >
        <h2 className="titulo text-lg text-destaque mb-3">{titulo}</h2>
        <div className="text-texto-2">{children}</div>
        {acoes && <div className="mt-5 flex flex-wrap justify-end gap-2">{acoes}</div>}
      </div>
    </div>
  );
}
