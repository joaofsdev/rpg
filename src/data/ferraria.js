// Ferraria (SPEC.md §3.11). Os materiais vêm da zona: o principal é o material de maior peso na
// tabela de expedição da zona; o secundário, o outro material dela.

// Forjar: qualquer slot e tipo, com os materiais da zona escolhida
export const FORJA = {
  materialPrincipal: { arma: 8, armadura: 6 },
  materialSecundario: { arma: 4, armadura: 3 },
  ouroPorNivel: 15, // ouro = este valor × nível máximo da zona
  raridadeMinima: "Incomum",
};

// Aprimorar para +N: 2N do principal, N do secundário e ouro = este valor × nível do item × N
export const APRIMORAMENTO_MAX = 5;
export const APRIMORAR = {
  materialPrincipalPorNivel: 2,
  materialSecundarioPorNivel: 1,
  ouroPorNivelDoItem: 3,
};
