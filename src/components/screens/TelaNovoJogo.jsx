import { useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { TAMANHO_NOME_MAX } from "../../data/constants";
import { classesHeroi } from "../../data/classesHeroi";
import { golpes } from "../../data/golpes";
import { spritesHerois } from "../../data/sprites";
import { NOMES_ATRIBUTO } from "../../data/textos";
import Sprite from "../battle/Sprite";
import Botao from "../common/Botao";

const DESTAQUES = ["vida", "forca", "magia", "defesa", "velocidade"];

function OpcaoClasse({ classe, escolhida, aoEscolher }) {
  return (
    <label
      className={`painel flex cursor-pointer flex-col gap-2 p-4 ${escolhida ? "border-destaque" : "hover:border-borda-forte"}`}
    >
      <input
        type="radio"
        name="classe"
        value={classe.id}
        checked={escolhida}
        onChange={() => aoEscolher(classe.id)}
        className="sr-only"
      />
      <div className="flex items-center gap-3">
        <Sprite sprite={spritesHerois[classe.id]} escala={2} rotulo="" />
        <div>
          <span className="titulo text-lg">{classe.nome}</span>
          <p className="text-sm text-texto-2">{classe.descricao}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 text-sm">
        {DESTAQUES.map((a) => (
          <div key={a} className="flex justify-between">
            <dt className="text-texto-2">{NOMES_ATRIBUTO[a]}</dt>
            <dd>{classe.atributosBase[a]}</dd>
          </div>
        ))}
        <div className="flex justify-between">
          <dt className="text-texto-2">Recurso</dt>
          <dd className={classe.recurso === "mana" ? "text-mana" : "text-vigor"}>{classe.recurso}</dd>
        </div>
      </dl>
      <p className="text-sm text-texto-2">
        <span className="text-texto">Passivo:</span> {classe.passivo.descricao}
      </p>
      <p className="text-sm text-texto-2">
        <span className="text-texto">Golpes:</span> {classe.golpesIniciais.map((g) => golpes[g].nome).join(", ")}
      </p>
    </label>
  );
}

export default function TelaNovoJogo() {
  const { novoJogo } = useEstado();
  const acoes = useAcoes();
  const [classeId, setClasseId] = useState(novoJogo.classes[0]);
  const [nome, setNome] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    acoes.criarJogo(nome, classeId);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="titulo mb-1 text-3xl text-destaque">Nova jornada</h1>
      <p className="mb-6 text-texto-2">
        Três classes foram sorteadas para o seu herói. Um companheiro de outra classe vai junto desde o início.
      </p>
      <form onSubmit={enviar}>
        <fieldset>
          <legend className="sr-only">Classe do herói</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {novoJogo.classes.map((id) => (
              <OpcaoClasse key={id} classe={classesHeroi[id]} escolhida={classeId === id} aoEscolher={setClasseId} />
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="titulo text-sm">Nome do herói</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={TAMANHO_NOME_MAX}
              required
              className="rounded border-2 border-borda bg-elevado px-3 py-2 text-texto outline-none focus:border-destaque"
            />
          </label>
          <div className="flex gap-2">
            <Botao variante="discreto" onClick={acoes.cancelarNovoJogo}>
              Voltar
            </Botao>
            <Botao variante="primario" type="submit" disabled={nome.trim().length === 0}>
              Começar
            </Botao>
          </div>
        </div>
      </form>
    </main>
  );
}
