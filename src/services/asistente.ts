// Asistente con fuentes. Sigue backend/app/schemas/agente.py y docs/contrato_api.md:
// - POST /api/agente/chat              { pregunta, tramite_id, conversacion_id }  (SUNASS y EPS, con sesión)
// - POST /api/publico/asistente/chat   { pregunta, caso_id, conversacion_id }     (ciudadanía, sin sesión)
// - GET  <enlace de la cita>           texto de la página citada (el backend arma el enlace según el acceso)
// El backend decide qué fuentes puede ver cada perfil: el navegador nunca elige el conjunto de documentos.

import type { CasoAgente, PreguntaAgente } from '../agente/tipos'
import { ErrorApi, ejemplo, pedirJson, urlApi, usarEjemplos } from './api'

export interface FuenteCita {
  documento_id: string
  titulo: string
  fragmento_id: string
  pagina_pdf: number | null
  extracto: string
  /** Solo viene si la persona puede abrir el documento. En ciudadanía, solo fuentes publicadas. */
  enlace: string | null
}

export interface RespuestaAgente {
  estado: 'ok' | 'sin_fuentes' | 'no_disponible'
  respuesta: string
  fuentes: FuenteCita[]
  advertencias: string[]
  conversacion_id: string
  desde_cache?: boolean
}

export interface PaginaFuente {
  pagina_pdf: number | null
  pagina_impresa: string | null
  texto: string
  requiere_ocr: boolean
}

export interface ContenidoFuente {
  id: string
  titulo: string
  referencia: string | null
  visibilidad: string
  estado_validacion: string
  simulado: boolean
  pdf_disponible: boolean
  paginas: PaginaFuente[]
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Respuesta preparada con los datos de la pantalla. Con `exacta`, solo si es una de las preguntas sugeridas;
 * si no, también cuando la pregunta contiene sus palabras clave (modo de ejemplos).
 */
export function respuestaDePantalla(
  pregunta: string,
  preguntas: PreguntaAgente[],
  exacta = false,
): PreguntaAgente | null {
  const t = normalizar(pregunta.trim())
  // Primero la pregunta idéntica: una sugerida nunca debe recibir la respuesta de otra que comparte palabras.
  const identica = preguntas.find((p) => normalizar(p.pregunta) === t)
  if (identica || exacta) return identica ?? null
  return preguntas.find((p) => (p.palabras ?? []).some((palabra) => t.includes(normalizar(palabra)))) ?? null
}

/** Cita sin enlace, para las respuestas preparadas en la pantalla. */
export function citaDeTexto(titulo: string): FuenteCita {
  return { documento_id: '', titulo, fragmento_id: titulo, pagina_pdf: null, extracto: '', enlace: null }
}

/** Respuesta de ejemplo: usa las preguntas preparadas de la pantalla. */
function responderConEjemplos(pregunta: string, preguntas: PreguntaAgente[], signal?: AbortSignal) {
  const elegida = respuestaDePantalla(pregunta, preguntas)
  const respuesta: RespuestaAgente = elegida
    ? {
        estado: 'ok',
        respuesta: elegida.respuesta,
        fuentes: elegida.fuentes.map(citaDeTexto),
        advertencias: [],
        conversacion_id: 'ejemplo',
      }
    : {
        // Mensaje propio de la demostración: no se marca «sin fuentes» para no repetir el aviso.
        estado: 'ok',
        respuesta:
          'En esta demostración el agente responde las preguntas sugeridas. Con el backend conectado, busca en los documentos del caso y cita la página.',
        fuentes: [],
        advertencias: [],
        conversacion_id: 'ejemplo',
      }
  return ejemplo(respuesta, signal)
}

/**
 * Pregunta al agente sobre un caso. Las respuestas preparadas solo existen en modo de ejemplos.
 */
export async function preguntarAlAgente(
  datos: { caso?: CasoAgente; pregunta: string; preguntas: PreguntaAgente[]; conversacionId: string | null },
  signal?: AbortSignal,
): Promise<RespuestaAgente> {
  const { caso, pregunta, preguntas, conversacionId } = datos
  if (usarEjemplos) return responderConEjemplos(pregunta, preguntas, signal)
  if (!caso) throw new ErrorApi(400, 'Abre un expediente o una decisión para consultar sus documentos. Para próximos vencimientos, revisa Alertas.')

  const ruta = caso.tipo === 'publico' ? '/api/publico/asistente/chat' : '/api/agente/chat'
  const cuerpo =
    caso.tipo === 'publico'
      ? { pregunta, caso_id: caso.id, conversacion_id: conversacionId }
      : { pregunta, tramite_id: caso.id, conversacion_id: conversacionId }
  try {
    return await pedirJson<RespuestaAgente>(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal,
    })
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 503) {
      throw new ErrorApi(503, 'El agente no está disponible en este momento. El resto del portal sigue funcionando.')
    }
    if (error instanceof ErrorApi && error.estado === 404) {
      throw new ErrorApi(404, 'No encontramos este caso o no tienes acceso a sus documentos.')
    }
    throw error
  }
}

/** Texto de la página citada. El enlace lo arma el backend solo para documentos autorizados. */
export function abrirFuente(enlace: string, signal?: AbortSignal): Promise<ContenidoFuente> {
  return pedirJson<ContenidoFuente>(enlace, { signal })
}

/** Dirección del PDF de la cita, para abrirlo en otra pestaña cuando está disponible. */
export function enlacePdf(enlace: string): string {
  return urlApi(`${enlace}${enlace.includes('?') ? '&' : '?'}formato=pdf`)
}
