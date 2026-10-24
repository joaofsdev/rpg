// Storage em memória com a mesma interface do localStorage (para testes)
export function criarStorageMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
    chaves: () => [...dados.keys()],
  };
}
