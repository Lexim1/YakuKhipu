// Textos de plazo para la vista EPS. Los días hábiles los calcula el backend.
// Si la fecha no está registrada (null), se muestra dónde revisarla, por ejemplo «Plazo indicado en tu oficio».

const SIN_FECHA = 'Plazo indicado en tu oficio'

function dias(n: number) {
  return `${n} ${n === 1 ? 'día hábil' : 'días hábiles'}`
}

/** «Vence en 2 días hábiles», «Vence hoy» o «Venció hace 1 día hábil». */
export function textoPlazo(diasRestantes: number | null, detalle: string | null = null): string {
  if (diasRestantes == null) return detalle ?? SIN_FECHA
  if (diasRestantes > 0) return `Vence en ${dias(diasRestantes)}`
  if (diasRestantes === 0) return 'Vence hoy'
  return `Venció hace ${dias(-diasRestantes)}`
}

/** «Vence el 14 ago · 2 días hábiles», «Vence hoy, 14 ago» o «Venció el 14 ago». */
export function textoFechaLimite(fecha: string | null, diasRestantes: number | null, detalle: string | null = null) {
  if (fecha == null || diasRestantes == null) return detalle ?? SIN_FECHA
  if (diasRestantes > 0) return `Vence el ${fecha} · ${dias(diasRestantes)}`
  if (diasRestantes === 0) return `Vence hoy, ${fecha}`
  return `Venció el ${fecha}`
}

export function tonoPlazo(diasRestantes: number | null): 'peligro' | 'aviso' | 'ok' {
  if (diasRestantes == null) return 'aviso'
  if (diasRestantes < 0) return 'peligro'
  if (diasRestantes <= 3) return 'aviso'
  return 'ok'
}

/** Valor grande de la tarjeta «Tu plazo». */
export function valorPlazo(diasRestantes: number | null): string {
  if (diasRestantes == null) return 'Revisa tu oficio'
  if (diasRestantes < 0) return 'Plazo vencido'
  return dias(diasRestantes)
}
