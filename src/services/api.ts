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
  429: 'Hiciste muchas consultas seguidas. Intenta de nuevo en unos minutos.',
  503: 'El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.',
}

/** Dirección completa de una ruta de la API, para enlaces que se abren en otra pestaña (por ejemplo, un PDF). */
export function urlApi(ruta: string): string {
  return `${import.meta.env.VITE_API_URL ?? ''}${ruta}`
}

// Cuando el servidor responde 401, la sesión se perdió: el portal vuelve al ingreso.
const alPerderSesion = new Set<() => void>()

/** Registra una función que se llama cuando una consulta responde 401. Devuelve cómo quitarla. */
export function escucharSesionPerdida(fn: () => void): () => void {
  alPerderSesion.add(fn)
  return () => alPerderSesion.delete(fn)
}

/** true cuando el equipo elige explícitamente los ejemplos simulados (solo desarrollo). */
export const usarEjemplos = import.meta.env.VITE_USAR_EJEMPLOS === 'true'

export async function pedirJson<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL
  if (!baseUrl) {
    throw new ErrorApi(0, 'Falta configurar la URL de la API (VITE_API_URL).')
  }

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
    // El ingreso y la consulta de la sesión manejan su propio 401.
    if (respuesta.status === 401 && !ruta.startsWith('/api/sesion')) alPerderSesion.forEach((fn) => fn())
    throw new ErrorApi(respuesta.status, MENSAJES[respuesta.status] ?? 'Ocurrió un error inesperado.')
  }
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
