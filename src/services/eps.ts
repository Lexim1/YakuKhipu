// Servicios de la vista EPS. Las rutas siguen docs/contrato_api.md.
// La sesión de la EPS la valida el backend: el frontend no envía qué EPS es.

import { ErrorApi, ejemplo, noEncontrado, pedirJson, usarEjemplos } from './api'
import { FICHAS_EPS, FICHAS_EPS_OTROS_ESTADOS, resumirFicha } from '../mocks/eps'
import type { ListaPaginada } from '../types/tramite'
import type { NuevaRespuesta, TramiteEps, TramiteEpsResumen } from '../types/eps'

// En modo de ejemplos, las respuestas informadas viven en memoria mientras la pestaña esté abierta.
const fichas = new Map([...FICHAS_EPS, ...FICHAS_EPS_OTROS_ESTADOS].map((f) => [f.id, f]))
const enLista = new Set(FICHAS_EPS.map((f) => f.id))
/** Respuestas ya registradas por clave de idempotencia: repetir el mismo envío devuelve el mismo resultado. */
const enviosRegistrados = new Map<string, TramiteEps>()

export function listarMisTramites(signal?: AbortSignal): Promise<ListaPaginada<TramiteEpsResumen>> {
  if (usarEjemplos) {
    const items = [...fichas.values()].filter((f) => enLista.has(f.id)).map(resumirFicha)
    return ejemplo({ items, total: items.length }, signal)
  }
  return pedirJson('/api/eps/tramites', { signal })
}

export async function obtenerTramiteEps(id: string, signal?: AbortSignal): Promise<TramiteEps> {
  if (usarEjemplos) return ejemplo(fichas.get(id) ?? noEncontrado(), signal)
  return pedirJson(`/api/eps/tramites/${encodeURIComponent(id)}`, { signal })
}

/**
 * La EPS informa que ya presentó su respuesta por Mesa de Partes.
 * La clave de idempotencia evita registrar dos veces la misma respuesta si se reintenta el envío
 * (cabecera por acordar con el backend).
 */
export async function informarRespuesta(id: string, datos: NuevaRespuesta, clave: string): Promise<TramiteEps> {
  if (usarEjemplos) {
    const repetido = enviosRegistrados.get(clave)
    if (repetido) return ejemplo(repetido)
    const actual = fichas.get(id) ?? noEncontrado()
    // Otro envío distinto cuando ya no hay tarea: el backend respondería 409.
    if (!actual.siguiente_accion) {
      throw new ErrorApi(409, 'Esta respuesta ya fue informada. Revisa el seguimiento del trámite.')
    }
    const actualizada = aplicarRespuesta(actual, datos)
    fichas.set(id, actualizada)
    enviosRegistrados.set(clave, actualizada)
    return ejemplo(actualizada)
  }
  return pedirJson(`/api/eps/tramites/${encodeURIComponent(id)}/respuestas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave },
    body: JSON.stringify(datos),
  })
}

/** Fecha corta en español: «14 ago». */
export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
    .toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

/** Lo que hará el backend al recibir la respuesta: queda pendiente de verificación por SUNASS. */
function aplicarRespuesta(f: TramiteEps, datos: NuevaRespuesta): TramiteEps {
  const fecha_texto = fechaCorta(datos.fecha_presentacion)
  const pedido = f.seguimiento.findIndex((p) => p.estado === 'actual')
  const anteriores = pedido >= 0 ? f.seguimiento.slice(0, pedido) : f.seguimiento.filter((p) => p.estado === 'hecho')
  return {
    ...f,
    estado: 'en_evaluacion',
    estado_texto: 'Sunass evalúa tu respuesta',
    resumen: 'Sunass está evaluando tu respuesta. Por ahora no tienes ninguna tarea pendiente.',
    siguiente_accion: null,
    aviso: null,
    respuesta_informada: { ...datos, documento: datos.referencia_presentada ?? datos.documento ?? '', fecha_texto, verificada: false },
    seguimiento: [
      ...anteriores,
      {
        titulo: `${f.siguiente_accion?.etiqueta === 'Subsanación' ? 'Subsanaste' : 'Respondiste'} con el ${datos.referencia_presentada ?? datos.documento}`,
        fecha_texto,
        estado: 'hecho',
      },
      { titulo: 'Sunass evalúa tu respuesta', fecha_texto: 'Hoy', estado: 'actual' },
      { titulo: 'Decisión del Consejo Directivo', fecha_texto: 'Te avisaremos cuando se publique', estado: 'pendiente' },
    ],
  }
}
