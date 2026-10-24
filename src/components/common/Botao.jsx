const VARIANTES = {
  primario: "botao-primario",
  secundario: "botao-secundario",
  discreto: "botao-discreto",
  perigo: "botao-perigo",
};

export default function Botao({ variante = "secundario", className = "", type = "button", ...props }) {
  return <button type={type} className={`botao ${VARIANTES[variante]} ${className}`} {...props} />;
}
