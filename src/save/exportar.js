// Exportar e importar saves como arquivo JSON (SPEC.md §6.7)

import { VERSAO_SAVE, validarSave } from "./formato";
import { migrarSave } from "./migracoes";
import { resumoDoSave } from "./armazenamento";

export const FORMATO_EXPORTACAO = "magichill-save";

function paraNomeDeArquivo(texto) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "save"
  );
}

export function exportarSave(save, agora) {
  const data = new Date(agora).toISOString().slice(0, 10);
  const nome = paraNomeDeArquivo(resumoDoSave(save).nome);
  const conteudo = JSON.stringify(
    { formato: FORMATO_EXPORTACAO, versao: save.versao, exportadoEm: agora, save },
    null,
    2,
  );
  return { nomeArquivo: `magichill-${nome}-${data}.json`, conteudo };
}

// Retorna { ok: true, save } ou { ok: false, erro }
export function importarSave(texto) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "O arquivo não é um JSON válido." };
  }
  if (dados?.formato !== FORMATO_EXPORTACAO || !dados.save) {
    return { ok: false, erro: "O arquivo não é um save do MagiChill." };
  }
  if (typeof dados.save.versao !== "number" || dados.save.versao > VERSAO_SAVE) {
    return { ok: false, erro: "Save de uma versão desconhecida ou mais nova do jogo." };
  }
  try {
    const save = migrarSave(dados.save);
    const erros = validarSave(save);
    if (erros.length > 0) return { ok: false, erro: erros.join(" ") };
    return { ok: true, save };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}
