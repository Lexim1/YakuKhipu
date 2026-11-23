import { createContext } from 'react'
import type { ContextoAgente } from './tipos'

export interface ValorAgente {
  abierto: boolean
  contexto: ContextoAgente | null
  preguntaInicial: string | null
  abrir: (pregunta?: string) => void
  cerrar: () => void
  registrar: (contexto: ContextoAgente | null) => void
}

export const Contexto = createContext<ValorAgente | null>(null)
