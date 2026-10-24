// Constantes de regra do jogo. Valores descritos no SPEC.md §4.

export const ATRIBUTOS = ["vida", "forca", "magia", "defesa", "resistencia", "velocidade"];

// Quanto cada ponto (de nível ou de treino) soma ao atributo
export const TAXA_PONTO = {
  vida: 10,
  forca: 2,
  magia: 2,
  defesa: 2,
  resistencia: 2,
  velocidade: 1,
  manaMax: 5,
};

export const PONTOS_POR_NIVEL = 3;
export const NIVEL_MAXIMO = 100;

export const CRESCIMENTO_HEROI = 0.06;
export const CRESCIMENTO_INIMIGO = 0.1;
export const CRESCIMENTO_CHEFE = 0.08;
export const MULT_APRIMORAMENTO = 0.08;

export const ELEMENTOS_FISICOS = ["corte", "impacto", "perfuracao"];
export const ELEMENTOS_MAGICOS = ["fogo", "gelo", "raio", "luz", "sombra"];
export const ELEMENTOS = [...ELEMENTOS_FISICOS, ...ELEMENTOS_MAGICOS];

export const MULT_AFINIDADE = { fraco: 1.5, neutro: 1, resiste: 0.5, imune: 0 };

export const VARIACAO_DANO_MIN = 0.9;
export const VARIACAO_DANO_MAX = 1.1;
export const FATOR_DEFESA = 0.7;

export const CRITICO_BASE = 0.05;
export const MULT_CRITICO = 1.5;

export const PRECISAO_PADRAO = 95;
export const ACERTO_MIN = 70;
export const ACERTO_MAX = 100;
export const FATOR_VELOCIDADE_ACERTO = 0.5;
export const PENALIDADE_EVASAO = 30;
export const ACERTO_MIN_COM_EVASAO = 40;

export const MULT_DEFENDER = 0.5;

export const VIGOR = {
  max: 100,
  inicial: 40,
  porTurno: 15,
  extraDefender: 25,
};

export const MANA = {
  regenPorTurno: 0.08,
  extraDefender: 0.15,
};

export const MAX_GRUPO = 4;
export const MAX_HEROIS = 12;
export const MAX_SLOTS = 3;
export const MAX_EQUIPAMENTOS_INVENTARIO = 50;
export const MAX_GOLPES_EQUIPADOS = 4;
export const MAX_INIMIGOS_ENCONTRO = 3;
export const TAMANHO_NOME_MAX = 16;
export const MAX_LOG_BATALHA = 50;

export const ENCONTROS_PARA_CHEFE_PADRAO = 10;

export const CHANCE_EQUIPAMENTO_DROP = 0.08;
export const EQUIPAMENTOS_CHEFE = 2;
export const CHANCE_DROP_COMPATIVEL = 0.6;
export const MULT_OURO_CHEFE = 3;
export const MULT_XP_CHEFE = 3;
export const MULT_DROP_MARCO = 1.1;
export const FRACAO_PRECO_VENDA = 0.4;

export const SLOTS_EQUIPAMENTO = ["capacete", "peitoral", "luvas", "botas", "arma"];

export const CONSUMIVEIS_INICIAIS = { pocao_pequena: 3, eter_menor: 2, tonico: 2 };

export const NIVEL_COMPANHEIRO_MIGRACAO_OFFSET = 2;

// Masmorras (SPEC.md §3.5)
export const ANDARES_MASMORRA = 6; // 5 andares de encontros + o chefe no 6º
export const ANDARES_COM_FOGUEIRA = [2, 4];
export const CURA_FOGUEIRA = 1;
export const DESCANSO_ENTRE_ANDARES = 0.3; // cura (fração da vida máx.) depois de andares sem fogueira
export const VIDA_AO_REVIVER_NA_FOGUEIRA = 0.25;
export const NIVEIS_EXTRA_CHEFE_MASMORRA = 1;
export const NIVEIS_POR_ANDAR = 0.25; // nível dos inimigos: zona.nivelMax + floor((andar − 1) × este valor)

// Atividades por tempo (SPEC.md §3.8, §3.9, §4.10)
export const HORA_MS = 60 * 60 * 1000;
export const TETO_ATIVIDADE_HORAS = 8; // nenhuma atividade dura (nem produz) mais que isso
