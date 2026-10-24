import { useRef, useState } from "react";
import { useEstado, useAcoes } from "../../state/contextos";
import { MAX_SLOTS } from "../../data/constants";
import Botao from "../common/Botao";
import Modal from "../common/Modal";

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function LinhaSlot({ numero, slot, acoes, aoApagar }) {
  return (
    <li className="flex flex-col gap-3 border-b border-borda px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <span className="titulo w-24 shrink-0 whitespace-nowrap text-texto-3">Espaço {numero + 1}</span>

      {slot.status === "ok" && (
        <>
          <div className="flex-1">
            <p className="titulo text-lg">{slot.resumo.nome}</p>
            <p className="text-sm text-texto-2">
              {slot.resumo.classePrincipal}, nível {slot.resumo.nivelMaisAlto}. Salvo em{" "}
              {formatoData.format(slot.resumo.atualizadoEm)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao variante="primario" onClick={() => acoes.abrirSlot(numero)}>
              Continuar
            </Botao>
            <Botao onClick={() => acoes.exportarSlot(numero)}>Exportar</Botao>
            <Botao variante="perigo" onClick={() => aoApagar(numero, slot.resumo.nome)}>
              Apagar
            </Botao>
          </div>
        </>
      )}

      {slot.status === "vazio" && (
        <>
          <p className="flex-1 text-texto-2">Vazio</p>
          <Botao variante="primario" onClick={() => acoes.novoJogo(numero)}>
            Começar nova jornada
          </Botao>
        </>
      )}

      {slot.status === "danificado" && (
        <>
          <div className="flex-1">
            <p className="text-perigo">Este save não pôde ser lido.</p>
            <p className="text-sm text-texto-2">{slot.erro} Exporte uma cópia antes de apagar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={() => acoes.exportarSlot(numero)}>Exportar cópia</Botao>
            <Botao variante="perigo" onClick={() => aoApagar(numero, "danificado")}>
              Apagar
            </Botao>
          </div>
        </>
      )}
    </li>
  );
}

function EscolhaMigracao({ contas, aoConfirmar }) {
  const [escolhidas, setEscolhidas] = useState(contas.slice(0, MAX_SLOTS).map((c) => c.username));
  const alternar = (username) =>
    setEscolhidas((atual) =>
      atual.includes(username)
        ? atual.filter((u) => u !== username)
        : atual.length < MAX_SLOTS
          ? [...atual, username]
          : atual,
    );
  return (
    <Modal
      titulo="Trazer personagens do jogo antigo"
      acoes={
        <Botao variante="primario" disabled={escolhidas.length === 0} onClick={() => aoConfirmar(escolhidas)}>
          Trazer {escolhidas.length} personagem(ns)
        </Botao>
      }
    >
      <p className="mb-3">
        Encontramos {contas.length} personagens salvos na versão anterior. Há {MAX_SLOTS} espaços: escolha quais
        trazer. Os outros continuam guardados neste navegador.
      </p>
      <ul className="space-y-1">
        {contas.map((c) => (
          <li key={c.username}>
            <label className="flex items-center gap-2 text-texto">
              <input
                type="checkbox"
                checked={escolhidas.includes(c.username)}
                onChange={() => alternar(c.username)}
              />
              {c.username}, nível {c.nivel}
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function TelaSlots() {
  const { slots, migracao } = useEstado();
  const acoes = useAcoes();
  const arquivo = useRef(null);
  const [apagando, setApagando] = useState(null);
  const [importando, setImportando] = useState(null);

  const aoEscolherArquivo = async (e) => {
    const escolhido = e.target.files?.[0];
    e.target.value = "";
    if (escolhido) setImportando(await escolhido.text());
  };

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10">
      <header className="mb-8 text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-3 w-28" />
        <h1 className="titulo text-4xl text-destaque">MagiChill</h1>
        <p className="text-texto-2">Um RPG de turnos para jogar com calma.</p>
      </header>

      <ul className="painel" aria-label="Espaços de save">
        {slots.map((slot, numero) => (
          <LinhaSlot
            key={numero}
            numero={numero}
            slot={slot}
            acoes={acoes}
            aoApagar={(n, nome) => setApagando({ numero: n, nome })}
          />
        ))}
      </ul>

      <div className="mt-4 flex justify-center">
        <Botao variante="discreto" onClick={() => arquivo.current?.click()}>
          Importar save de um arquivo
        </Botao>
        <input ref={arquivo} type="file" accept="application/json,.json" className="hidden" onChange={aoEscolherArquivo} />
      </div>

      {apagando && (
        <Modal
          titulo="Apagar save"
          aoFechar={() => setApagando(null)}
          acoes={
            <>
              <Botao variante="discreto" onClick={() => setApagando(null)}>
                Manter
              </Botao>
              <Botao
                variante="perigo"
                onClick={() => {
                  acoes.apagarSlot(apagando.numero);
                  setApagando(null);
                }}
              >
                Apagar para sempre
              </Botao>
            </>
          }
        >
          O espaço {apagando.numero + 1} será apagado e não dá para desfazer. Se quiser guardar uma cópia, exporte antes.
        </Modal>
      )}

      {importando !== null && (
        <Modal titulo="Importar save" aoFechar={() => setImportando(null)}>
          <p className="mb-3">Em qual espaço guardar? Um espaço ocupado será substituído.</p>
          <div className="flex flex-col gap-2">
            {slots.map((slot, numero) => (
              <Botao
                key={numero}
                variante={slot.status === "vazio" ? "primario" : "secundario"}
                onClick={() => {
                  acoes.importarSave(importando, numero);
                  setImportando(null);
                }}
              >
                Espaço {numero + 1}: {slot.status === "ok" ? `substituir ${slot.resumo.nome}` : slot.status === "vazio" ? "vazio" : "substituir save danificado"}
              </Botao>
            ))}
          </div>
        </Modal>
      )}

      {migracao && <EscolhaMigracao contas={migracao.contas} aoConfirmar={acoes.escolherContasAntigas} />}
    </main>
  );
}
