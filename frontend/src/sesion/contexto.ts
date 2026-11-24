import { createContext } from 'react'
import type { Credenciales, Sesion } from '../types/sesion'

export interface ValorSesion {
  /** «cargando» mientras se consulta si ya hay una sesión abierta. */
  estado: 'cargando' | 'listo'
  sesion: Sesion | null
  ingresar: (credenciales: Credenciales) => Promise<Sesion>
  salir: () => Promise<void>
}

export const ContextoSesion = createContext<ValorSesion | null>(null)
