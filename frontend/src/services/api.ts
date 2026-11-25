// Acceso compartido a la API. Todas las pantallas consultan el backend desde aquí.

/** Error con un mensaje comprensible para la persona que usa el portal. */
export class ErrorApi extends Error {
  readonly estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
  }
}

const MENSAJES: Record<number, string> = {
  401: 'Tu sesión venció. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para ver esta información.',
  404: 'No encontramos lo que buscas o no tienes acceso.',
  409: 'El trámite cambió mientras trabajabas. Actualiza la página.',
  422: 'Hay datos que no son válidos. Revisa el formulario.',
}

/** true cuando el equipo elige explícitamente los ejemplos simulados (solo desarrollo). */
export const usarEjemplos = import.meta.env.VITE_USAR_EJEMPLOS === 'true'
export const baseUrl = import.meta.env.VITE_API_URL || ''

export async function pedir(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, {
      credentials: 'include',
      ...opciones,
      headers: { Accept: 'application/json', ...opciones.headers },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrorApi(0, 'No pudimos conectar con el servidor. Revisa tu conexión.')
  }

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null)
    if (respuesta.status === 401 && ruta !== '/api/sesion') window.dispatchEvent(new Event('sesion-vencida'))
    throw new ErrorApi(respuesta.status, error?.detail ?? MENSAJES[respuesta.status] ?? 'Ocurrió un error inesperado.')
  }
  return respuesta
}

export async function pedirJson<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await pedir(ruta, opciones)
  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

/** Devuelve un ejemplo simulado con una pequeña espera, para ver el estado de carga. */
export function ejemplo<T>(datos: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => resolver(structuredClone(datos)), 300)
    signal?.addEventListener('abort', () => {
      clearTimeout(temporizador)
      rechazar(new DOMException('Consulta cancelada', 'AbortError'))
    })
  })
}

/** Error de ejemplo, para comprobar cómo se ven los 404 en modo simulado. */
export function noEncontrado(): never {
  throw new ErrorApi(404, MENSAJES[404])
}
