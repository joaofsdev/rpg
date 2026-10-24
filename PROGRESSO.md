# Progresso do MagiChill

Situação do projeto fase a fase. O design completo está no [SPEC.md](SPEC.md) e as regras de
trabalho no [CLAUDE.md](CLAUDE.md); este arquivo resume o que já foi feito e o que vem a seguir.

**Última atualização:** 24/10/2026, ao fim da Fase 6.

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

Estado ao fim da Fase 6: 489 testes passando (22 arquivos), `npm run lint` sem erros nem
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

## Pendências conhecidas

A lista oficial está no SPEC.md, seção "Pendências conhecidas (após a Fase 6)":

- vida dos heróis da masmorra visível só na tela da masmorra;
- sem chefes exclusivos de masmorra;
- sprites aproximados (rato, fantasma, morcego, corvo, aranhas) e bases repetidas com cor;
- origem e licença de `public/logo.png` a confirmar;
- custo de renovar a loja alto em relação aos itens Comuns;
- 9 vulnerabilidades do `npm audit` em dependências de desenvolvimento.

## Como testar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 489 testes (a simulação de balanceamento leva ~20 s)
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

## Escopo da Fase 7 — Recrutamento, reserva e treino

Roadmap do SPEC.md §8; regras em §3.2, §3.8, §3.9 e §4.10.

- **Recrutamento:** mural de 3 recrutas renovado a cada 24 h, custo em ouro, novas classes
  liberadas pelos chefes; recruta chega com nível `max(1, nívelMédioDoGrupo − 3)` e conjunto Comum.
- **Grupo e reserva:** grupo de até 4 heróis, reserva até 12; herói ocupado em atividade não
  entra no grupo; o grupo precisa de pelo menos 1 herói.
- **Atividades por tempo:** infraestrutura baseada em timestamps (`inicio + duracao`, relógio
  injetado, sem depender da aba aberta, sem regredir se o relógio voltar), com o resumo
  "Bem-vindo de volta" e "Coletar tudo".
- **Treino:** de atributo (1 ponto por hora, limite = nível do herói por atributo, custo em ouro) e
  de golpe (aprender antes um golpe avançado), 1 vaga inicial e +1 depois do chefe da zona 4.
- **Fora da Fase 7:** expedições (Fase 8), cozinha (Fase 9), ferraria (Fase 10).

Critérios de aceite a cumprir (SPEC): colocar no grupo um herói em atividade aparece desabilitado
com o tempo restante; herói nível 12 treinando força por 4 h ganha +4 pontos; força de treino no
limite aparece desabilitada com "Limite 12/12"; abrir o jogo com atividades concluídas mostra o
resumo de retorno.
