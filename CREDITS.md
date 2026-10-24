# Créditos

Todos os assets de terceiros usados no jogo, com origem e licença. Todo asset novo entra aqui no
mesmo commit em que é adicionado ao projeto.

## Sprites

### Puny Characters — Shade
- **Licença:** CC0 1.0 (domínio público)
- **Origem:** https://opengameart.org/content/puny-characters (arquivo `puny-charactersorcs_included.zip`)
- **Uso:** heróis, em `src/assets/sprites/herois/`. De cada sheet 768×256 foi recortada só a linha
  virada para a direita (768×32, 24 quadros de 32×32).

| Arquivo no projeto | Sheet original |
|---|---|
| `herois/cavaleiro.png` | `Soldier-Blue.png` |
| `herois/arqueiro.png` | `Archer-Green.png` |
| `herois/mago.png` | `Mage-Cyan.png` |
| `herois/assassino.png` | `Archer-Purple.png` |
| `herois/bardo.png` | `Mage-Red.png` |
| `herois/barbaro.png` | `Warrior-Red.png` |
| `criaturas/p_trabalhador.png`, `p_soldado_vermelho`, `p_soldado`, `p_arqueiro`, `p_soldado_ciano`, `p_orc_soldado` | linha 6 (virada para a esquerda) de `Human-Worker-Red`, `Human-Soldier-Red`, `Soldier-Red`, `Archer-Purple`, `Human-Soldier-Cyan`, `Orc-Soldier-Red` |

### 16x16 DungeonTileset II (v1.7) — 0x72
- **Licença:** CC0 1.0 (domínio público)
- **Origem:** https://0x72.itch.io/dungeontileset-ii (arquivo `0x72_DungeonTilesetII_v1.7.zip`)
- **Uso:** inimigos, cenário da arena e ícones de itens. Os quadros de animação de cada criatura
  foram juntados em uma tira horizontal.

| Arquivo no projeto | Quadros originais |
|---|---|
| `criaturas/<nome>.png` (skelet, zombie, muddy, ice_zombie, necromancer, big_zombie, ogre, big_demon, wizzard_m, wizzard_f, elf_f, knight_m, lizard_m, chort, wogol, imp, orc_warrior, orc_shaman, masked_orc, angel, slug, swampy, doc) | `<nome>_idle_anim_f0..f3` ou `<nome>_anim_f0..f3` (zombie: f1, f2, f3, f10) |
| `cenario/chao.png`, `chao2.png`, `chao3.png` | `floor_1`, `floor_2`, `floor_3` |
| `cenario/parede.png`, `parede_topo.png` | `wall_mid`, `wall_top_mid` |
| `cenario/estandarte.png` | `wall_banner_red` |
| `itens/pocao_pequena.png` | `flask_red` |
| `itens/eter_menor.png` | `flask_blue` |
| `itens/tonico.png` | `flask_yellow` |
| `itens/antidoto.png` | `flask_green` |
| `itens/erva_revigorante.png` | `flask_big_green` |

## Fontes

Carregadas do Google Fonts.

- **Cinzel**, de Natanael Gama: SIL Open Font License 1.1.
- **Crimson Pro**, de Jacques Le Bailly: SIL Open Font License 1.1.

## Outros

- `public/logo.png`: já existia no repositório antes desta reformulação. A origem e a licença
  precisam ser confirmadas pelo autor do projeto.
