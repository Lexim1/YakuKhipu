// Servicios de sesión. El backend guarda la sesión en una cookie firmada; el perfil y la EPS
// siempre salen del servidor, nunca de lo que elige el navegador.
//
// POST /api/sesion con { usuario_id, password }, GET /api/sesion (sesión actual)
// y DELETE /api/sesion (cerrar sesión).

import { ErrorApi, ejemplo, pedirJson, usarEjemplos } from './api'
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

export async function cerrarSesion(): Promise<void> {
  if (usarEjemplos) {
    sesionEnMemoria = null
    escribirAlmacen(null)
    return
  }
  await pedirJson<void>('/api/sesion', { method: 'DELETE' })
}
