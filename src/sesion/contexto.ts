import { createContext } from 'react'
import type { Sesion } from '../types/sesion'

export interface ValorSesion {
  /** «cargando» mientras se consulta si ya hay una sesión abierta. */
  estado: 'cargando' | 'listo'
  sesion: Sesion | null
  salir: () => Promise<void>
}

export const ContextoSesion = createContext<ValorSesion | null>(null)
