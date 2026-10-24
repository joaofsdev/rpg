# MagiChill — Especificação do Jogo

> Fonte da verdade do design. Mudanças de design são propostas aqui **antes** de qualquer código.
> Valores numéricos são iniciais e serão calibrados com testes de simulação do motor (§4.9).

**Status:** Fase 7 concluída — aguardando aprovação.

---

## 1. Visão geral e pilares

MagiChill é um RPG de turnos medieval/fantasia para jogar com calma. O jogador forma um grupo de
até 4 heróis, enfrenta encontros curtos escolhendo cada ação manualmente e, fora do combate, deixa
heróis treinando, em expedições ou cozinhando enquanto está longe do jogo.

| Pilar | O que significa na prática |
|---|---|
| **Combate tático manual** | Toda ação de herói é escolhida pelo jogador. Ordem de turnos visível, intenções dos inimigos visíveis, fraquezas elementais, status e recursos (mana/vigor). Sem batalha automática, sem repetir automaticamente. |
| **Ritmo relaxante** | Nenhum cronômetro. A batalha espera o jogador para sempre e pode ser deixada e retomada a qualquer momento. Animações aceleráveis. Encontros de 1 a 3 inimigos, 3 a 6 rodadas. |
| **Progressão longa** | Níveis com curva crescente, treino limitado pelo nível, bestiário com marcos, coleção, ferraria e relíquias. Sempre há um objetivo de médio e de longo prazo. |
| **Sem punição dura** | Derrota devolve o grupo à cidade com tudo o que já ganhou. Nada é perdido, nada expira enquanto o jogador está fora. |
| **Interface calma** | Paleta suave, temas selecionáveis, transições curtas, informação clara (HP, recurso, status, ordem). |

---

## 2. Loop principal

```
          ┌─────────────────────────── Cidade (hub) ───────────────────────────┐
          │ Grupo · Inventário · Loja · Ferraria · Taverna · Quartel · Mural   │
          └──────┬───────────────────────────────┬─────────────────────────────┘
                 │ escolher zona                 │ deixar heróis da reserva em
                 ▼                               ▼ treino / expedição / cozinha
   Zona: encontros (1–3 inimigos)          Atividades por tempo real
      ├─ após N vitórias → Chefe da zona   (resumo ao voltar)
      │     └─ vitória → próxima zona + masmorra liberada
      └─ Masmorra (5 andares + chefe) → recompensas raras
   Recompensas: XP, ouro, equipamentos, materiais, ingredientes, entradas no bestiário
   Derrota → volta à Cidade mantendo os ganhos
```

**Sessão típica (5–15 min):** coletar atividades concluídas → comer uma refeição → 3 a 6 encontros
→ equipar drops / distribuir pontos → mandar a reserva para novas atividades → sair.

---

## 3. Sistemas

Cada sistema traz descrição, regras, dados e critérios de aceite (CA). Os CA são verificáveis
manualmente ou por teste automatizado.

### 3.1 Combate por turnos

**Descrição.** Grupo (1–4 heróis) contra 1–3 inimigos, visão lateral (heróis à esquerda, inimigos à
direita). A batalha é dividida em **rodadas**; em cada rodada todos os combatentes vivos agem uma
vez, em ordem de velocidade.

**Regras.**
1. **Ordem de turnos:** no início de cada rodada, ordenar os combatentes vivos por velocidade efetiva
   (decrescente). Desempate: maior velocidade base → heróis antes de inimigos → posição no grupo.
   Sem aleatoriedade. Mudanças de velocidade valem a partir da rodada seguinte.
2. **Barra de ordem:** mostra a rodada atual e a próxima, com retrato de cada combatente.
3. **Turno do herói — ações:**
   - **Golpe**: um dos 4 golpes equipados, ou o **Ataque básico** (sempre disponível, custo 0).
   - **Defender**: até o próximo turno do herói, dano recebido ×0,5; recupera recurso (§4.6).
   - **Item**: usa um consumível do inventário em um alvo válido. Consome o turno.
   - **Fugir**: ver regra 9.
4. **Recursos:** cada classe usa **mana** ou **vigor** (§4.6). Golpe sem recurso suficiente fica
   desabilitado, com o custo visível em destaque.
5. **Alvos:** cada golpe declara `alvo`: `inimigo`, `todosInimigos`, `aliado`, `todosAliados`,
   `proprio`. Alvo único exige escolha; os demais pedem só confirmação.
6. **Elementos:** físicos — `corte`, `impacto`, `perfuracao`; mágicos — `fogo`, `gelo`, `raio`,
   `luz`, `sombra`. Cada inimigo declara `fraquezas` (×1,5), `resistencias` (×0,5) e `imunidades`
   (×0). Fraquezas começam ocultas ("?") e são reveladas no bestiário ao acertar o elemento.
7. **Intenção dos inimigos:** cada inimigo mostra o ícone e o alvo da próxima ação antes de agir
   (definida pela IA, §3.1.1). Golpes fortes de chefe mostram "Preparando…" um turno antes.
8. **Status:** ver §4.5. Ícones com turnos restantes aparecem sob cada combatente.
9. **Fugir:** em encontros comuns sempre funciona (sem recompensas do encontro; o que já foi ganho
   antes fica). Contra chefes fica desabilitado com o motivo. Em masmorra vira "Sair da masmorra".
10. **Nocaute:** herói com 0 HP fica nocauteado e pula os turnos. Todos os heróis nocauteados →
    derrota. Ao fim de qualquer batalha, HP e recurso de todos são restaurados (fora de masmorra).
11. **Pausa e retomada:** não há tempo correndo. O botão **Sair** volta à cidade e mantém a
    batalha salva. O mapa mostra "Batalha em andamento — Retomar". Enquanto ela existir, grupo e
    equipamentos dos heróis envolvidos ficam travados (com cadeado e explicação).
12. **Animações:** enquanto a fila de animação toca, nenhuma ação do jogador é aceita. Clicar/tocar
    na arena adianta a fila até o fim. Velocidade 1×/2×/3× nas configurações e na própria batalha.
13. **Fim:** vitória → tela de resultados (XP, ouro, drops, níveis ganhos). Derrota → tela calma
    "O grupo recuou para a cidade" com os ganhos mantidos → Cidade.

**Dados.** Classe, Golpe, Inimigo, Zona, estado de batalha (§5).

**CA.**
- Ao selecionar um golpe sem mana/vigor suficiente, ele aparece desabilitado com o custo visível.
- Com Inimigo A (vel. 30), Inimigo B (vel. 22, base 22), Herói X (vel. 22, base 20) e Herói Y
  (vel. 22, base 18), a ordem é A → B → X → Y; com B e X ambos de base 22, X vem antes de B.
  Recarregar a página não muda a ordem.
- Ao passar o mouse (ou tocar uma vez) em um alvo válido, aparece a prévia: faixa de dano,
  chance de acerto e "Fraco!"/"Resiste" se a afinidade já foi descoberta.
- Durante a animação de um golpe, botões de ação ficam desabilitados e cliques não geram ação.
- Fechar a aba no turno do herói 2 e reabrir o jogo, entrar no slot e clicar "Retomar" volta ao
  mesmo turno do herói 2, com o mesmo HP, recurso, status e intenções.
- Contra um chefe, "Fugir" está desabilitado com o texto "Não é possível fugir de um chefe".
- Após uma derrota, ouro e XP ganhos nos encontros anteriores continuam no save.
- Nenhum timer avança turnos: deixar a batalha aberta 10 minutos sem interagir não muda nada.

#### 3.1.1 IA dos inimigos

Simples, previsível e definida nos dados de cada inimigo:
- `padrao`: lista de golpes repetida em ciclo (ex.: `[mordida, mordida, enxame]`).
- `regras`: lista ordenada de exceções avaliadas antes do padrão, cada uma com `condicao` e
  `golpe` — condições disponíveis: `hpProprioAbaixo(%)`, `aliadoAbaixo(%)`, `rodadaMultiplaDe(n)`,
  `semUsarHa(n turnos)`.
- `alvo` do golpe: `aleatorio` (RNG da batalha), `menorHp`, `maiorHp`, `primeiro`, `todos`.
  **Provocação** sempre sobrepõe alvos únicos.
- A intenção é calculada quando o turno anterior do inimigo termina e mostrada ao jogador. Se o alvo
  ficar inválido (nocaute), o alvo é recalculado pela mesma regra no momento da ação.

**CA.** Dado o mesmo estado e a mesma semente, a IA escolhe sempre a mesma ação (teste unitário).

### 3.2 Grupo e heróis

**Descrição.** Até 4 heróis ativos no grupo; os demais ficam na reserva e podem fazer atividades.

**Regras.**
- Novo jogo: o jogador escolhe 1 de 3 classes sorteadas e dá um nome ao herói; recebe também um
  **companheiro** de outra classe (sorteada), para que o combate em grupo exista desde o início.
  Os dois começam com um conjunto Comum de nível 1 compatível com a classe.
- Recrutamento (Fase 7): mural da taverna oferece 3 recrutas, renovados a cada 24 h; custo em ouro;
  novas classes de recruta desbloqueiam com chefes de zona. Recruta chega com nível =
  `max(1, nivelMedioDoGrupo − 3)` e equipamento Comum do nível.
  - Custo: `100 + 25 × nívelDoRecruta` ouro (125 no nível 1, 775 no nível 27).
  - Classes no mural: Cavaleiro, Arqueiro e Mago desde o início; Bardo após o chefe da zona 1,
    Assassino após o da zona 2 e Bárbaro após o da zona 3. Classes que o jogador já tem no save
    também aparecem. O mural sorteia 3 classes diferentes e nomes que não estão em uso.
  - Nível e custo são calculados na hora (acompanham o grupo enquanto o mural está no ar).
  - O recruta chega com os pontos livres do nível (`3 × (nível − 1)`) para distribuir.
  - Entra no grupo se houver espaço e o grupo não estiver travado; senão vai para a reserva.
  - Recruta contratado fica marcado no mural até a próxima renovação. Não há renovação paga.
- Máximo de heróis no save: 12 (constante).
- Herói ocupado (atividade em andamento ou concluída e não coletada) não pode estar no grupo; o
  grupo precisa de ≥ 1 herói.
- O grupo fica travado (ninguém entra nem sai) enquanto houver batalha salva ou masmorra em
  andamento, porque a vida guardada da masmorra é por herói.
- Reserva: todos os heróis fora do grupo. Heróis da reserva distribuem pontos, trocam golpes e
  equipamento normalmente (o inventário lista o grupo e depois a reserva).
- **Dispensar herói** (tela Grupo, com confirmação): o herói sai do save para sempre e o
  equipamento dele volta ao inventário. Não pode dispensar quem está em treino (ou outra
  atividade), em batalha salva, no grupo durante uma masmorra, o último herói do grupo, nem quando
  o equipamento dele não cabe no inventário (50 itens livres).
- Cada herói tem: classe, nível, XP, pontos livres, pontos distribuídos, pontos de treino,
  golpes aprendidos, 4 golpes equipados, equipamento em 5 slots.
- Pontos livres (3 por nível) podem ser distribuídos a qualquer momento na tela Grupo — não há
  tela obrigatória de level up. Redistribuir custa ouro (`50 × nível`).

**CA.**
- Tentar colocar no grupo um herói em expedição mostra o botão desabilitado com "Em expedição
  (termina em 1h12)" (Fase 7: o mesmo vale para treino, "Em treino (termina em 1h12)").
- Distribuir 1 ponto em força atualiza imediatamente o atributo exibido em +2.
- Dispensar um herói com 5 itens equipados deixa os 5 itens livres no inventário; o último herói
  do grupo mostra "Dispensar" desabilitado com "O último herói do grupo não pode ser dispensado."

### 3.3 Classes

As 6 classes atuais permanecem, agora com 6 atributos e recurso.

| Classe | Recurso | Vida | Força | Magia | Defesa | Resist. | Veloc. | Mana base | Passivo |
|---|---|---|---|---|---|---|---|---|---|
| Cavaleiro | vigor | 140 | 16 | 4 | 20 | 12 | 8 | — | Dano recebido −10% |
| Arqueiro | vigor | 90 | 18 | 6 | 8 | 8 | 22 | — | +15% chance de crítico |
| Mago | mana | 75 | 6 | 26 | 5 | 14 | 14 | 60 | Golpes com poder ≥ 30 causam +20% |
| Assassino | vigor | 88 | 22 | 6 | 10 | 8 | 26 | — | Primeiro golpe de dano na batalha +30% |
| Bardo | mana | 110 | 10 | 16 | 12 | 14 | 18 | 40 | Fim do turno: 20% de chance de restaurar 8 de recurso a um aliado |
| Bárbaro | vigor | 160 | 25 | 2 | 12 | 6 | 10 | — | +3 Força a cada 20% de HP perdido |

Armas e pesos de armadura permitidos: mantidos de `src/data/classes.js`.

**Golpes iniciais** (derivados dos ataques atuais; `F` = físico, `M` = mágico, `S` = suporte):

| Classe | Golpe | Tipo | Elemento | Poder | Custo | Alvo | Efeito |
|---|---|---|---|---|---|---|---|
| todas (vigor) | Ataque básico | F | por arma* | 10 | 0 | inimigo | +10 vigor extra |
| Mago, Bardo | Faísca | M | raio | 8 | 0 | inimigo | — |
| Cavaleiro | Golpe Poderoso | F | corte | 25 | 35 | inimigo | — |
| Cavaleiro | Postura de Escudo | S | — | — | 20 | próprio | Proteção 2t |
| Cavaleiro | Investida | F | impacto | 15 | 15 | inimigo | 20% Atordoado |
| Cavaleiro | Provocar | S | — | — | 15 | próprio | Provocação 2t, Defesa +8 por 3t |
| Arqueiro | Flecha Certeira | F | perfuração | 18 | 10 | inimigo | precisão 100 |
| Arqueiro | Tiro Duplo | F | perfuração | 10 ×2 | 20 | inimigo | 2 acertos independentes |
| Arqueiro | Chuva de Flechas | F | perfuração | 14 | 40 | todosInimigos | — |
| Arqueiro | Recuar | S | — | — | 10 | próprio | Velocidade +6 por 2t, Evasão 1t |
| Mago | Bola de Fogo | M | fogo | 28 | 12 | inimigo | 25% Queimadura |
| Mago | Relâmpago | M | raio | 22 | 8 | inimigo | — |
| Mago | Escudo Arcano | S | — | — | 10 | aliado | Proteção 2t |
| Mago | Explosão | M | fogo | 40 | 30 | todosInimigos | — |
| Assassino | Golpe Furtivo | F | corte | 26 | 35 | inimigo | +25% crítico |
| Assassino | Lâmina Envenenada | F | corte | 12 | 15 | inimigo | 70% Veneno |
| Assassino | Esquivar | S | — | — | 15 | próprio | Evasão 2t |
| Assassino | Lâmina Dupla | F | corte | 12 ×2 | 25 | inimigo | 2 acertos independentes |
| Bardo | Acorde Letal | M | luz | 20 | 6 | inimigo | — |
| Bardo | Canção de Cura | S | — | — | 14 | todosAliados | cura 20% da vida máx. |
| Bardo | Melodia Dissonante | M | sombra | 8 | 12 | todosInimigos | 60% Lentidão |
| Bardo | Riff Devastador | M | raio | 34 | 20 | inimigo | — |
| Bárbaro | Fúria Selvagem | F | corte | 28 | 30 | inimigo | — |
| Bárbaro | Berserker | F | impacto | 38 | 20 | inimigo | custa também 10% da vida máx. (não nocauteia: mín. 1) |
| Bárbaro | Grito de Guerra | S | — | — | 15 | próprio | Força +8 por 3t |
| Bárbaro | Golpe Devastador | F | impacto | 40 | 50 | inimigo | — |

\* Elemento do ataque básico pela arma equipada: espada/katana/adaga/machado → corte;
maça/maça pesada/machado grande → impacto; arco/besta/lança → perfuração; sem arma → impacto.

**Golpes avançados (Fase 5):** cada classe ganha +4 golpes, aprendidos nos níveis 8, 16, 30 e 45
(ou antes, via treino, §3.8). A lista de golpes por classe é definida em dados na Fase 5 seguindo o
formato acima. Exemplo: Mago — *Lança de Gelo* (M, gelo, 30, 14, inimigo, 30% Lentidão), nível 8.

### 3.4 Zonas e chefes

**Descrição.** As 10 zonas atuais (níveis 1–100, de 10 em 10) são mantidas, com seus inimigos e
chefes. Cada zona ganha encontros, fraquezas, IA, drops e uma masmorra associada.

**Regras.**
- Encontro: sorteado da lista `encontros` da zona (pesos), 1–3 inimigos.
- Nível dos inimigos: `clamp(nivelMedioGrupo + rng(−1..+1), zona.nivelMin, zona.nivelMax)`.
- **Chefe da zona**: disponível após `encontrosParaChefe` vitórias (padrão 10) — não depende mais
  do nível do jogador. Nível do chefe = `zona.nivelMax`.
- Vencer o chefe: marca a zona como concluída, desbloqueia a próxima zona e a masmorra da zona.
- Zonas concluídas continuam jogáveis (farm de materiais e bestiário). Chefe pode ser enfrentado
  de novo; relíquia só cai garantida na primeira vitória.

**Conteúdo da zona do MVP — Cemitério Antigo (nv 1–10):**

| Inimigo | Vida | For | Mag | Def | Res | Vel | Fraco | Resiste | Golpes (padrão) |
|---|---|---|---|---|---|---|---|---|---|
| Esqueleto Errante | 320 | 18 | 4 | 5 | 4 | 18 | impacto, luz | perfuração, sombra | Golpe Ossudo (corte 10), Arranhão (corte 7) — `[ossudo, arranhão, arranhão]`, alvo aleatório |
| Zumbi Rastejante | 400 | 23 | 4 | 8 | 4 | 4 | fogo, luz | sombra (imune a Veneno) | Mordida Podre (corte 12, 30% Veneno), Garras Infectas (corte 9) — alvo menorHp |
| Rato de Tumba | 200 | 22 | 0 | 4 | 3 | 22 | fogo, impacto | — | Mordida Rápida (perf. 9), Enxame (perf. 14) — `[mordida, mordida, enxame]` |
| Fantasma Menor | 260 | 7 | 25 | 3 | 12 | 18 | luz, raio | corte, impacto, perfuração | Toque Gélido (gelo M 13, 20% Lentidão), Lamento (sombra M 16, Fraqueza 2t) |
| Coveiro Maldito | 460 | 29 | 4 | 10 | 6 | 10 | raio | — | Pá Enferrujada (impacto 11), Golpe Pesado (impacto 15, telegrafado) — `[pá, pá, pesado]` |
| **Chefe:** Guardião da Cripta | 1125 | 38 | 25 | 14 | 10 | 10 | impacto, luz | corte, sombra | Espada Enferrujada (corte 16), Chuva de Ossos (impacto 12, todos), Grito dos Mortos (sombra M 24 + Fraqueza 2t, telegrafado), Regeneração Necrótica (cura 8%) — padrão `[espada, chuva, espada, grito]`; regra: `hpProprioAbaixo(50) e semUsarHa(3)` → regeneração |

Encontros (peso): rato (3), rato+rato (2), esqueleto (3), esqueleto+rato (2), zumbi (2),
zumbi+esqueleto (2), fantasma (2), fantasma+rato (1), coveiro (2), coveiro+zumbi (1),
esqueleto+esqueleto+rato (1).

Drops por inimigo: Osso Antigo (material, 40%), Pano Mortuário (material, 25%), Erva da Névoa
(ingrediente, 20%), Poção Pequena (5%), equipamento (8%, §4.8).

**CA.**
- Com o grupo de nível médio 4 no Cemitério, todos os inimigos gerados têm nível entre 3 e 5.
- Após a 10ª vitória na zona, o mapa mostra o chefe disponível; antes, mostra "7/10 encontros".
- Vencer o Guardião desbloqueia "Minas Profundas" e a masmorra "Cripta Esquecida".

### 3.5 Masmorras por andares

**Descrição.** Cada zona tem uma masmorra (as 10 atuais, na mesma ordem). 5 andares com um
encontro cada e um chefe no 6º.

**Regras.**
- Inimigos dos andares: nível `zona.nivelMax + floor((andar − 1) × 0,25)`; chefe:
  `zona.nivelMax + 1` (valores calibrados na Fase 6, §4.9).
- A vida **não** volta cheia entre andares; o recurso volta. Depois de cada andar sem fogueira, um
  descanso curto cura 30% da vida máxima dos heróis de pé. Fogueira após o 2º e o 4º andar: cura
  toda a vida dos heróis de pé e levanta os caídos com 25%.
- Recompensas acumuladas na masmorra entram no save ao fim de cada andar.
- "Sair da masmorra" (entre andares ou como Fugir) mantém as recompensas e recomeça do andar 1 na
  próxima entrada. Derrota: idem.
- Chefe da masmorra: 1 equipamento Lendário do nível (compatível com algum herói do grupo) +
  materiais raros. Melhor andar alcançado fica registrado.
- O chefe da masmorra é o chefe da própria zona, fortalecido (`zona.nivelMax + 1`). Chefes
  exclusivos de masmorra ficam fora de escopo por enquanto (§9).
- Encontros dos andares vêm da tabela de encontros da zona.
- Entre os andares o jogador vê a tela da masmorra: andar atual, vida do grupo, ganhos
  acumulados, botões "Descer para o andar N" e "Sair da masmorra". Pode trocar equipamento
  e golpes entre andares; a vida guardada é limitada à nova vida máxima.
- Ao entrar, o grupo começa com vida cheia. Heróis caídos continuam caídos no andar seguinte
  até uma fogueira ou uma Erva Revigorante.
- "Materiais raros" do chefe da masmorra: a tabela de drops do chefe é rolada duas vezes.

**CA.**
- Sair após o 3º andar mantém no inventário tudo que caiu nos andares 1–3.
- Após o 2º andar, a fogueira aparece e cura toda a vida de cada herói de pé.
- Um herói que terminou o 1º andar com 40% de vida começa o 2º andar com 70% (40% + descanso).
- Vencer o chefe marca a masmorra como concluída (melhor andar 6) e entrega 1 Lendário que
  algum herói do grupo pode usar.
- Fechar o jogo entre andares e voltar mostra a mesma tela da masmorra, no mesmo andar e com
  a mesma vida.

### 3.6 Expedições

**Descrição.** Heróis da reserva viajam para uma zona desbloqueada e coletam recursos por tempo
real, mesmo com o jogo fechado.

**Regras.**
- Requisitos: zona desbloqueada; nível do herói ≥ `zona.nivelMin`; herói livre.
- Duração escolhida: 30 min, 1 h, 2 h, 4 h ou 8 h (**teto: 8 h**).
- 1 vaga de expedição no início; +1 após o chefe da zona 3; +1 após o da zona 6 (máx. 3).
- Recompensas calculadas por **rolagens de 15 min** (§4.10), com semente fixada no início
  (recarregar não muda o resultado).
- Concluída quando `agora ≥ inicio + duracao`. Tempo além da duração não gera nada.
- Cancelar: o herói volta na hora com as rolagens já completas.
- Recompensas só entram no save ao clicar "Coletar" (ou "Coletar tudo" no resumo de retorno).

**CA.**
- Ao fechar a aba com uma expedição de 2 h ativa e voltar depois de 3 h, a expedição aparece
  concluída com as recompensas de 2 h (8 rolagens), não de 3 h.
- Cancelar uma expedição de 2 h após 50 min entrega 3 rolagens.
- Coletar duas vezes a mesma expedição (duplo clique) entrega as recompensas uma vez só.
- Se o relógio do sistema voltar no tempo, o progresso não fica negativo nem regride.

### 3.7 Taverna e cozinha

**Descrição.** Ingredientes viram refeições com bônus temporários; a taverna também abriga o mural
de recrutas (Fase 7).

**Regras.**
- Receitas conhecidas desde o início: 3; novas receitas vêm de drops de chefe e da loja.
- Preparar: escolher receita e porções (1–5); tempo total = `receita.minutos × porções`; 1 panela
  (constante; +1 com melhoria futura). Porções prontas vão para o inventário.
- Comer fora de batalha ativa a refeição para o grupo. **1 refeição ativa por vez**; comer outra
  substitui a atual (com confirmação).
- Duração em **encontros**, não em tempo: o bônus não expira enquanto o jogador está fora.

Exemplos de receita:

| Receita | Ingredientes | Tempo/porção | Efeito | Duração |
|---|---|---|---|---|
| Ensopado do Coveiro | 2 Erva da Névoa, 1 Raiz Pálida | 10 min | Vida máx. +10% | 5 encontros |
| Pão de Mel da Estrada | 1 Trigo, 1 Mel Selvagem | 15 min | XP +15% | 5 encontros |
| Caldo de Cogumelo Azul | 2 Cogumelo Azul | 20 min | Recurso inicial +20 | 6 encontros |

**CA.**
- Preparar 3 porções de uma receita de 10 min, fechar o jogo e voltar após 40 min mostra as 3
  porções prontas no resumo de retorno.
- Com "Ensopado do Coveiro" ativo, a vida máxima exibida na batalha é 10% maior e o contador de
  encontros desce 1 a cada encontro concluído (vitória, derrota ou fuga).

### 3.8 Treino de heróis

**Descrição.** No quartel, heróis da reserva treinam atributos ou aprendem golpes por tempo real.

**Regras.**
- **Treino de atributo:** escolher atributo e duração (1, 2, 4 ou 8 h). Ganho: 1 ponto de treino
  por hora completa, na mesma taxa dos pontos de nível (§4.1). Custo: `10 × nível × horas` ouro,
  pago no início. **Limite:** pontos de treino por atributo ≤ nível do herói.
- **Treino de golpe:** aprende antecipadamente um golpe avançado da classe cujo nível exigido seja
  ≤ nível do herói + 5. Duração e custo definidos no golpe (`treino: { horas, ouro }`). Valores por
  nível exigido (calibrados em §4.9): 8 → 2 h / 200 ouro; 16 → 4 h / 400; 30 → 6 h / 700;
  45 → 8 h / 1.000. O golpe só é aprendido com o treino completo.
- 1 vaga de treino no início; +1 após o chefe da zona 4. As vagas são calculadas pelo progresso
  (não ficam guardadas no save).
- Só heróis da **reserva** treinam, um treino por herói. manaMax é treinável pelas classes de mana.
- Durações de atributo que passariam do limite ficam desabilitadas ("Passa do limite (faltam 2)").
- Pontos e golpe entram no herói ao **coletar** (como nas expedições); até lá o herói segue ocupado.
- Cancelar devolve o herói, entrega pontos das horas completas e não devolve ouro.

**CA.**
- Herói nv 12 treinando força por 4 h ganha +4 pontos de treino (+8 força) após 4 h.
- Com força de treino em 12/12, a opção de treinar força aparece desabilitada com "Limite 12/12".

### 3.9 Resumo ao voltar (progresso offline)

- Ao abrir o slot e quando a aba volta a ficar visível, o motor calcula atividades concluídas com
  base em timestamps (`inicio + duracao` vs. `agora`). Nada depende da aba ficar aberta.
- Se houver atividades concluídas não coletadas, aparece o modal "Bem-vindo de volta" com o tempo
  fora (`agora − ultimaVisita`), a lista por categoria e "Coletar tudo".
- Ao abrir o slot, o modal aparece se houver qualquer atividade concluída e não coletada. Ao voltar
  para a aba, só se alguma terminou enquanto o jogador estava fora (`fim > ultimaVisita`). O modal
  não aparece por cima da batalha nem da tela de resultados: espera a próxima tela com navegação.
- **Relógio que não volta:** `ultimaVisita` guarda o maior instante já visto e é atualizado ao abrir
  o slot, a cada 30 s com a aba visível, ao voltar para a aba e em toda ação com tempo. O motor usa
  `max(agora, ultimaVisita)`: se o relógio do sistema for atrasado, as atividades param até o
  relógio alcançar esse instante. Nada regride nem fica negativo.
- Teto: nenhuma atividade produz além da própria duração (máx. 8 h).

**CA.** Abrir o jogo após 1 h com 1 expedição concluída e 1 treino em andamento mostra a
expedição no resumo e o treino como "faltam 2h".

### 3.10 Bestiário e coleção

**Bestiário:** cada inimigo vira entrada ao ser encontrado (silhueta antes disso). Registra
derrotas, fraquezas/resistências descobertas e drops vistos. Marcos:
- 10 derrotas: revela todas as afinidades daquele inimigo.
- 50 derrotas: +10% de chance de drop de materiais daquele inimigo.
- 100 derrotas: moldura dourada na entrada (troféu).

**Coleção:** catálogo de tipos de equipamento (slot + tipo de arma/peso) × raridade já obtidos,
consumíveis, materiais e relíquias. Mostra percentual de conclusão.

**CA.**
- Acertar um Fantasma Menor com *Acorde Letal* (luz) revela "luz: fraco" no bestiário e na prévia
  de alvo das batalhas seguintes.
- A 10ª derrota de um inimigo revela todas as suas afinidades.

### 3.11 Loja, materiais, ferraria e itens raros

**Loja (por slot, não global):**
- 5 equipamentos rotativos renovados a cada 24 h (timestamp); renovar antes custa
  `50 × nivelMedioGrupo` ouro.
- Consumíveis fixos sempre à venda (§3.12). Receitas de cozinha à venda em rotação semanal.
- Vender: 40% do preço de compra (fórmula atual mantida).

**Materiais:** 2–3 por zona (ex.: Cemitério — Osso Antigo, Pano Mortuário). Empilham até 999.

**Ferraria (Fase 10):**
- **Forjar:** receita de equipamento (slot + tipo) com materiais da zona + ouro → item do nível da
  zona; raridade sorteada com piso Incomum.
- **Aprimorar:** +1 até +5; cada nível soma +8% aos bônus do item; custo crescente em materiais e
  ouro; **nunca falha**.

**Itens raros:** **Relíquias** — 1 por chefe de zona, efeito único (ex.: "Coroa do Guardião:
dano de luz +10%"); drop garantido na primeira vitória sobre o chefe, 5% nas seguintes.

**CA.**
- Dois slots de save diferentes têm lojas diferentes.
- Aprimorar um item +2 → +3 sempre tem sucesso e aumenta os bônus exibidos.

### 3.12 Consumíveis

| Item | Efeito | Preço | Alvo |
|---|---|---|---|
| Poção Pequena | cura 40% da vida máx. | 30 | aliado |
| Éter Menor | restaura 30 mana | 40 | aliado |
| Tônico | restaura 40 vigor | 30 | aliado |
| Antídoto | remove Veneno e Queimadura | 20 | aliado |
| Erva Revigorante (Fase 5) | revive com 25% da vida | 120 | aliado nocauteado |

Empilham até 99. Novo jogo (e save migrado) começa com 3 Poções, 2 Éteres e 2 Tônicos.

---

## 4. Fórmulas

Notação: `floor` arredonda para baixo; `clamp(x, a, b)` limita; `n` = nível. Todas as fórmulas
ficam no motor e são testadas com RNG de semente fixa.

### 4.1 Atributos

```
atributoHeroi = floor(base × (1 + 0,06 × (n − 1)))
              + taxa × (pontosNivel + pontosTreino)
              + soma dos bônus de equipamento (com aprimoramento)
              + modificadores de status/refeição (só em batalha)

taxa: vida 10 · força 2 · magia 2 · defesa 2 · resistência 2 · velocidade 1 · manaMax 5
manaMax = floor(manaBase × (1 + 0,06 × (n − 1))) + 5 × pontos em manaMax

atributoInimigo = floor(base × (1 + 0,10 × (n − 1)))
atributoChefe   = floor(base × (1 + 0,08 × (n − 1)))
```

Ex.: Cavaleiro nv 10 sem pontos → vida `floor(140 × 1,54)` = 215, força 24.
Coveiro Maldito nv 10 → vida `floor(460 × 1,9)` = 874, força 55.

### 4.2 Dano

```
ataque  = força (golpe físico) | magia (golpe mágico)
defesa  = defesa (físico)      | resistência (mágico)
base    = poder × ataque / 10 × 100 / (100 + defesa × 0,7)
dano    = floor(base × afinidade × critico × variacao × modificadores), mínimo 1
          (afinidade 0 → dano 0, exibido "Imune")
afinidade: fraco 1,5 · neutro 1 · resiste 0,5 · imune 0
critico:  1,5 se crítico, senão 1
variacao: uniforme em [0,90; 1,10]
modificadores (multiplicam): Defender 0,5 · Proteção 0,7 · Fraqueza (atacante) 0,75 ·
                             passivos de classe · relíquias
```

Ex.: Mago nv 5 (magia 32) usa Bola de Fogo (28) em Esqueleto Errante nv 5 (resistência 5):
`28 × 32 / 10 × 100/103,5 = 86,6` → neutro → 77–95 de dano. Vida do esqueleto nv 5 = 448 (cerca de 5 golpes).

A **prévia de alvo** mostra `floor(base × afinidade × mods × 0,90)` a
`floor(base × afinidade × mods × 1,10)` sem crítico, usando só afinidades já descobertas.

### 4.3 Acerto e crítico

```
chanceAcerto = clamp(precisaoGolpe + (velAtacante − velAlvo) × 0,5, 70, 100)
               − 30 se o alvo tem Evasão (mínimo final 40)
precisaoGolpe: 95 por padrão; 100 = ignora a fórmula (sempre acerta, salvo Evasão)
chanceCritico = 5% + bônus de classe/golpe/status   → dano ×1,5
```

Golpes de cura e suporte sempre acertam. Ex.: Mago (vel 17) contra Esqueleto (vel 25):
`95 + (17 − 25) × 0,5 = 91%`.

### 4.4 Ordem de turnos

Ver §3.1 regra 1. Velocidade efetiva = atributo × modificadores (Lentidão 0,7; buffs somam antes).

### 4.5 Status

| Status | Efeito | Duração | Observação |
|---|---|---|---|
| Queimadura | perde 6% da vida máx. no início do próprio turno | 3t | — |
| Veneno | perde 4% da vida máx. por acúmulo no início do próprio turno | 4t | até 3 acúmulos; reaplicar renova |
| Atordoado | perde o próximo turno | 1t | depois imune por 2t; chefes: chance ×0,5 |
| Lentidão | velocidade ×0,7 | 3t | vale na rodada seguinte |
| Fraqueza | dano causado ×0,75 | 2–3t | — |
| Proteção | dano recebido ×0,7 | 2t | — |
| Provocação | inimigos com alvo único miram este herói | 2t | — |
| Evasão | −30 na chance de acerto contra ele | 1–2t | — |
| Regeneração | cura 5% da vida máx. no início do próprio turno | 3t | — |
| Modificador | ±X em um atributo | conforme golpe | vários podem coexistir |

Regras: a duração diminui no **fim** do turno do afetado; dano de status pode nocautear;
reaplicar o mesmo status renova a duração (não acumula, exceto Veneno); chance de aplicar é
rolada após o acerto.

### 4.6 Recursos

```
Vigor (Cavaleiro, Arqueiro, Assassino, Bárbaro):
  máx 100 · começa a batalha em 40 · +15 no início de cada turno do herói
  Ataque básico: +10 extra · Defender: +25 extra
Mana (Mago, Bardo):
  máx = manaMax (§4.1) · começa cheia · +8% do máx. no início de cada turno do herói
  Defender: +15% do máx. extra
```

Vigor cresce ao longo da luta (golpes fortes no fim); mana começa cheia e é administrada.

### 4.7 XP e níveis

```
xpParaProximoNivel(n) = floor(100 × n^1,6 + 100)
xpPorInimigo(e)       = floor(20 × e^1,2 + 20)      (e = nível do inimigo; chefe ×3)
```

Todos os heróis do grupo recebem o XP total do encontro (inclusive nocauteados). Fuga e derrota
não dão o XP do encontro em curso. Cada nível: +3 pontos livres. Nível máximo: 100.

| n | XP para o próximo | XP por inimigo do mesmo nível | Encontros/nível (2 inimigos) |
|---|---|---|---|
| 1 | 200 | 40 | 2,5 |
| 10 | 4.081 | 336 | 6,1 |
| 30 | 23.188 | 1.204 | 9,6 |
| 50 | 52.381 | 2.206 | 11,9 |
| 100 | — | 5.043 | — |

A curva desacelera de propósito (o sistema atual acelera).

### 4.8 Ouro e drops

```
ouroPorInimigo = floor((2 + e × 1,5) × (chefe ? 3 : 1))
equipamento: 8% por inimigo comum; chefe garante 2 (o 1º com raridade ≥ Raro)
raridade (comum / chefe): tabela atual de sortearRaridade mantida
compatibilidade: 60% dos equipamentos sorteados são de tipo usável por algum herói do grupo
materiais/ingredientes/consumíveis: tabela de drops do inimigo (chance individual por item)
inventário cheio (50 não equipados): equipamento excedente é vendido na hora (40%) e o resumo avisa
```

### 4.9 Calibração

Teste de simulação do motor (não é recurso do jogo): grupo de 2 heróis no nível da zona contra
1.000 encontros sorteados, escolhendo golpes por uma heurística simples. Metas: vitória ≥ 90%;
média de 3 a 6 rodadas por encontro; chefe com vitória entre 60% e 85% sem usar itens.

Masmorra (Fase 6): grupo de 2 heróis no nível máximo da zona, do andar 1 ao chefe, sem itens:
conclusão entre 40% e 80%. A primeira versão (inimigos +1 nível por andar, chefe +5, fogueira 50%)
concluía só 7% a 21%; com os valores atuais de §3.5 a conclusão fica entre 43% e 58%.

**Economia de ouro (após a Fase 7):** teste `engine/economia.test.js`, 5 sementes. Campanha
simulada: grupo de 2 heróis começando no nível 1; em cada zona, encontros (todos vencidos) até o
nível médio chegar ao nível máximo da zona (mínimo 10 encontros) e então o chefe. Renda = ouro dos
inimigos + venda (40%) dos equipamentos que caem; gastos não entram. Os custos são medidos em
"encontros de ouro" (custo ÷ ouro médio por encontro da zona). Metas e resultado:

| Meta | Faixa | Resultado |
|---|---|---|
| Primeiro recruta acessível na zona 1, não antes do 5º encontro | zona 1, ≥ 5º encontro | 9º a 15º encontro (de 50–59) |
| Recruta no nível médio de cada zona | 5 a 12 encontros | 5,5 a 9,3 |
| 1 h de treino de atributo no nível médio da zona | 1 a 4 encontros | 1,9 a 3,6 |
| Golpe avançado na zona em que fica treinável (nível exigido − 5) | 4 a 12 encontros | 6,2 a 10,4 |

Recrutamento e treino de atributo já estavam dentro das metas com os valores da Fase 7. O treino de
golpe não: custava 6, 12, 22 e 34 encontros (crescia demais nos níveis altos) e passou de
200/600/1.800/4.000 para 200/400/700/1.000 ouro. A renda do Cemitério varia de 19 a 32 ouro por
encontro conforme a sorte nos equipamentos, por isso o golpe de nível 8 ficou em 200.

Heróis da simulação: nível sorteado na faixa da zona, pontos divididos entre vida, atributo
principal e defesa, conjunto Comum do nível. Resultado da calibração do Cemitério (Fase 3):
vida dos inimigos ×4 e força/magia ×1,8 em relação aos valores legados; chefe ×4,5 e ×2,1 →
encontros 97% de vitória com 3,7 rodadas; chefe 72% de vitória.

### 4.10 Atividades por tempo

```
decorrido      = clamp(agora − inicio, 0, duracao)
Expedição:
  rolagens     = floor(decorrido / 15 min)
  cada rolagem = 1 item da tabelaExpedicao da zona (pesos), semente = sementeDaExpedicao + i
  ouro         = 5 × (índiceZona + 1) por rolagem
  XP do herói  = floor(xpPorInimigo(floor((nivelMin + nivelMax) / 2)) × 0,5) por rolagem
Treino:
  pontos       = floor(decorrido / 1 h)
Cozinha:
  porcoesProntas = floor(decorrido / (receita.minutos))  (máx. porções pedidas)
```

Ex.: expedição de 2 h no Cemitério = 8 rolagens → ~5 Osso Antigo, ~2 Erva da Névoa,
~1 Pano Mortuário; 40 ouro; 8 × 78 = 624 XP (≈ 44% de um nível para um herói nv 5).

---

## 5. Modelo de dados

Notação descritiva (não é código). `id` de conteúdo em snake_case; `id` de instância é UUID.

### 5.1 Conteúdo (em `src/data/`)

```
Classe {
  id, nome, descricao, recurso: 'mana' | 'vigor', manaBase?,
  atributosBase: { vida, forca, magia, defesa, resistencia, velocidade },
  armasPermitidas: [tipoArma], armadurasPermitidas: [peso],
  golpesIniciais: [golpeId ×4], golpeBasico: golpeId,
  golpesPorNivel: [{ nivel, golpeId }],
  passivo: { tipo, valor, ...parametros, descricao },
  sprite: spriteId
}

Golpe {
  id, nome, descricao, categoria: 'fisico' | 'magico' | 'suporte',
  elemento?, poder?, acertos?: 1, precisao?: 95, custo, alvo,
  efeitos?: [{ tipo: 'status' | 'cura' | 'recurso' | 'modificador' | 'autoDano',
               statusId?, chance?, turnos?, valor?, atributo? }],
  bonusCritico?, telegrafado?: false,
  treino?: { horas, ouro }, animacao: { tipo: 'corpo' | 'projetil' | 'area', particula }
}

Inimigo {
  id, nome, atributosBase, fraquezas: [elemento], resistencias: [elemento],
  imunidades: [elemento | statusId], golpes: [golpeId],
  ia: { padrao: [golpeId], regras: [{ condicao, golpeId }] },
  drops: [{ itemId, chance }], chefe?: false, reliquia?: itemId, sprite: spriteId
}

Zona {
  id, nome, tema, nivelMin, nivelMax, encontrosParaChefe: 10,
  inimigos: [inimigoId], encontros: [{ inimigos: [inimigoId], peso }],
  chefe: inimigoId, masmorra: { id, nome },
  tabelaExpedicao: [{ itemId, peso }], cenario: spriteId, paleta
}

ItemBase {            // consumíveis, materiais, ingredientes, relíquias, refeições
  id, nome, descricao, categoria: 'consumivel' | 'material' | 'ingrediente' | 'reliquia' | 'refeicao',
  efeito?, preco?, empilhaAte, icone
}

Receita { id, nome, ingredientes: [{ itemId, qtd }], minutos, resultado: itemId,
          efeito: { tipo, valor }, duracaoEncontros }
```

### 5.2 Instâncias (no save)

```
Heroi {
  id, nome, classeId, nivel, xp,
  pontosLivres, pontosNivel: { vida, forca, magia, defesa, resistencia, velocidade, manaMax },
  pontosTreino: { mesmos campos },
  golpesAprendidos: [golpeId], golpesEquipados: [golpeId ×≤4],
  equipamento: { capacete, peitoral, luvas, botas, arma }   // equipamentoId | null
}   // a atividade do herói é lida de save.atividades (heroiId); a v4 tirou o campo "atividade"

Equipamento {
  id, nome, slot, tipoArma?, pesoArmadura?, raridade, nivel,
  bonus: { vida, forca, magia, defesa, resistencia, velocidade },
  aprimoramento: 0..5
}

Atividade {
  id, tipo: 'expedicao' | 'treinoAtributo' | 'treinoGolpe' | 'cozinha',
  heroiId?, inicio, duracao (ms), semente? (expedições), parametros: { zonaId? | atributo? |
  golpeId? | receitaId?, porcoes? }, custoPago
}   // coletar ou cancelar remove a atividade do save: coletar de novo não entrega nada
```

### 5.3 Estado de batalha (salvo para sair e voltar)

```
Batalha {
  id, semente (estado atual do RNG), origem: { tipo: 'zona' | 'masmorra', zonaId, andar? },
  fase: 'escolhaAcao' | 'fim',            // só fases estáveis são salvas (§6.2)
  rodada, ordem: [combatenteId], indiceTurno,
  combatentes: { [id]: Combatente },
  recompensasParciais: { xp, ouro, itens: [] },
  log: [Evento] (últimos 50), resultado: null | 'vitoria' | 'derrota' | 'fuga'
}

Combatente {
  id, lado: 'herois' | 'inimigos', refId (heroiId | inimigoId), nome, nivel, posicao,
  atributos (snapshot no início da batalha), hpAtual, hpMax,
  recurso: { tipo, atual, max } | null,
  golpes: [golpeId], status: [{ statusId, turnos, acumulos, valor? }],
  defendendo: false, nocauteado: false,
  intencao?: { golpeId, alvos: [combatenteId] }, cicloIa: 0, historicoIa: {}
}

Evento { tipo: 'turnoIniciado' | 'golpeUsado' | 'dano' | 'cura' | 'errou' | 'critico' |
         'statusAplicado' | 'statusTick' | 'statusRemovido' | 'recurso' | 'nocaute' |
         'intencao' | 'rodadaIniciada' | 'fimBatalha',
         origemId?, alvoId?, valor?, hpDepois?, elemento?, afinidade?, golpeId? }
```

### 5.4 Save completo

```
localStorage:
  magichill:indice   → { versao, ultimoSlot, migradoDeV1: bool,
                          slots: [ ResumoSlot | null ×3 ] }
  magichill:slot:<n> → Save
  magichill:config   → { tema, velocidadeAnimacao: 1|2|3, volumeEfeitos, volumeMusica,
                          reduzirMovimento }          // por dispositivo, fora do save

ResumoSlot { nome, criadoEm, atualizadoEm, nivelMaisAlto, classePrincipal, tempoJogado }

Save {
  versao: 4, criadoEm, atualizadoEm, ultimaVisita (maior instante já visto), tempoJogado,
  ouro,
  herois: { [heroiId]: Heroi }, grupo: [heroiId ×≤4],
  inventario: { equipamentos: { [id]: Equipamento } (máx. 50),
                itens: { [itemId]: qtd } },                 // consumíveis, materiais, ingredientes, refeições
  progresso: { zonas: { [zonaId]: { desbloqueada, encontrosVencidos, chefeDerrotado } },
               masmorras: { [id]: { desbloqueada, concluida, melhorAndar } } },
  batalha: Batalha | null,
  masmorraAtual: { zonaId, andar, vida: { [heroiId]: hpAtual }, ganhos: { xp, ouro, itens,
                   equipamentos }, fogueira: { andar } | null } | null,   // v3
  atividades: { [atividadeId]: Atividade },        // vagas calculadas pelo progresso (v4)
  refeicaoAtiva: { itemId, encontrosRestantes } | null,
  loja: { itens: [Equipamento & { preco }], vendidos: [bool], renovadaEm },
  recrutas: { opcoes: [{ classeId, nome, contratado }], renovadaEm } | null,
  bestiario: { [inimigoId]: { visto, derrotas, afinidadesReveladas: [elemento], dropsVistos: [] } },
  colecao: { equipamentos: { [chave]: [raridade] }, itens: [itemId], reliquias: [itemId] },
  receitasConhecidas: [receitaId],
  estatisticas: { encontrosVencidos, derrotas, fugas, danoCausado, ... }
}
```

### 5.5 Migração do formato atual (v1 → v2)

Fonte: chave `rpg_users` (§ formato v1 documentado na Fase 0).

1. Executa uma vez, ao abrir o jogo, se `magichill:indice` não existe e `rpg_users` existe.
2. Contas com `character` são ordenadas por `createdAt`. Até 3 viram slots; se houver mais, a tela
   "Importar contas antigas" pede para escolher 3. **`rpg_users` nunca é apagado** (fica como
   backup; pode ser exportado).
3. Por conta:
   - Herói: `nome = username`, `classeId`, `nivel` mantidos; `xp` convertido proporcionalmente
     (`floor(xp / xpProximoNivelAntigo × xpParaProximoNivel(nivel))`); `pontosDistribuidos`
     → `pontosNivel` (para Mago e Bardo, pontos de força vão para magia); golpes iniciais equipados.
   - Equipamentos e inventário: `bonusX` → `bonus.x`; em armas mágicas (cajado, varinha, grimório,
     instrumento) `bonusForca` vira `bonus.magia`; `aprimoramento: 0`.
   - `ouro` mantido. `areasDesbloqueadas`/`areasConcluidas`/`bossesDerotados` → `progresso.zonas`
     e bestiário (chefe com 1 derrota). `dungeonsConcluidas` → `progresso.masmorras`.
     `batalhasVencidas` → `estatisticas.encontrosVencidos`. `dungeonsDesbloqueadas` e `hpAtual`
     são descartados (recalculados pelas novas regras).
   - Companheiro: classe sorteada diferente, nível `max(1, nivel − 2)`, conjunto Comum do nível.
   - Consumíveis iniciais (§3.12). `rpg_shop` é ignorado (loja nova por slot).
4. Migrações futuras: cadeia `v2 → v3 → …`, uma função pura por versão, cada uma com teste e fixture.
   - **v2 → v3** (Fase 6): `masmorraAtual` ganha `vida`, `ganhos` e `fogueira`. Saves v2 nunca
     tiveram masmorra em andamento, então a migração só normaliza o campo para `null`.
   - **v3 → v4** (Fase 7): remove `vagas` (agora calculadas pelo progresso) e `heroi.atividade`
     (lida de `save.atividades`); normaliza `atividades` para `{}` e `recrutas` para `null`
     (nenhum save v3 tinha atividades nem mural).

**CA.**
- Um `rpg_users` com 2 contas (Cavaleiro nv 14 com 6 itens; Mago nv 3 sem itens) vira 2 slots com
  heróis de mesmo nível, os mesmos itens e o mesmo ouro (teste com fixture).
- Após a migração, `rpg_users` continua intacto no localStorage.
- Um save corrompido (JSON inválido) não é sobrescrito: o slot aparece como "Danificado" com
  opções Exportar bruto e Apagar.

---

## 6. Arquitetura técnica

### 6.1 Camadas

```
components/ (UI)  ──dispara ações──▶  state/ (store)  ──chama──▶  engine/ (puro)
      ▲                                    │                         ▲
      └────── lê estado e eventos ─────────┤                         │ dados
                                           └──persiste──▶ save/       data/
```

- **engine/**: funções puras `(estado, entrada, rng?, agora?) → novoEstado (+ eventos)`. Sem
  React, sem localStorage, sem `Math.random`/`Date.now`. Módulos: `rng`, `atributos`, `dano`,
  `status`, `turnos`, `ia`, `combate`, `progressao`, `itens`, `loja`, `masmorra`, `relogio`
  (relógio que não volta e prazos), `atividades` (base de tempo), `treino`, `coleta` (coletar,
  cancelar e resumo de retorno; cada tipo de atividade registra a função que a encerra), `grupo`,
  `recrutamento`.
- **data/**: conteúdo (§5.1) e `constants.js`. Validação de integridade dos dados por teste
  (ids referenciados existem, pesos > 0).
- **state/**: store global, criadores de ação (que injetam `agora`), seletores.
- **save/**: índice de slots, leitura/gravação, versão, migrações, exportar/importar.
- **components/**: telas e peças; lêem via seletores e disparam ações.

### 6.2 Combate como máquina de estados

```
INICIO ──criarBatalha──▶ ESCOLHA_ACAO ──jogador envia ação──▶ RESOLUCAO (motor)
   ▲                         ▲                                     │
   │                         │                         eventos + novo estado estável
   │                         └──── fim da fila ──── ANIMACAO (só UI) ◀┘
   │                                                       │
   └──────────────────────────────────────────────── FIM (vitória/derrota/fuga)
```

- API do motor: `criarBatalha(params, semente)`, `acoesDisponiveis(batalha, combatenteId)`
  (com motivo de desabilitado), `preverAcao(batalha, acao)` (prévia sem RNG),
  `aplicarAcao(batalha, acao) → { batalha, eventos }`.
- `aplicarAcao` resolve a ação do herói **e** todos os turnos seguintes de inimigos (e ticks de
  status) até chegar ao próximo turno de herói ou ao fim. O estado devolvido é sempre estável
  (`escolhaAcao` ou `fim`) e é salvo na hora.
- A UI recebe a lista de eventos e a anima em sequência (`ANIMACAO` existe só na UI). Durante a
  fila, a UI bloqueia entradas e o reducer também rejeita ações se houver fila pendente
  (defesa em profundidade).
- Valores exibidos durante a animação vêm dos eventos (`hpDepois`), não do estado final, para que as
  barras desçam no momento certo.
- Fechar a aba no meio da animação: ao voltar, mostra o estado estável já salvo (resultado
  idêntico — o RNG já avançou e foi salvo).

### 6.3 RNG

PRNG com semente implementado no motor (mulberry32, ~10 linhas, sem dependência). A semente da
batalha é salva após cada `aplicarAcao`, então recarregar não muda resultados (sem "save
scumming") e os testes são determinísticos. Atividades guardam a própria semente no início.

### 6.4 Estado global: `useReducer` + Context

**Escolha:** `useReducer` + dois Contexts (estado e dispatch), sem dependência nova.

- O reducer é fino: delega ao motor e é puro (sem I/O). `agora` entra pelo payload da ação.
- Persistência fica fora do reducer: um efeito no Provider observa o save e grava via `save/`
  (debounce de 300 ms + gravação imediata em `pagehide`/`visibilitychange`).
- Re-render: só uma tela é montada por vez e o estado é pequeno; seletores e `memo` nas peças da
  batalha bastam.
- **Por que não Zustand:** resolveria re-renders com seletores, mas é uma dependência a mais para
  um problema que não temos; a regra do projeto é minimizar dependências. Reavaliar se surgir
  gargalo medido.

### 6.5 Dados fora do código

Todo conteúdo (classes, golpes, inimigos, zonas, itens, receitas, textos de conteúdo) fica em
`src/data/` como módulos JS exportando objetos. Telas e motor recebem ids e consultam os dados.

### 6.6 Atividades por tempo

Timestamps (`inicio`, `duracao`) e `engine/atividades` calculando `decorrido` com `agora` injetado
(§4.10). Recalcula ao abrir o slot, ao voltar a aba e a cada 30 s com a aba visível (só para
atualizar o texto "faltam …" e `ultimaVisita`; o resultado não depende disso). O relógio de 30 s
fica no Provider e só despacha a ação `RELOGIO`; os criadores de ação continuam sendo os únicos
que leem `Date.now()`.

### 6.7 Save

- Até 3 slots; índice separado para listar sem carregar tudo.
- Versão no save; ao carregar, aplica migrações em cadeia; nunca grava por cima de um save que
  falhou ao ler.
- **Exportar:** baixa `magichill-<nome>-<AAAA-MM-DD>.json` com
  `{ formato: 'magichill-save', versao, exportadoEm, save }`.
- **Importar:** valida formato, migra se versão antiga, escolhe slot (confirma se ocupado).

### 6.8 Testes

- **Ferramenta:** Vitest (1 devDependency). Justificativa: usa a mesma config/transform do Vite,
  ESM nativo, rápido, API conhecida; Jest exigiria configurar Babel/ESM à parte.
- Ambiente `node` (o motor não precisa de DOM). Arquivos `*.test.js` ao lado do código.
- Cobertura obrigatória: fórmulas (§4) com RNG fixo; máquina de estados (cenários: vitória,
  derrota, fuga, status nocauteando, provocação, atordoamento, imunidade); IA determinística;
  atividades com relógio falso (incl. relógio voltando); migração v1 → v2 com fixtures; integridade
  dos dados; simulação de calibração (§4.9) como teste lento separado.
- Scripts: `test` (`vitest run`) e `test:watch`.

### 6.9 Ferramentas

- ESLint: zerar erros legados; desativar `react/prop-types` (projeto JS sem PropTypes — evita uma
  dependência) e manter `react-hooks`.
- **Dependências novas propostas:** apenas `vitest` (dev). Nada de biblioteca de animação, estado,
  roteamento, datas ou RNG.

---

## 7. Direção visual

### 7.1 Estilo

Pixel art medieval com interface em "pergaminho e madeira" suave. Sprites com
`image-rendering: pixelated`, **escala inteira** (×3 no desktop, ×2 em telas < 640 px). Personagens
em quadro base de **32×32 px** (sprites 16×16 ficam centralizados no quadro 32×32); chefes em quadros
maiores (até 64×64 ou o tamanho original do pack). Fontes atuais mantidas (Cinzel para títulos,
Crimson Pro para texto); números em fonte mono.

### 7.2 Animações de batalha

| Animação | Implementação | Duração (1×) |
|---|---|---|
| Idle | sprite sheet em tira horizontal, `steps(n)` em loop | 600–800 ms/ciclo |
| Ataque | frames de ataque do pack; sem frames → avanço de 12 px + volta (transform) | 450 ms |
| Dano | frames de "hit"; sem frames → flash branco (filter) + tremida de 4 px | 250 ms |
| Derrota | frames de morte; sem frames → cai 8 px + fade out | 600 ms |
| Projétil/magia | div com partícula do elemento indo do atacante ao alvo | 300 ms |
| Número flutuante | sobe 24 px e some; crítico maior e dourado; cura verde; "Errou" cinza; "Fraco!" | 700 ms |
| Barra de HP | barra da frente pula para o novo valor; barra "fantasma" atrás desce | 400 ms |
| Partículas | 4–8 divs por impacto, cor do elemento, CSS puro | 400 ms |

- Velocidade 2× e 3× dividem todas as durações. Clique na arena adianta a fila.
- `prefers-reduced-motion` ou a opção "Reduzir movimento": sem tremidas/partículas, só fades curtos.
- Pausa de 200 ms entre ações para leitura.

### 7.3 Seleção de golpes

- Herói ativo destacado: retrato em relevo na barra de ordem, seta sobre o sprite e painel inferior
  com o nome dele.
- Painel de ações: abas **Golpes · Itens · Defender · Fugir**. Cada cartão de golpe mostra nome,
  custo (ícone de mana/vigor; vermelho se insuficiente), elemento, alvo e descrição curta.
- Fluxo desktop: clicar no golpe → alvos válidos brilham → passar o mouse mostra prévia → clicar
  executa. `Esc`/botão direito cancela. Teclado: 1–4 golpes, B básico, D defender, setas para alvo,
  Enter confirma.
- Fluxo toque: tocar no golpe → tocar no alvo seleciona e mostra a prévia → botão "Confirmar".
  Toque longo no golpe abre a descrição completa.

### 7.4 Layouts principais

Navegação fixa: barra superior no desktop, inferior no celular —
**Mapa · Grupo · Atividades · Taverna · Inventário · Mais** (Loja, Ferraria, Bestiário, Coleção,
Configurações, Slots).

**Batalha**
```
┌────────────────────────────────────────────────────────────┐
│ Cemitério Antigo · Rodada 3   [Ordem: ◉Mago ○Rato ○Cav ○Esq]  ⏩2×  ⏏ Sair │
├────────────────────────────────────────────────────────────┤
│                                        ⚔→Cav   ✦?          │
│   🧙 Mago  ▓▓▓▓▓░ 62/93   ✦40/74          🐀 Rato  ▓▓▓░░░  │
│   🛡 Cav   ▓▓▓▓▓▓ 180/215 ⚡55  [🔥2]      💀 Esq   ▓▓▓▓▓░  │
│                     (arena com cenário da zona)            │
├────────────────────────────────────────────────────────────┤
│ Vez de: Mago     [Golpes] [Itens] [Defender] [Fugir]       │
│ ┌ Bola de Fogo ✦12 🔥 ┐┌ Relâmpago ✦8 ⚡ ┐┌ Escudo Arc. ✦10 ┐┌ Explosão ✦30 🔥 ┐ │
│ └ 1 inimigo · 25% queim.┘└ 1 inimigo ┘└ 1 aliado ┘└ todos (desab.) ┘ │
│ Prévia: Esqueleto · 77–95 · 91% · Fraco? ?   [Faísca (básico)] │
└────────────────────────────────────────────────────────────┘
```

**Grupo**
```
┌ Grupo (3/4) ───────────────────────┐ ┌ Herói: Aldric · Cavaleiro nv 14 ─────────┐
│ [Aldric][Mira][Toren][ + vazio ]   │ │ Atributos (+pontos livres: 3)  [+][+]...  │
│ Reserva: [Kael ⏳ expedição 1h12]   │ │ Golpes equipados (4) ⇄ aprendidos         │
│          [Lysa  livre]              │ │ Equipamento: elmo · peito · luvas · botas · arma │
└─────────────────────────────────────┘ └───────────────────────────────────────────┘
```

**Mapa**
```
 Cemitério ✓ ── Minas ⚔ 7/10 ── Costa 🔒 ── …          [Batalha em andamento — Retomar]
   └ Cripta (masmorra) melhor andar 4/6
 Painel da zona: inimigos (bestiário), drops conhecidos, [Explorar] [Enfrentar chefe] [Masmorra]
```

**Taverna**
```
 [Cozinha] Panela: Ensopado ×3 — pronto em 18 min   Receitas: [card][card][card]
 Refeição ativa: Pão de Mel (XP +15%) — 3 encontros     [Mural de recrutas: 3 cards]
```

**Atividades (Expedições e Treino)**
```
 Expedições (1/2 vagas)  [Kael → Minas · 4h · faltam 1h12 ▓▓▓▓░░]  [+ Nova]
 Treino (1/1)            [Lysa → Força · 2h · pronto ✓ Coletar]
```

**Inventário**
```
 Filtros: [Equip.] [Consumíveis] [Materiais] [Ingredientes]   Ordenar: nível | raridade
 Grade de itens (50) · painel de detalhes: comparação com o equipado do herói selecionado
```

### 7.5 Paleta e temas

Tokens no `@theme` com quatro temas; o atual (preto/ouro saturado) é suavizado.

| Token | Taverna (padrão, escuro) | Pergaminho (claro) | Bosque (escuro) | Noite (escuro) |
|---|---|---|---|---|
| fundo | #1c1814 | #f3ead8 | #141a16 | #141826 |
| superfície | #26201a | #fbf5e8 | #1b231e | #1b2033 |
| elevado | #2f281f | #eadfc8 | #232d26 | #232a40 |
| borda | #3d3428 | #d6c6a6 | #2e3a31 | #2f3752 |
| texto | #ece3d3 | #3b2f22 | #e3eadf | #e4e6f0 |
| texto secundário | #b5a68e | #6b5a45 | #a3b09c | #a2a8c0 |
| destaque | #d9a441 | #9c6b1f | #c9b26b | #c6a8e8 |
| sucesso | #7fb069 | #4f7a3a | #8cc084 | #7fc4a8 |
| perigo | #d0675b | #a8473b | #d97a6c | #e08a8a |
| mana | #6c8fd4 | #3f6e96 | #7fa3d9 | #8fa8f0 |
| vigor | #d99a4a | #a0651c | #d4a95a | #e0b070 |

- Primeiro acesso: Pergaminho se o sistema prefere tema claro; senão Taverna. Troca em
  Configurações, aplicada na hora.
- Texto deve ter contraste ≥ 4,5:1 com o fundo em todos os temas (CA verificável com ferramenta de
  contraste).
- Cores de raridade mantidas, levemente dessaturadas, com rótulo de texto (não só cor).

### 7.6 Packs candidatos (licenças verificadas em 23/10/2026)

| Pack | Uso | Licença | Animações | Link |
|---|---|---|---|---|
| Puny Characters — Shade | heróis (6 classes) | CC0 | idle, walk, espada, arco, cajado, arremesso, hurt, death (32×32) | https://opengameart.org/content/puny-characters |
| 16x16 DungeonTileset II — 0x72 | inimigos comuns, cenário, itens | CC0 | idle/run (sem ataque e morte → fallback CSS) | https://0x72.itch.io/dungeontileset-ii |
| Monsters Creatures Fantasy — Luiz Melo | chefes/inimigos grandes | CC0 | idle, attack, take hit, death | https://luizmelo.itch.io/monsters-creatures-fantasy |
| Fantasy Warrior — Luiz Melo | chefe humanoide / alternativa | CC0 | idle, attack ×3, take hit, death (27×45) | https://luizmelo.itch.io/fantasy-warrior |
| Tiny Dungeon — Kenney | ícones, cenário | CC0 | estático | https://kenney.nl/assets/tiny-dungeon |
| RPG Audio — Kenney | efeitos (golpes, passos, itens) | CC0 | — | https://kenney.nl/assets/rpg-audio |
| Interface Sounds — Kenney | sons de UI | CC0 | — | https://kenney.nl/assets/interface-sounds |
| Músicas medievais — RandomMind (OpenGameArt) | cidade/taverna | CC0 | loops | https://opengameart.org/content/medieval-the-old-tower-inn |

- Música de batalha: candidato ainda não definido (pesquisar na Fase 11).
- **Não usar:** assets LPC (CC-BY-SA/GPL — compartilhamento obrigatório, fora das licenças
  permitidas) e packs com licença própria não-CC sem aprovação.
- Antes de baixar, conferir a licença na página do pack; registrar em `CREDITS.md` junto com o asset.
- Mistura de estilos: priorizar Puny + 0x72 (mesma escala); packs grandes só para chefes.
- Em uso (detalhes em CREDITS.md): heróis do Puny Characters; cenário e a maioria dos
  inimigos do 0x72; inimigos humanoides (soldados, arqueiro, mineiro, pirata, sentinela) do
  Puny Characters, linha virada para a esquerda.
- Inimigos usam **sprites base** (`src/assets/sprites/criaturas/`) com **filtro de cor em CSS**
  definido em `src/data/aparenciaInimigos.js`. O 0x72 tem poucas criaturas, então várias bases
  se repetem entre zonas com cores diferentes (ex.: o ogro é o Golem de Pedra cinza, o Golem de
  Magma vermelho e o Golem Arcano azul). Substituir por sprites próprios quando houver pack
  CC0 adequado.
- Aproximações conhecidas: Rato de Tumba (criatura de lama), Fantasma Menor (zumbi de gelo
  translúcido), morcego e corvo (imp escurecido), aranhas (chort escurecido).
- Quadros de ataque, dano e derrota existem só nos heróis e inimigos do Puny; nos demais esses
  três usam o efeito em CSS de §7.2.

---

## 8. Roadmap

Cada fase termina com build, lint e testes passando, resumo do que mudou e parada para aprovação.

### Fase 0 — Investigação ✅
- [x] Relatório da base atual

### Fase 1 — CLAUDE.md ✅
- [x] CLAUDE.md com comandos, mapa, convenções, restrições e regras

### Fase 2 — SPEC.md ✅
- [x] Especificação aprovada

### Fase 3 — Fundação do motor (sem mudança visível no jogo)
- [x] Vitest instalado; scripts `test` e `test:watch`
- [x] Lint com 0 erros (legado corrigido; `react/prop-types` desativado)
- [x] `engine/`: rng, atributos, dano, acerto/crítico, status, turnos, IA, combate (máquina de estados)
- [x] `engine/`: encontros, geração de equipamentos/drops, XP e aplicação do resultado no save
- [x] Dados novos: classes (6 atributos, recurso), golpes iniciais, conteúdo do Cemitério
- [x] `save/`: índice de slots, save v2, migração v1 → v2 com fixtures, exportar/importar (funções)
- [x] Teste de integridade dos dados e teste de simulação (§4.9) rodando

**CA:** `npm test` cobre os cenários de §6.8; o jogo atual continua funcionando igual.

### Fase 4 — MVP: combate manual com sprites em uma zona
- [x] Tela de slots (novo, continuar, apagar, exportar, importar) substitui login; migração automática
- [x] Novo jogo: classe (1 de 3) + nome + companheiro
- [x] Store nova (`state/`) com persistência fora do reducer
- [x] Cidade mínima + Mapa com Cemitério jogável (demais zonas "em breve")
- [x] Batalha: grupo × 1–3 inimigos, sprites idle/ataque/dano/derrota, números flutuantes, barras
      animadas, partículas, barra de ordem, intenções, menu de ações, prévia de alvo, itens, fugir
- [x] Velocidade 1×/2×/3×, adiantar fila, reduzir movimento
- [x] Sair e retomar batalha (incl. recarregar a página)
- [x] Resultados de vitória, XP/níveis, pontos livres na tela Grupo; derrota volta à cidade
- [x] Chefe Guardião da Cripta após 10 encontros
- [x] Inventário e equipamento por herói
- [x] `CREDITS.md` com todos os assets usados

**CA:** todos os CA de §3.1, §3.4 (Cemitério) e §5.5 verificados manualmente; save migrado jogável.
Durante as Fases 4–5, zonas 2–10 de saves migrados ficam registradas, mas inacessíveis.

### Fase 5 — Conteúdo completo das zonas
- [x] 10 zonas convertidas (atributos, afinidades, IA, encontros, drops, materiais)
- [x] Golpes avançados por nível e tela de troca de golpes
- [x] Bestiário com marcos
- [x] Loja por slot + consumíveis + Erva Revigorante
- [x] Remoção do código legado (`GameContext.jsx`, telas antigas, `utils/`)

### Fase 6 — Masmorras por andares
- [x] 10 masmorras, fogueiras, recompensas por andar, melhor andar

### Fase 7 — Recrutamento, reserva e treino
- [x] Mural de recrutas, grupo de até 4, reserva até 12
- [x] Infra de atividades por tempo + resumo "Bem-vindo de volta"
- [x] Treino de atributo e de golpe

### Fase 8 — Expedições
- [ ] Expedições com rolagens, vagas progressivas, cancelar e coletar

### Fase 9 — Taverna e cozinha
- [ ] Ingredientes, receitas, preparo por tempo, refeição ativa por encontros

### Fase 10 — Ferraria, relíquias e coleção
- [ ] Forjar, aprimorar (+1 a +5), relíquias de chefe, tela de coleção

### Fase 11 — Polimento
- [ ] 4 temas de cor selecionáveis com contraste verificado
- [ ] Efeitos sonoros e música com controle de volume
- [ ] Revisão de responsividade, acessibilidade (teclado, foco, rótulos) e textos

### Pendências conhecidas (após a Fase 7)
- A vida dos heróis durante uma masmorra só aparece na tela da masmorra; o mapa não mostra.
- Chefes exclusivos de masmorra não existem: o chefe da masmorra é o chefe da zona fortalecido
  (decisão da Fase 6, §3.5; ideia registrada em §9).
- Sprites aproximados: Rato de Tumba, Fantasma Menor, morcego, corvo e aranhas (§7.6); vários
  inimigos reaproveitam a mesma base com filtro de cor.
- Origem e licença de `public/logo.png` precisam ser confirmadas pelo autor (CREDITS.md).
- Renovar a loja custa `50 × nível médio` (2.700 ouro no nível 54), bem acima do preço dos
  itens Comuns do dia; reavaliar quando houver mais fontes de ouro.
- As 9 vulnerabilidades apontadas pelo `npm audit` (dependências de desenvolvimento) não foram
  tratadas.
- Não há como reordenar o grupo (a posição só pesa no desempate da ordem de turnos e na IA
  `primeiro`); recrutas e heróis vindos da reserva entram no fim.
- Treinar exige tirar o herói do grupo; com o grupo inicial de 2, isso deixa 1 herói lutando até
  contratar alguém. Reavaliar se ficar incômodo.
- A calibração da economia (§4.9) mede só a renda; gastos com consumíveis, loja e treino ao mesmo
  tempo não entram. Reavaliar quando expedições (Fase 8) e cozinha (Fase 9) mudarem a renda.

---

## 9. Fora de escopo

- Backend, contas online, sincronização na nuvem, ranking, multiplayer ou PvP.
- Monetização, gacha, energia/estamina que limite o jogo, anúncios.
- Batalha automática, repetição automática, cronômetro de turno.
- Morte permanente ou perda de itens/XP na derrota.
- TypeScript, app nativo, PWA/instalação offline (reavaliar depois da Fase 11).
- Outros idiomas além de pt-BR.
- Geração procedural de mapas, editor de conteúdo, mods.
- Invocação de inimigos no meio da batalha e combate com mais de 3 inimigos.
- Chefes exclusivos de masmorra (hoje o chefe da masmorra é o chefe da zona fortalecido).
