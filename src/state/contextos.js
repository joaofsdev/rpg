import { createContext, useContext } from "react";

export const EstadoContext = createContext(null);
export const AcoesContext = createContext(null);

export function useEstado() {
  return useContext(EstadoContext);
}

export function useAcoes() {
  return useContext(AcoesContext);
}
