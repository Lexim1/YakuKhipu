import { pedirJson } from './api'
export interface ResumenFinanzas {
  corte: string
  fuente: string
  simulado: boolean
  eps_disponibles: { id: string; nombre: string }[]
  archivos_fuente: string[]
  total: { programado: number | null; ejecutado: number | null; avance_pct: number | null }
  ejecucion_trimestral: { x: string; y: number | null; proyectos_reportantes: number; eps_reportantes: number }[]
  variacion_trimestral_pct: number | null
  fondos: { x: string; programado: number | null; efectuado: number | null; cumplimiento_pct: number | null; eps_reportantes: number }[]
  menor_avance: { eps_id: string; eps: string; programado: number | null; ejecutado: number | null; avance_pct: number | null }[]
  cobertura: { proyectos_programados: number; proyectos_con_ejecucion: number; eps: number }
  advertencias: string[]
  resueltos: number
  monto_solicitado_en_evaluacion: number | null
  resueltos_por_mes: { mes: string; total: number }[]
  demora_por_etapa: { etapa: string; dias: number; registros: number }[]
  movimientos: { titulo: string; actor: string | null; fecha_acreditada: string | null; tramite_id: string; expediente: string }[]
}
export function consultarFinanzas(signal?: AbortSignal, corte = '', eps = '') {
  const params = new URLSearchParams()
  if (corte) params.set('corte', corte)
  if (eps) params.set('eps_id', eps)
  return pedirJson<ResumenFinanzas>(`/api/finanzas/resumen?${params}`, { signal })
}
export function soles(n: number | null) {
  return n == null ? 'Sin dato publicado' : n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 })
}
export interface FichaFinanciera {
  eps: { id: string; nombre: string; region: string | null }
  corte: string; simulado: boolean; nota: string
  tramites: { id: string; titulo: string; procedimiento: string; estado: string; etapa: string }[]
  datos: Record<string, Record<string, string | number | null>[]>
}
export function consultarFichaEps(id: string, signal?: AbortSignal) {
  return pedirJson<FichaFinanciera>(`/api/finanzas/eps/${encodeURIComponent(id)}`, { signal })
}
