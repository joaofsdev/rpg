# Progresso do MagiChill

Situação do projeto fase a fase. O design completo está no [SPEC.md](SPEC.md) e as regras de
trabalho no [CLAUDE.md](CLAUDE.md); este arquivo resume o que já foi feito e o que vem a seguir.

**Última atualização:** 25/10/2026, ao fim da Fase 11.

## Fases concluídas

| Fase | Entrega | Verificação |
|---|---|---|
| 0 | Investigação do código legado (somente leitura) | relatório na conversa |
| 1 | `CLAUDE.md`: comandos, arquitetura, convenções, restrições e regras de trabalho | revisado |
| 2 | `SPEC.md`: design completo, fórmulas, modelo de dados, arquitetura, roadmap | aprovado |
| 3 | Motor em JS puro (`src/engine/`), dados novos, save v2 com migração do formato antigo, Vitest | testes |
| 4 | MVP jogável: slots, novo jogo, mapa, grupo, inventário, batalha com sprites e animações no Cemitério | testes + navegador |
| 5 | As 10 zonas, golpes por nível e troca de golpes, bestiário, loja, Erva Revigorante, remoção do código legado | testes + navegador |
| 6 | Masmorras por andares (10), fogueiras, ganhos por andar, save v3 | testes + navegador |
| 7 | Grupo e reserva, mural de recrutas, dispensar herói, atividades por tempo, treino de atributo e de golpe, resumo "Bem-vindo de volta", save v4, calibração da economia de ouro | testes + navegador |
| 8 | Expedições com rolagens de 15 min, vagas progressivas, prévia do que foi achado, cancelar e coletar, resumo por categoria | testes + navegador |
| 9 | Cozinha na Taverna: 10 receitas, panela por tempo, refeição ativa por encontros, receita ensinada pelo chefe e vendida na loja | testes + navegador |
| 10 | Ferraria (forjar e aprimorar até +5), 10 relíquias de chefe, coleção com percentual, save v5 | testes + navegador |
| 11 | 4 temas com contraste verificado, efeitos sonoros e música com volume, revisão de acessibilidade e responsividade | testes + navegador |

Estado ao fim da Fase 11: 761 testes passando (34 arquivos), `npm run lint` sem erros nem
avisos, `npm run build` ok.

## Decisões tomadas

Decisões que não estavam no pedido original ou que mudaram o que foi aprovado. Todas estão
registradas no SPEC.md.

- **Contas viraram slots de save** (3 espaços, exportar/importar). O sistema antigo de
  usuário e senha foi removido; a chave `rpg_users` nunca é apagada. (§5.5, §6.7)
- **Mana e vigor no lugar de PP.** Vigor começa em 40 e sobe; mana começa cheia. Ataque básico e
  Defender nunca custam nada. (§4.6)
- **Companheiro inicial:** todo jogo novo ou save migrado ganha um segundo herói de outra classe;
  os dois começam com um conjunto Comum. (§3.2)
- **6 atributos** (Magia e Resistência novos); na migração, pontos de força de Mago e Bardo viram
  magia. (§3.3, §5.5)
- **Intenção dos inimigos visível** e IA por ciclo de golpes + regras. (§3.1.1)
- **O motor resolve o turno inteiro** e a interface só anima a lista de eventos; nada de
  `setTimeout` decidindo jogo. (§6.2)
- **Calibração por simulação** (§4.9): os inimigos legados eram frágeis demais; atributos foram
  normalizados por zona e ajustados até as metas (encontros ≥ 90% de vitória em 3–6 rodadas,
  chefes 60–85% em cerca de 8 rodadas).
- **Sprites:** heróis do Puny Characters, inimigos e cenário do 0x72 DungeonTilesetII, todos CC0;
  inimigos reaproveitam bases com filtro de cor em CSS. (§7.6, CREDITS.md)
- **Inventário cheio** vende automaticamente o excedente por 40%: equipamentos além dos 50 espaços
  livres e empilháveis além do limite da pilha, em batalha, masmorra e expedição. (§4.8)
- **Fase 6, chefe da masmorra:** é o chefe da própria zona fortalecido; chefes exclusivos ficaram
  fora de escopo. (§3.5, §9)
- **Fase 6, recalibração das masmorras:** a primeira versão concluía só 7–21% das descidas.
  Valores atuais: inimigos `nivelMax + floor((andar − 1) × 0,25)`, chefe `+1`, descanso de 30%
  entre andares, fogueira cura tudo. Meta 40–80% de conclusão sem itens; resultado 43–58%. (§3.5, §4.9)
- **Save v3:** a masmorra em andamento guarda vida e ganhos; migração v2 → v3 testada. (§5.5)
- **Fase 7, save v4:** `vagas` saiu do save (vagas de treino vêm do progresso: 1 + chefe da zona 4)
  e `heroi.atividade` também (a atividade do herói é lida de `save.atividades`, uma fonte só).
  Coletar ou cancelar remove a atividade, então coletar duas vezes não entrega nada. (§5.2, §5.5)
- **Fase 7, relógio que não volta:** `ultimaVisita` guarda o maior instante já visto; o motor usa
  `max(agora, ultimaVisita)`. O Provider despacha `RELOGIO` a cada 30 s com a aba visível e
  `VOLTOU_AO_JOGO` ao voltar para a aba. (§3.9, §6.6)
- **Fase 7, treino:** só heróis da reserva treinam; pontos e golpe entram ao coletar; manaMax é
  treinável por classes de mana; golpe avançado custa 2 h/200, 4 h/400, 6 h/700 ou 8 h/1.000
  ouro conforme o nível exigido (8, 16, 30, 45). (§3.8)
- **Fase 7, dispensar herói:** com confirmação; o equipamento volta ao inventário. Bloqueado para
  quem está em treino, em batalha, no grupo durante masmorra, para o último herói do grupo e
  quando o equipamento não cabe no inventário. (§3.2)
- **Fase 7, economia de ouro:** campanha simulada (2 heróis do nível 1 ao 100, zona a zona) com
  metas em "encontros de ouro": primeiro recruta na zona 1 a partir do 5º encontro (resultado: 9º
  a 15º); recruta 5–12 encontros (5,5–9,3); 1 h de treino 1–4 (1,9–3,6); golpe avançado 4–12
  (6,2–10,4). Só o treino de golpe precisou mudar (antes ia de 6 a 34 encontros). (§4.9)
- **Fase 8, expedições:** só heróis da reserva viajam; partir é grátis; a tela mostra as rolagens
  completas e o que já foi achado (mesma semente da coleta); o XP pode subir o nível na coleta.
  Meta nova na economia: 8 h de expedição rendem o ouro de 2 a 10 encontros da zona, para
  complementar o combate sem substituí-lo. O save continua na v4. (§3.6, §4.9)
- **Fase 8, resumo de retorno:** separado por categoria (Expedições, Treino), como pede §3.9.
- **Após a Fase 8, entrada de itens:** uma função só (`guardarNoInventario`) para batalha, masmorra e
  expedição; excedente vendido com aviso. Empilháveis **não** ocupam os 50 espaços (o modelo é por
  pilha); recruta chega equipado e não ocupa espaço livre. Materiais ganharam preço de referência
  (10 × número da zona). (§3.11, §4.8)
- **Após a Fase 8, economia com expedições e gastos:** dias de 15 encontros, 1 expedição de 8 h por
  vaga por dia, reserva contratada para todas as vagas e 8 h de treino por vaga quando o ouro dá.
  A meta do recruta estourou (3,4 encontros; meta 5–12) porque as expedições quase dobravam a
  renda. Recalibrado: ouro por rolagem 5 → 3, recruta 25 → 35 por nível, treino 10 → 7 por nível
  e hora. Metas novas: expedições ≤ 75% do ouro dos encontros; 1 treino de 8 h por dia entre 20% e
  90% da renda do dia. Todas as metas passam. (§4.9)
- **Fase 9, receitas:** as 3 iniciais usam ingredientes das zonas 1 a 3 (os exemplos do SPEC pediam
  ingredientes das zonas 4 a 8, impossíveis no começo). As outras 7 vêm do chefe de cada zona (4 a
  10) e da loja (uma por semana, `150 × número da zona` ouro). `receitasConhecidas` guarda só as
  aprendidas, então o save continua na v4. (§3.7, §3.11)
- **Fase 9, preparo e refeição:** ingredientes saem no início; tirar do fogo entrega as porções
  prontas e devolve os ingredientes do resto; não se come com batalha salva; o contador desce em
  vitória, derrota e fuga. Efeitos: vida máx., força e magia, defesa e resistência, recurso inicial,
  XP e ouro. (§3.7)
- **Fase 9, correção:** a validação do save rejeitava atividades sem herói, o que marcava como
  "danificado" um save com a panela no fogo. Achado no teste de navegador; agora só valida o herói
  quando a atividade tem um, com teste de regressão.
- **Fase 10, ferraria:** forjar qualquer slot e tipo com os 2 materiais da zona (principal e
  secundário) + `15 × nível máximo` ouro; o item sai no nível máximo, Incomum ou melhor. Aprimorar
  para +N custa `2N` + `N` materiais da zona do nível do item e `3 × nível × N` ouro (recalibrado
  de 5 pela meta de economia). (§3.11, §4.9)
- **Fase 10, regra do aprimoramento:** +8% por nível com **mínimo de +1** em cada bônus. O teste no
  navegador mostrou que, só com os 8%, itens Comuns (bônus 1) não mudavam ao aprimorar, o que
  quebrava o CA "+2 → +3 aumenta os bônus exibidos". Também passou a usar a soma sem erro de ponto
  flutuante (50 em +2 dava 57). Um teste da Fase 3 que registrava o comportamento antigo foi
  atualizado. (§3.11)
- **Fase 10, relíquias:** não se equipam; ter já ativa o efeito para o grupo (somado à refeição).
  Garantida na primeira vitória sobre o chefe da zona; 5% nas revanches só enquanto não tiver. O
  combate passou a receber uma lista de efeitos (refeição + relíquias). (§3.11)
- **Fase 10, coleção e save v5:** registro em toda entrada de item (inclusive o vendido na hora).
  A migração v4 → v5 preenche a coleção com o que o save tem e entrega as relíquias dos chefes já
  vencidos; a migração das contas antigas faz o mesmo com as relíquias. (§3.10, §5.5)
- **Fase 11, temas:** `src/data/temas.js` é a fonte única; o tema é do dispositivo (fora do save, sem
  migração). A tabela de §7.5 não passava em vários pares de contraste (todo o destaque do Pergaminho;
  terciário e perigo do Taverna); as cores foram ajustadas o mínimo e um teste aplica a fórmula da WCAG
  a toda cor usada como texto, nos 4 temas. A arena usa sempre o Taverna (arte escura); as cores dos
  elementos viraram um marcador ◆ ao lado do nome. (§7.5)
- **Fase 11, som:** Kenney RPG Audio e Interface Sounds (12 efeitos) e duas músicas de RandomMind,
  todas CC0 (licenças conferidas na página e no zip; registradas em CREDITS.md). A música de batalha
  ficou com "Medieval: Battle", que o SPEC deixava para esta fase. Nenhuma dependência nova. (§7.6)
- **Fase 11, revisão:** auditoria automática no navegador em todas as telas (controles sem nome,
  imagens sem alt, campos sem rótulo, abas, ids, marcos, foco por teclado e largura a 375 px).
  Correções: a Batalha ganhou `<main>`; os botões 1×/2×/3× usavam `aria-labelledby`, que trocava o
  nome dos três por "Animação" (agora `aria-describedby`); a reação a elementos no Bestiário
  transbordava o painel (2 colunas). A revisão de textos foi a das telas percorridas, sem uma
  varredura de todos os textos do jogo.
- **Fase 7, recrutas:** custo `100 + 35 × nível` (era 25, recalibrado na Fase 8); Cavaleiro, Arqueiro e Mago desde o início, Bardo,
  Assassino e Bárbaro após os chefes das zonas 1, 2 e 3 (e classes que o jogador já tem); recruta
  chega com os pontos livres do nível e entra no grupo se houver espaço. (§3.2)
- **Fase 7, grupo travado:** ninguém entra nem sai do grupo com batalha salva ou masmorra em
  andamento. (§3.2)
- **Fase 7, navegação:** abas novas Atividades (treino; expedições na Fase 8) e Taverna (mural;
  cozinha na Fase 9). No celular, "Atividades" e "Inventário" aparecem como "Ativ." e "Itens".

## Decisões, melhorias futuras e pendências

Decisões tomadas pelo autor ao aprovar a Fase 10 (25/10/2026). A lista técnica completa está no
SPEC.md, seção "Pendências conhecidas (após a Fase 10)".

### Decisões definitivas

- **Refeições só na Taverna:** comer continua exclusivo da Taverna; faz parte da preparação antes das
  aventuras. Não haverá botão "Comer" no Inventário. (§3.7)
- **Inventário:** os 50 espaços são exclusivos para equipamentos. Consumíveis, materiais,
  ingredientes e refeições não ocupam esses espaços e seguem só o limite da pilha (99 ou 999). Não
  haverá migração de save por causa disso; é o modelo que já existe. (§4.8)
- **Relíquias automáticas:** continuam não equipáveis; ter a relíquia já ativa o efeito. (§3.11)

### Melhorias futuras (registradas, não implementar agora)

- **Segunda panela:** comprada com recursos (ouro e/ou materiais). Hoje há 1 panela. (§3.7)
- **Bônus passivos no Grupo:** mostrar na tela do Grupo a soma dos efeitos ativos (relíquias e
  refeição). (§3.11)
- **Receitas na Coleção:** categoria própria, com percentual de descoberta e as receitas ainda
  desconhecidas indicadas. (§3.10)
- **Simulação econômica completa:** incluir cozinha, loja, consumíveis e os bônus das refeições
  (XP, ouro) e o impacto deles na progressão. (§4.9)

### Pendências de balanceamento (prioridade)

- **Consumo de materiais da ferraria:** simular se dá para forjar e aprimorar até +5 em cada zona
  com os materiais que o jogador junta (drops e expedições).
- **Fórmula do aprimoramento:** o mínimo de +1 por nível em cada bônus dá ganhos desproporcionais em
  atributos pequenos (bônus 1 vira 6 em +5). Revisar para garantir progressão real do item **sem**
  exigir +1 em todos os atributos por nível, preservando o CA "+2 → +3 aumenta os bônus exibidos" e
  com testes de balanceamento para itens de vários níveis e raridades. **A fórmula atual só muda
  depois de uma alternativa validada.**

### Outras pendências conhecidas

- vida dos heróis da masmorra visível só na tela da masmorra;
- sem chefes exclusivos de masmorra;
- sprites aproximados (rato, fantasma, morcego, corvo, aranhas) e bases repetidas com cor;
- origem e licença de `public/logo.png` a confirmar;
- custo de renovar a loja alto em relação aos itens Comuns;
- 9 vulnerabilidades do `npm audit` em dependências de desenvolvimento;
- sem como reordenar o grupo;
- treinar exige tirar o herói do grupo (com 2 heróis, sobra 1 lutando até contratar alguém);
- relíquias não aparecem na tela de batalha;
- áudio: músicas com 5,5 MB (sem codificador para reduzir), efeitos em OGG (Safari antigo não toca),
  efeitos escolhidos pelo nome e ainda sem revisão por ouvido.

## Como testar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 761 testes (a simulação de balanceamento leva ~20 s)
npm run lint
npm run build
```

### Jogo novo
1. Em um espaço vazio, "Começar nova jornada", escolha a classe e o nome.
2. Mapa → Cemitério Antigo → Explorar. Na batalha: escolha um golpe, passe o mouse no alvo para
   ver a prévia e clique para atacar (atalhos: 1–4, B, D, Esc, setas, Enter; espaço adianta a
   animação).
3. Recarregue a página no meio da batalha: "Continuar" → "Retomar" volta ao mesmo turno.

### Save antigo (fixture `src/save/__fixtures__/rpgUsersV1.json`)
O fixture tem duas contas do formato antigo:

- **aldric**: Cavaleiro nível 14, 1.234 ouro, 6 itens, Cemitério concluído, Minas liberadas e a
  masmorra Cripta Esquecida já concluída (bom para testar masmorras e a zona 2);
- **mira**: Mago nível 3, sem itens.

Para carregar (isto **apaga os saves deste navegador**), no console do navegador:

```js
localStorage.clear();
localStorage.setItem("rpg_users", JSON.stringify(/* cole aqui o conteúdo do arquivo */));
location.reload();
```

A migração roda sozinha: aparecem os espaços "aldric" e "mira". Com "aldric":
Mapa → Cemitério Antigo → "Entrar na masmorra" → "Descer para o andar 1". Vença o andar,
volte para a masmorra, recarregue a página e use "Continuar a descida": o andar e a vida são os
mesmos. Loja e Bestiário ficam em **Mais**.

### Grupo, treino e taverna (Fase 7)
Para ter ouro e um herói de nível alto, edite o save no console (com o jogo aberto no slot 0,
volte aos espaços de save antes, para não ser sobrescrito):

```js
const s = JSON.parse(localStorage.getItem("magichill:slot:0"));
s.ouro = 50000;
Object.values(s.herois)[1].nivel = 12;
localStorage.setItem("magichill:slot:0", JSON.stringify(s));
location.reload();
```

1. **Grupo:** escolha o 2º herói e "Mover para a reserva". Tentar tirar o último herói mostra
   "O grupo precisa de pelo menos 1 herói."
2. **Atividades:** em "Novo treino", Força → "4h · 480 ouro". O cartão mostra "Faltam 4h"; na tela
   Grupo, "Colocar no grupo" fica desabilitado com "Em treino (termina em 4h)".
3. **Bem-vindo de volta:** volte aos espaços de save e, no console, recue o início do treino:
   ```js
   const s = JSON.parse(localStorage.getItem("magichill:slot:0"));
   const a = Object.values(s.atividades)[0]; a.inicio -= 5 * 3600000; s.ultimaVisita -= 5 * 3600000;
   localStorage.setItem("magichill:slot:0", JSON.stringify(s)); location.reload();
   ```
   "Continuar" abre o modal com "Você ficou fora por 5h" e "4 pontos de Força (+8)".
   "Coletar tudo" entrega os pontos (Força +8 na tela Grupo).
4. **Limite:** com `pontosTreino.forca = 12` num herói nível 12, Força aparece com "Limite 12/12" e
   os botões desabilitados. A aba "Golpe" lista os golpes avançados com o nível exigido.
5. **Taverna:** 3 recrutas de classes diferentes; contratar cobra o ouro e o recruta entra no
   grupo (ou na reserva, se o grupo estiver cheio ou em masmorra).
6. **Dispensar:** na tela Grupo, escolha um herói e "Dispensar …" → confirmação → o aviso diz
   quantos equipamentos voltaram ao inventário. Com um herói só no grupo, o botão dele fica
   desabilitado com "O último herói do grupo não pode ser dispensado."

### Expedições (Fase 8)
1. Com um herói na reserva, **Atividades → Nova expedição**: escolha o herói, a zona (as acima do
   nível dele aparecem com "exige nível N") e "2h · 8 rolagens".
2. Na tela Grupo, "Colocar no grupo" fica desabilitado com "Em expedição (termina em 2h)" e
   "Dispensar" com "Em expedição. Colete ou cancele a expedição antes."
3. Volte aos espaços de save e recue 50 min no console:
   ```js
   const s = JSON.parse(localStorage.getItem("magichill:slot:0"));
   const a = Object.values(s.atividades)[0]; a.inicio -= 50 * 60000; s.ultimaVisita -= 50 * 60000;
   localStorage.setItem("magichill:slot:0", JSON.stringify(s)); location.reload();
   ```
   O cartão mostra "3/8 rolagens" e "Até agora: … · 9 ouro · … XP". "Cancelar" → "Voltar agora"
   entrega exatamente isso.
4. Com uma expedição de 1 h e um treino de 4 h, recue 1 h (mesmo comando, `60 * 60000` em todas
   as atividades): "Continuar" abre o resumo com "Expedições: pronto para coletar" e "Treino de
   …: faltam 3h" em andamento.

### Cozinha (Fase 9)
Para ter ingredientes, no console (fora do slot, nos espaços de save):

```js
const s = JSON.parse(localStorage.getItem("magichill:slot:0"));
s.inventario.itens.erva_da_nevoa = 7;
localStorage.setItem("magichill:slot:0", JSON.stringify(s)); location.reload();
```

1. **Taverna → Cozinha:** em Ensopado do Coveiro, as porções 4 e 5 ficam desabilitadas (7 ervas só
   dão 3). Escolha 3 → "Preparar (30 min)". A panela mostra "0/3 porções prontas" e as ervas caem
   para 1.
2. **Voltar 40 min depois:** recue o início da atividade e `ultimaVisita` em `40 * 60000` (mesmo
   comando das expedições). "Continuar" mostra "Cozinha: pronto para coletar" com
   "Panela: Ensopado do Coveiro ×3". "Coletar tudo" avisa "Ensopado do Coveiro: 3 porções prontas."
3. **Comer:** em "Pratos prontos", "Comer". A Taverna e o mapa mostram "Vida máxima +10%, mais 5
   encontros". Explore, fuja do encontro: o contador cai para 4.
4. **Trocar:** com outro prato no inventário (`s.inventario.itens.sopa_de_alga = 1`), "Comer" pede
   confirmação ("Trocar a refeição?").
5. **Loja:** "Receita da semana" fica vazia com só a zona 1 aberta; com zonas desbloqueadas aparece
   uma receita para aprender.

### Ferraria, relíquias e coleção (Fase 10)
Para ter materiais e ouro, no console (nos espaços de save):

```js
const s = JSON.parse(localStorage.getItem("magichill:slot:0"));
s.ouro = 20000; s.inventario.itens.osso_antigo = 200; s.inventario.itens.pano_mortuario = 200;
localStorage.setItem("magichill:slot:0", JSON.stringify(s)); location.reload();
```

1. **Mais → Coleção:** um jogo novo já mostra o conjunto Comum e os consumíveis iniciais, e 0/10
   relíquias.
2. **Mais → Ferraria → Forjar:** escolha zona, peça e tipo; o custo mostra "8 Osso Antigo",
   "4 Pano Mortuário" e "150 ouro" para uma arma do Cemitério. "Forjar" avisa "Forjado: … (Incomum)"
   ou melhor.
3. **Aprimorar:** escolha um item, "Aprimorar para +1", "+2", "+3". A tabela mostra o bônus atual e
   o próximo; de +2 para +3 todos os bônus sobem (inclusive nos itens Comuns). O nome ganha "+3"
   no Inventário e no Grupo.
4. **Relíquia de save antigo:** no console, `s.versao = 4; s.colecao = { equipamentos: {}, itens:
   [], reliquias: [] }; s.progresso.zonas.cemiterio.chefeDerrotado = true;` e recarregue. A
   Coleção mostra "Coroa do Guardião — Dano de luz +10%" e o resto preenchido.
5. **Relíquia em jogo:** vença o Guardião da Cripta pela primeira vez; o resultado mostra
   "Relíquia obtida: Coroa do Guardião".

### Temas, som e acessibilidade (Fase 11)
1. **Mais → Configurações → Tema de cor:** Taverna, Pergaminho, Bosque e Noite trocam na hora e
   continuam depois de recarregar. Num navegador com o sistema em tema claro, o primeiro acesso já
   abre no Pergaminho.
2. **Batalha no Pergaminho:** a arena continua escura e legível; no menu, o elemento do golpe aparece
   como "◆ fogo" em texto escuro.
3. **Som:** depois do primeiro clique, a música da cidade toca; ao entrar numa batalha troca para a
   de batalha. Golpes, erros, curas e nocautes têm som; o resultado toca vitória ou derrota.
   "Volume dos efeitos" e "Volume da música" vão de 0 (mudo) a 100%.
4. **Teclado:** Tab percorre os botões com contorno visível; na batalha, 1–4, B, D, setas, Enter e Esc
   continuam funcionando.
5. **Celular (375 px):** nenhuma tela rola na horizontal.

## Próximos passos

O roadmap do SPEC §8 termina na Fase 11. O que vem depois é decisão do autor; as prioridades já
registradas são as **pendências de balanceamento** (fórmula do aprimoramento e simulação de consumo de
materiais da ferraria), seguidas das melhorias futuras listadas acima.
