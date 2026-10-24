# Progresso do MagiChill

Situação do projeto fase a fase. O design completo está no [SPEC.md](SPEC.md) e as regras de
trabalho no [CLAUDE.md](CLAUDE.md); este arquivo resume o que já foi feito e o que vem a seguir.

**Última atualização:** 24/10/2026, ao fim da Fase 7.

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

Estado ao fim da Fase 7: 566 testes passando (28 arquivos), `npm run lint` sem erros nem
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
- **Inventário cheio** vende automaticamente o equipamento excedente por 40%. (§4.8)
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
- **Fase 7, recrutas:** custo `100 + 25 × nível`; Cavaleiro, Arqueiro e Mago desde o início, Bardo,
  Assassino e Bárbaro após os chefes das zonas 1, 2 e 3 (e classes que o jogador já tem); recruta
  chega com os pontos livres do nível e entra no grupo se houver espaço. (§3.2)
- **Fase 7, grupo travado:** ninguém entra nem sai do grupo com batalha salva ou masmorra em
  andamento. (§3.2)
- **Fase 7, navegação:** abas novas Atividades (treino; expedições na Fase 8) e Taverna (mural;
  cozinha na Fase 9). No celular, "Atividades" e "Inventário" aparecem como "Ativ." e "Itens".

## Pendências conhecidas

A lista oficial está no SPEC.md, seção "Pendências conhecidas (após a Fase 7)":

- vida dos heróis da masmorra visível só na tela da masmorra;
- sem chefes exclusivos de masmorra;
- sprites aproximados (rato, fantasma, morcego, corvo, aranhas) e bases repetidas com cor;
- origem e licença de `public/logo.png` a confirmar;
- custo de renovar a loja alto em relação aos itens Comuns;
- 9 vulnerabilidades do `npm audit` em dependências de desenvolvimento;
- sem como reordenar o grupo;
- treinar exige tirar o herói do grupo (com 2 heróis, sobra 1 lutando até contratar alguém);
- a calibração da economia mede só a renda (gastos não entram); reavaliar com expedições e cozinha.

## Como testar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 566 testes (a simulação de balanceamento leva ~20 s)
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

## Escopo da Fase 8 — Expedições

Roadmap do SPEC.md §8; regras em §3.6 e §4.10.

- **Expedições:** heróis da reserva viajam para uma zona desbloqueada (nível ≥ `zona.nivelMin`) por
  30 min, 1 h, 2 h, 4 h ou 8 h; recompensas por rolagens de 15 min com semente fixada no início
  (`tabelaExpedicao` da zona, ouro e XP de §4.10).
- **Vagas:** 1 no início, +1 após o chefe da zona 3 e +1 após o da zona 6 (máx. 3), calculadas pelo
  progresso como as de treino.
- **Coletar e cancelar:** recompensas só entram ao coletar; cancelar entrega as rolagens completas.
  A infraestrutura da Fase 7 já cobre isso: basta registrar o tipo `expedicao` em
  `engine/coleta.js` e acrescentar a seção na tela Atividades e no resumo de retorno.
- **Fora da Fase 8:** cozinha (Fase 9), ferraria (Fase 10).

Critérios de aceite a cumprir (SPEC §3.6): expedição de 2 h vista depois de 3 h entrega 8 rolagens;
cancelar uma de 2 h após 50 min entrega 3 rolagens; coletar duas vezes entrega uma vez só; relógio
voltando não regride o progresso.
