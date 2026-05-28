import { useGame } from "../../context/GameContext";

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 8}s`,
            animationDelay: `${Math.random() * 6}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function TitleScreen() {
  const { dispatch } = useGame();
  return (
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary relative overflow-hidden noise-bg vignette">
      <Particles />
      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="MagiChill"
          className="w-44 md:w-64 lg:w-72 mx-auto mb-3 object-contain animate-breathe"
        />
        <p className="font-body text-text-secondary mb-10 md:mb-14 text-base md:text-lg italic">
          Um RPG de batalhas por turnos
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", payload: "AUTH" })}
            className="btn-primary"
          >
            <span>▶</span> Jogar Agora
          </button>
          <button
            onClick={() => dispatch({ type: "SET_MODAL", payload: "about" })}
            className="btn-primary"
          >
            <span>📜</span> Sobre
          </button>
          <button
            onClick={() => dispatch({ type: "SET_MODAL", payload: "credits" })}
            className="btn-primary"
          >
            <span>⚔</span> Créditos
          </button>
        </div>
      </div>
      <Modal type="about" />
      <Modal type="credits" />
    </div>
  );
}

function Modal({ type }) {
  const { state, dispatch } = useGame();
  if (state.modal !== type) return null;
  const content =
    type === "about"
      ? {
          title: "Sobre",
          text: "MagiChill é um RPG de batalhas por turnos onde você escolhe sua classe, equipa itens e progride por áreas temáticas enfrentando inimigos e bosses.",
        }
      : { title: "Créditos", text: "© MagiChill · Feito por joaofsdev" };
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => dispatch({ type: "SET_MODAL", payload: null })}
    >
      <div
        className="card p-8 max-w-md mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-title text-2xl font-bold text-accent-gold mb-4">{content.title}</h2>
        <p className="text-text-secondary mb-6 leading-relaxed">{content.text}</p>
        <button
          onClick={() => dispatch({ type: "SET_MODAL", payload: null })}
          className="btn-secondary px-6 py-2"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
