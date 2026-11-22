import type { ReactNode } from 'react'
import { IconoDocumento } from './Iconos'

export type Tono = 'ok' | 'aviso' | 'peligro' | 'info' | 'agente' | 'neutro' | 'marca'

/** Chip de estado: el color siempre va acompañado de texto. */
export function Chip({ tono, children }: { tono: Tono; children: ReactNode }) {
  return <span className={`chip chip--${tono}`}>{children}</span>
}

/** Fuente de un dato: documento y página, numeral o sistema. */
export function Fuente({ children }: { children: ReactNode }) {
  return (
    <span className="fuente">
      <IconoDocumento tamano={12} />
      {children}
    </span>
  )
}
