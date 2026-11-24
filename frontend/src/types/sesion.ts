// Sesión del portal. Sigue la respuesta de /api/sesion del backend (app/api/sesion.py).

export type PerfilSesion = 'sunass' | 'eps'

export interface Sesion {
  usuario_id: string
  /** Cargo visible, nunca el nombre de la persona: «Especialista SRT · Equipo 1». */
  nombre: string
  perfil: PerfilSesion
  eps_id: string | null
  eps: string | null
  /** true mientras la sesión sea de demostración. */
  simulado: boolean
}

export interface Credenciales {
  usuario: string
  clave: string
}

/** Pantalla inicial de cada perfil después de ingresar. */
export const INICIO_PERFIL: Record<PerfilSesion, string> = {
  sunass: '/sunass/te-toca',
  eps: '/eps/tramites',
}
