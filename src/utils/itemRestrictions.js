export function podeEquiparArma(classeData, item) {
  if (item.tipo !== 'arma') return true
  return classeData.armasPermitidas.includes(item.tipoArma)
}

export function podeEquiparArmadura(classeData, item) {
  if (item.tipo === 'arma') return true
  if (!item.pesoArmadura) return true
  return classeData.armadurasPermitidas.includes(item.pesoArmadura)
}

export function podeEquipar(classeData, item) {
  if (item.tipo === 'arma') return podeEquiparArma(classeData, item)
  return podeEquiparArmadura(classeData, item)
}
