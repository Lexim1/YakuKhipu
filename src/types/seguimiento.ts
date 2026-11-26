// Tipos de las vistas de seguimiento (Dashboard, Ficha 360, actos externos, encargos, reportes y configuración).
// Por acordar con el backend: hoy solo existen como datos de demostración (src/mocks/seguimiento.ts).

import type { Tono } from '../components/Chip'

export interface EstadoChip {
  texto: string
  tono: Tono
}

export interface DashboardSimulado {
  monto_evaluacion: { valor: string; detalle: string }
  resueltos: { valor: number; detalle: string }
  demora_por_etapa: { etapa: string; dias: number }[]
  resueltos_por_mes: { mes: string; dentro: number; fuera: number }[]
  impacto: { etiqueta: string; valor: string; detalle: string }[]
}

export interface FichaEps {
  id: string
  nombre: string
  descripcion: string
  calificacion: string
  indicadores: { etiqueta: string; valor: string; detalle: string }[]
  tramites: { id: string; titulo: string; detalle: string; estado: EstadoChip }[]
  metas: { meta: string; avance: string; porcentaje: number }[]
}

export interface ResumenActo {
  cifra: string
  unidad: string
  monto: string
  desglose: { etiqueta: string; valor: string }[]
  financia: string
  /** Cómo cambió la cifra entre documentos, con la fuente de cada valor. */
  cambios: { paso: string; valor: string; fuente: string }[]
  sustento: string[]
}

export interface ActoExterno {
  id: string
  tramite_id: string
  titulo: string
  decision: string
  monto: string
  plazo: EstadoChip
  documentos: string[]
  resumen: ResumenActo | null
}

export type EstadoEncargo = 'en_curso' | 'pendiente' | 'hecho'

export interface Encargo {
  encargo: string
  detalle: string
  decision: string
  eps: string
  /** Cargo o área responsable, nunca el nombre de una persona. */
  responsable: string
  area: string
  vence: string
  estado: EstadoEncargo
}

export interface Reporte {
  titulo: string
  detalle: string
  formato: 'Excel' | 'PDF'
  actualizado: string
}

export interface ReglaPlazo {
  procedimiento: string
  base: string
  plazo: string
  alerta: string
}

export interface AccesoPerfil {
  perfil: string
  ambito: string
  trazabilidad: string
  acciones: string
  configuracion: string
}
