// Agente con fuentes. El perfil y la EPS salen de la sesión del backend; aquí solo se envía el caso.
// SUNASS y EPS: POST /api/agente/chat. Ciudadanía: POST /api/publico/asistente/chat (sin sesión).

import { pedirJson } from './api'
import type { ConsultaAgente } from '../agente/tipos'

export interface FuenteAgente {
  documento_id: string
  titulo: string
  fragmento_id: string
  pagina_pdf: number | null
  extracto: string
  /** Solo llega cuando la persona puede abrir ese documento. Ruta relativa a la API. */
  enlace: string | null
}

export interface RespuestaAgente {
  estado: 'ok' | 'sin_fuentes' | 'no_disponible'
  respuesta: string
  fuentes: FuenteAgente[]
  advertencias: string[]
  conversacion_id: string
  desde_cache: boolean
}

export function preguntarAgente(
  consulta: ConsultaAgente,
  pregunta: string,
  conversacionId: string | null,
): Promise<RespuestaAgente> {
  const publica = consulta.tipo === 'publico'
  const cuerpo = publica
    ? { pregunta, caso_id: consulta.caso_id, conversacion_id: conversacionId }
    : { pregunta, tramite_id: consulta.tramite_id, conversacion_id: conversacionId }
  return pedirJson(publica ? '/api/publico/asistente/chat' : '/api/agente/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    credentials: publica ? 'omit' : 'include',
  })
}

/** URL completa de una fuente citada, o null si la persona no puede abrirla. */
export function urlFuente(enlace: string | null): string | null {
  return enlace ? `${import.meta.env.VITE_API_URL ?? ''}${enlace}` : null
}
