// Tipos de la vista EPS, según docs/contrato_api.md («Ejemplo de ficha EPS»).
// Lo que todavía no está en el contrato se marca «por acordar» para revisarlo con el backend.

import type { Procedimiento } from './tramite'

/** Estado del trámite visto por la EPS. Valores por acordar con el backend. */
export type EstadoEps =
  | 'requiere_respuesta'
  | 'requiere_subsanacion'
  | 'en_evaluacion'
  | 'en_consulta'
  | 'autorizado'
  | 'no_autorizado'
  | 'concluido'

export const TONO_ESTADO_EPS: Record<EstadoEps, 'aviso' | 'info' | 'ok' | 'peligro' | 'neutro'> = {
  requiere_respuesta: 'aviso',
  requiere_subsanacion: 'aviso',
  en_evaluacion: 'info',
  en_consulta: 'info',
  autorizado: 'ok',
  no_autorizado: 'peligro',
  concluido: 'neutro',
}

export interface Requisito {
  id: string
  texto: string
  preparado: boolean
}

/** Tarea en la que la EPS presenta algo por Mesa de Partes (respuesta o subsanación). */
export interface SiguienteAccionEps {
  tipo: 'informar_presentacion'
  /** Por acordar: «Respuesta» o «Subsanación». */
  etiqueta: string
  /** Por acordar: título de la tarea, por ejemplo «Responde el Oficio 156» o «Completa tu solicitud». */
  titulo: string
  /** Texto del botón, por ejemplo «Preparar respuesta». */
  texto: string
  /** Por acordar: qué hacer, en lenguaje sencillo, cuando no hay lista de puntos. */
  instrucciones: string | null
  canal: string
  /** null cuando la fecha no está registrada: la EPS la revisa en su notificación. */
  fecha_limite: string | null
  fecha_texto: string | null
  /** Por acordar: cómo se calculó el plazo, o dónde revisarlo («plazo indicado en tu oficio»). */
  fecha_detalle: string | null
  dias_restantes: number | null
  fuente_documento_id: string | null
  requisitos: Requisito[]
}

/** Por acordar: aviso sin tarea obligatoria (participación opcional o trámite concluido). */
export interface AvisoEps {
  tipo: 'participacion' | 'concluido'
  titulo: string
  /** «Difusión pública · ejemplo simulado», «Trámite concluido». */
  etiqueta: string
  texto: string
  /** Canal oficial publicado, si existe. */
  enlace: string | null
}

export interface DocumentoEps {
  id: string
  titulo: string
  pagina: number | null
  /** Por acordar: resumen en lenguaje sencillo de lo que pide el documento. */
  resumen?: string
}

/** Por acordar: pasos del trámite contados a la EPS. */
export interface PasoSeguimiento {
  titulo: string
  fecha_texto: string
  estado: 'hecho' | 'actual' | 'pendiente'
}

/** Respuesta que la EPS informó y que SUNASS todavía debe verificar. */
export interface RespuestaInformada {
  documento: string
  fecha_presentacion: string
  fecha_texto: string
  canal: string
  cargo: string | null
  verificada: boolean
}

/** Ficha EPS: GET /api/eps/tramites/{id}. */
export interface TramiteEps {
  id: string
  eps: string
  procedimiento: Procedimiento
  titulo: string
  estado: EstadoEps
  estado_texto: string
  resumen: string
  simulado: boolean
  siguiente_accion: SiguienteAccionEps | null
  aviso: AvisoEps | null
  documentos: DocumentoEps[]
  seguimiento: PasoSeguimiento[]
  respuesta_informada: RespuestaInformada | null
}

/** Fila del listado EPS: GET /api/eps/tramites. Campos por acordar. */
export interface TramiteEpsResumen {
  id: string
  eps: string
  procedimiento: Procedimiento
  titulo: string
  estado: EstadoEps
  estado_texto: string
  /** «respuesta pendiente», «resuelto el 3 mar». */
  detalle: string
  simulado: boolean
  pendiente: {
    titulo: string
    fecha_texto: string | null
    fecha_detalle: string | null
    dias_restantes: number | null
    listos: number
    total: number
  } | null
  /** Última respuesta informada que SUNASS aún no verifica. */
  respuesta: { documento: string; fecha_texto: string } | null
}

/** Cuerpo de POST /api/eps/tramites/{id}/respuestas. */
export interface NuevaRespuesta {
  documento: string
  fecha_presentacion: string
  cargo: string | null
  canal: string
}
