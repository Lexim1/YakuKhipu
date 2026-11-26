// Servicios de sesión. El backend guarda la sesión en una cookie firmada; el perfil y la EPS
// siempre salen del servidor, nunca de lo que elige el navegador.
//
// El navegador va a GET /api/auth/login; Keycloak pide la clave y vuelve a /api/auth/callback,
//   que abre la sesión. El navegador nunca recibe tokens (patrón BFF).
// GET /api/sesion devuelve la sesión actual y DELETE /api/sesion la cierra.

import { ErrorApi, baseUrl, pedir, pedirJson } from './api'

export interface EstadoServidor {
  carga_pdf: boolean
}

let estadoServidor: Promise<EstadoServidor> | null = null

/** Consulta si el almacenamiento privado de PDF está habilitado. */
export function obtenerEstadoServidor(): Promise<EstadoServidor> {
  estadoServidor ??= pedirJson<{ carga_pdf?: string }>('/health')
    .then((h) => ({ carga_pdf: h.carga_pdf === 'habilitada' }))
    .catch(() => {
      estadoServidor = null
      return { carga_pdf: false }
    })
  return estadoServidor
}

/** Inicio del ingreso institucional: el backend redirige a Keycloak. Es una navegación, no una consulta. */
export const URL_INGRESO_INSTITUCIONAL = `${baseUrl}/api/auth/login`
import type { Sesion } from '../types/sesion'

/** Sesión actual, o null si nadie inició sesión. */
export async function obtenerSesion(signal?: AbortSignal): Promise<Sesion | null> {
  try {
    return await pedirJson<Sesion>('/api/sesion', { signal })
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) return null
    throw error
  }
}

/**
 * Cierra la sesión del portal. Con ingreso institucional devuelve la dirección para cerrar también la sesión
 * de Keycloak (cabecera X-Logout-URL); si no la hay, devuelve null.
 */
export async function cerrarSesion(): Promise<string | null> {
  const respuesta = await pedir('/api/sesion', { method: 'DELETE' })
  return respuesta.headers.get('X-Logout-URL')
}
