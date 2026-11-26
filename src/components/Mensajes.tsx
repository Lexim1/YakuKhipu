import type { ReactNode } from 'react'
import type { ResultadoConsulta } from '../services/useConsulta'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando__giro" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function MensajeError({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  return (
    <div className="mensaje mensaje--error" role="alert">
      <p>{mensaje}</p>
      {reintentar && (
        <button type="button" className="boton boton--secundario" onClick={reintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function SinResultados({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="mensaje">
      <h2>{titulo}</h2>
      {children}
    </div>
  )
}

interface ContenidoProps<T> {
  resultado: ResultadoConsulta<T>
  reintentar: () => void
  textoCarga?: string
  children: (datos: T) => ReactNode
}

/** Muestra carga, error o el contenido según el resultado de una consulta. */
export function Contenido<T>({ resultado, reintentar, textoCarga, children }: ContenidoProps<T>) {
  if (resultado.estado === 'cargando') return <Cargando texto={textoCarga} />
  if (resultado.estado === 'error') {
    // Reintentar no ayuda si el recurso no existe o no hay permiso.
    const sinReintento = resultado.codigo === 403 || resultado.codigo === 404
    return <MensajeError mensaje={resultado.mensaje} reintentar={sinReintento ? undefined : reintentar} />
  }
  return <>{children(resultado.datos)}</>
}
