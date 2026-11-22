// Tipos de la consulta ciudadana, según docs/contrato_api.md (sección Consulta ciudadana).
// La API pública solo entrega campos habilitados para publicación.

import type { Procedimiento } from './tramite'

export type EstadoPublico = 'en_evaluacion' | 'en_consulta' | 'decision_publicada'

export const TEXTO_ESTADO_PUBLICO: Record<EstadoPublico, string> = {
  en_evaluacion: 'En evaluación',
  en_consulta: 'En consulta',
  decision_publicada: 'Decisión publicada',
}

/** Nombres en lenguaje sencillo para la ciudadanía. */
export const PROCEDIMIENTO_SENCILLO: Record<Procedimiento, string> = {
  CPI: 'Cambio en el plan de inversiones',
  UFI: 'Uso del fondo de inversiones',
  RP: 'Revisión de tarifas',
}

/** Cantidad publicada: siempre con unidad, fecha, origen y su condición. */
export interface CantidadPublica {
  valor: number
  unidad: string
  texto: string
  fecha: string
  origen: string
  simulado: boolean
  estimado: boolean
  /** Por acordar: monto asociado a la cantidad, por ejemplo «S/ 3 817 752». */
  monto_texto?: string | null
}

export interface FuentePublica {
  id: string
  titulo: string
  pagina: number | null
  articulo: string | null
  enlace: string | null
}

export interface DecisionResumen {
  id: string
  eps: string
  localidad: string
  procedimiento: Procedimiento
  titulo: string
  estado_publico: EstadoPublico
  /** Línea destacada de la tarjeta: «19 935 medidores · S/ 3 817 752». */
  cifra: string
  /** Texto junto al estado: fecha de la decisión, día del plazo o fecha para opinar. */
  nota_estado: string
  resumen_ciudadano: string
  fecha_actualizacion: string
  autorizado: CantidadPublica | null
  /** Hay una ficha pública con fuentes para esta decisión. */
  ficha_disponible: boolean
  simulado: boolean
}

/** Cifra general del sector con su fuente («El agua en el Perú, en cifras de Sunass»). */
export interface CifraSector {
  valor: string
  texto: string
  fuente: string
}

export interface ListaPublica<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** Ficha pública completa (la implementa la tarea de la ficha ciudadana). */
export interface DecisionPublica extends DecisionResumen {
  solicitado: CantidadPublica | null
  ejecutado: CantidadPublica | null
  impacto: {
    /** Por acordar: pregunta que responde el dato, por ejemplo «¿Dónde?». */
    pregunta: string
    /** null cuando el dato todavía no existe: se muestra «No disponible». */
    texto: string | null
    condicion: 'verificado' | 'estimado' | 'simulado'
    fuente_id: string | null
    /** Por acordar: fuente que sustentará un dato simulado, por ejemplo «INEI, por distrito». */
    fuente_prevista: string | null
  }[]
  fuentes: FuentePublica[]
  /** Consulta o audiencia pública, si está publicada (contrato: fecha límite y enlace oficial). */
  consulta: {
    audiencia_texto: string | null
    fecha_limite: string
    fecha_limite_texto: string
    enlace: string | null
  } | null
}
