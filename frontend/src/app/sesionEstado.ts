import { createContext, useContext } from 'react'
import { baseUrl } from '../services/api'

type Rol = 'analista_srt' | 'coordinacion_dre' | 'jefatura_dre' | 'eps'

export interface Sesion {
  rol_id: Rol
  perfil: 'sunass' | 'eps'
  nombre: string
  permisos: string[]
}

export const nombresRol: Record<Rol, string> = {
  analista_srt: 'Analista SRT',
  coordinacion_dre: 'Coordinación DRE',
  jefatura_dre: 'Jefatura DRE',
  eps: 'Responsable de EPS',
}

export const urlIngreso = baseUrl + '/api/auth/login'

export const ContextoSesion = createContext<{
  sesion?: Sesion | null
  error: string
  salir: () => Promise<void>
} | null>(null)

export function useSesion() {
  const valor = useContext(ContextoSesion)
  if (!valor) throw new Error('Falta el proveedor de sesión.')
  return valor
}
