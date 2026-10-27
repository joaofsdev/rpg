# MagiChill

RPG de turnos relaxante com tema medieval/fantasia, inspirado no ritmo e na progressão do PokeChill.
O jogador monta um grupo de até 4 heróis, escolhe cada ação em batalhas curtas (ou liga o Auto
opcional, SPEC §3.13) e progride devagar com treino, expedições, culinária, coleção e equipamentos.
100% frontend: React 18 + Vite 5 + Tailwind CSS 4, save no localStorage.

**O [SPEC.md](SPEC.md) é a fonte da verdade do design** (regras, fórmulas, modelo de dados,
arquitetura, direção visual e roadmap). Este arquivo só traz regras de trabalho e convenções.

## Comandos

```bash
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (Vite)
npm run build        # build de produção em dist/
npm run lint         # ESLint
npm test             # testes (Vitest, ambiente node)
npm run test:watch   # testes em modo observação
```

- Se o Vite reclamar do binário do esbuild: `npm install-scripts approve esbuild` e `npm install`.
- O lint deve passar sem erros e sem avisos.

## Mapa da arquitetura

Estrutura-alvo (detalhes e justificativas no SPEC.md, seção de arquitetura):

```
src/
  engine/        motor de jogo em JS puro: combate (máquina de estados), progressão, itens,
                 atividades por tempo. Sem React, sem localStorage, sem Date.now/Math.random diretos.
                 Testes ficam ao lado: arquivo.test.js
  data/          dados do jogo: classes, golpes, inimigos, zonas, itens, receitas, constantes
  state/         store global, ações e seletores; único lugar que chama o motor e o save
  save/          versão do save, migrações, export/import, adaptador do localStorage
  components/
    screens/     uma tela por arquivo (Batalha, Grupo, Mapa, Taverna, Expedições, Inventário…)
    battle/      peças da batalha (sprite, barra de HP, menu de ações, número de dano)
    common/      botões, cards, modais e outros componentes reutilizáveis
  assets/
    sprites/     sprite sheets (PNG), organizadas por categoria
    audio/       efeitos e músicas
  index.css      tokens de tema (@theme), temas de cor e animações globais
```

Testes: `*.test.js` ao lado do código; auxiliares e fixtures em `__fixtures__/` da pasta.

## Convenções de código

- **Linguagem:** JavaScript + JSX. Arquivos `.js` (lógica e dados) e `.jsx` (componentes).
- **Idioma:** textos de UI em pt-BR. Identificadores novos em português, em camelCase
  (`calcularDano`, `hpAtual`). Campos legados em inglês (`name`, `attacks`, `power`) só são
  renomeados quando o arquivo for reescrito na fase correspondente.
- **Nomes de arquivo:** componentes em PascalCase (`BattleScreen.jsx`); o resto em camelCase
  (`turnOrder.js`). Ids de conteúdo em snake_case (`esqueleto_fraco`, `bola_de_fogo`).
- **Constantes:** UPPER_SNAKE_CASE (`MAX_INVENTARIO`, `TETO_OFFLINE_HORAS`) em
  `src/data/constants.js`. Nada de número mágico repetido no código.
- **Dados de jogo** (atributos, golpes, drops, receitas, textos de conteúdo) ficam em `src/data/`,
  nunca no JSX nem dentro do motor.
- **Componentes:** um componente exportado por arquivo, só função (sem classe). Componentes
  recebem dados prontos via seletores e disparam ações; não calculam regra de jogo.
- **Estilo:** classes do Tailwind e tokens do `@theme`. Cor nova vira token, não hex solto.
- **Commits:** Conventional Commits em português, minúsculo, verbo na 3ª pessoa:
  `feat: adiciona fila de turnos`, `fix: corrige migração do save v1`,
  `refactor:`, `style:`, `test:`, `docs:`, `chore:`. Um assunto por commit.

## Restrições do projeto

- Somente JavaScript com JSX. Não usar nem sugerir TypeScript.
- 100% frontend: sem backend e sem serviços pagos.
- Minimizar dependências novas e justificar cada uma (o que resolve e por que não fazer à mão)
  **antes** de instalar.
- O PokeChill (https://play-pokechill.github.io/) é referência **apenas de ritmo e progressão**.
  Não copiar código, textos, nomes nem assets (os sprites são da Nintendo/The Pokémon Company).
- Sprites e sons: só assets originais ou com licença livre (CC0/CC-BY; ex.: Kenney, OpenGameArt,
  itch.io). Registrar origem, autor, link e licença de cada um em `CREDITS.md` no mesmo commit
  em que o asset entra.
- O combate é manual por padrão. O Auto (SPEC §3.13) é opcional, ligado pelo jogador e pode ser
  parado a qualquer momento; a IA dos heróis só escolhe entre as ações legais do motor, sem
  vantagem, recurso ou recompensa extra, e não existe progresso de batalha offline.
- Não alterar o que não foi pedido na fase atual.
- Ao final de cada fase, parar e esperar aprovação antes de seguir.

## Regras de trabalho

1. Ler os arquivos envolvidos antes de alterar qualquer coisa.
2. Seguir o SPEC.md. Se o design precisar mudar, propor a alteração no SPEC.md antes de codar.
3. Antes de codar uma fase: listar os arquivos a criar/alterar e o motivo.
4. Toda mudança no formato do save exige incremento de versão e uma migração da versão
   anterior, com teste cobrindo a migração.
5. Ao concluir uma fase, marcar os itens no roadmap do SPEC.md (`- [x]`).
6. Antes de dar uma fase por concluída: `npm run build`, `npm run lint` e `npm test` passando
   sem erros.
7. Ao terminar uma fase: resumo curto do que mudou, como testar manualmente e pendências.

## O que NÃO fazer

- Lógica de combate ou de regra de jogo dentro de componentes ou de `useEffect`.
- Avançar turno com `setTimeout` na UI. O motor define o próximo estado; a UI só anima os
  eventos que o motor devolveu. Exceção: o agendador do Auto (`state/agendadorAuto.js`) usa um
  temporizador só para o ritmo: ele pede a próxima ação ao reducer, que decide tudo pelo motor.
  O Auto segue com a página oculta (sem pausar por foco ou visibilidade), no ritmo que o navegador
  permitir e sem compensar o tempo em que ela ficou parada.
- Aceitar ações do jogador enquanto uma animação está rodando.
- Dados de jogo hardcoded em JSX.
- `Math.random()` ou `Date.now()` direto no motor (receber RNG e tempo por parâmetro).
- Ler ou gravar localStorage fora de `src/save/`, e efeitos colaterais dentro de reducers ou
  durante o render.
- Mudar o formato do save sem versão e migração.
- Cronômetro de turno, punição que apague progresso ou automação de combate fora do Auto
  opcional (nada que jogue sozinho sem o jogador ligar, nem batalhas com o jogo fechado).
- Duplicar telas ou fórmulas: extrair para componente comum ou função do motor.
- Instalar dependência sem justificativa aprovada.
