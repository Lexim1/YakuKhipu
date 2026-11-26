// Servicios de sesión. El backend guarda la sesión en una cookie firmada; el perfil y la EPS
// siempre salen del servidor, nunca de lo que elige el navegador.
//
// Dos modos, según el backend (GET /health → «ingreso»):
// - clave: POST /api/sesion con { usuario_id, password } (desarrollo y pruebas).
// - oidc: el navegador va a GET /api/auth/login; Keycloak pide la clave y vuelve a /api/auth/callback,
//   que abre la sesión. El navegador nunca recibe tokens (patrón BFF).
// GET /api/sesion devuelve la sesión actual y DELETE /api/sesion la cierra.

import { ErrorApi, baseUrl, ejemplo, pedir, pedirJson, usarEjemplos } from './api'

export type ModoIngreso = 'clave' | 'oidc'

export interface EstadoServidor {
  ingreso: ModoIngreso
  carga_pdf: boolean
}

let estadoServidor: Promise<EstadoServidor> | null = null

/** Cómo se ingresa y si hay carga de PDF. Se consulta una vez; si /health no responde, se asume contraseña. */
export function obtenerEstadoServidor(): Promise<EstadoServidor> {
  if (usarEjemplos) return Promise.resolve({ ingreso: 'clave', carga_pdf: false })
  estadoServidor ??= pedirJson<{ ingreso?: string; carga_pdf?: string }>('/health')
    .then((h) => ({ ingreso: h.ingreso === 'oidc' ? 'oidc' : 'clave', carga_pdf: h.carga_pdf === 'habilitada' }) as const)
    .catch(() => {
      estadoServidor = null
      return { ingreso: 'clave', carga_pdf: false } as const
    })
  return estadoServidor
}

/** Inicio del ingreso institucional: el backend redirige a Keycloak. Es una navegación, no una consulta. */
export const URL_INGRESO_INSTITUCIONAL = `${baseUrl}/api/auth/login`
import { CLAVE_DEMO, USUARIOS_DEMO } from '../mocks/sesion'
import type { Credenciales, Sesion } from '../types/sesion'

// En modo de ejemplos, la sesión se recuerda solo en esta pestaña.
const CLAVE_ALMACEN = 'yakukhipu.sesion-demo'

function leerAlmacen(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_ALMACEN)
  } catch {
    return null
  }
}

function escribirAlmacen(valor: string | null) {
  try {
    if (valor) sessionStorage.setItem(CLAVE_ALMACEN, valor)
    else sessionStorage.removeItem(CLAVE_ALMACEN)
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar la página.
  }
}

let sesionEnMemoria: string | null = null

/** Sesión actual, o null si nadie inició sesión. */
export async function obtenerSesion(signal?: AbortSignal): Promise<Sesion | null> {
  if (usarEjemplos) {
    const id = sesionEnMemoria ?? leerAlmacen()
    return ejemplo(USUARIOS_DEMO.find((u) => u.usuario_id === id) ?? null, signal)
  }
  try {
    return await pedirJson<Sesion>('/api/sesion', { signal })
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) return null
    throw error
  }
}

export async function iniciarSesion(credenciales: Credenciales): Promise<Sesion> {
  const usuario = credenciales.usuario.trim().toLowerCase()
  if (usarEjemplos) {
    await ejemplo(null)
    const encontrado = USUARIOS_DEMO.find((u) => u.usuario_id === usuario)
    if (!encontrado || credenciales.clave !== CLAVE_DEMO) {
      throw new ErrorApi(401, 'Usuario o contraseña incorrectos.')
    }
    sesionEnMemoria = encontrado.usuario_id
    escribirAlmacen(encontrado.usuario_id)
    return encontrado
  }
  try {
    return await pedirJson<Sesion>('/api/sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Contrato del backend (app/api/sesion.py): { usuario_id, password }.
      body: JSON.stringify({ usuario_id: usuario, password: credenciales.clave }),
    })
  } catch (error) {
    // En el ingreso, 401 significa credenciales incorrectas, no una sesión vencida.
    if (error instanceof ErrorApi && (error.estado === 401 || error.estado === 403)) {
      throw new ErrorApi(error.estado, 'Usuario o contraseña incorrectos.')
    }
    throw error
  }
}

/**
 * Cierra la sesión del portal. Con ingreso institucional devuelve la dirección para cerrar también la sesión
 * de Keycloak (cabecera X-Logout-URL); si no la hay, devuelve null.
 */
export async function cerrarSesion(): Promise<string | null> {
  if (usarEjemplos) {
    sesionEnMemoria = null
    escribirAlmacen(null)
    return null
  }
  const respuesta = await pedir('/api/sesion', { method: 'DELETE' })
  return respuesta.headers.get('X-Logout-URL')
}
