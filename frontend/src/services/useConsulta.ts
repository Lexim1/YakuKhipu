import { useCallback, useEffect, useState } from 'react'
import { ErrorApi } from './api'

export type ResultadoConsulta<T> =
  { estado: 'cargando' } | { estado: 'error'; mensaje: string; codigo: number } | { estado: 'listo'; datos: T }

/**
 * Ejecuta un servicio al montar la pantalla y cada vez que cambian sus dependencias.
 * Cancela la consulta anterior y permite reintentar después de un error.
 */
export function useConsulta<T>(
  servicio: (signal: AbortSignal) => Promise<T>,
  dependencias: unknown[],
): [ResultadoConsulta<T>, () => void] {
  const [resultado, setResultado] = useState<ResultadoConsulta<T>>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const control = new AbortController()
    setResultado({ estado: 'cargando' })
    servicio(control.signal)
      .then((datos) => setResultado({ estado: 'listo', datos }))
      .catch((error: unknown) => {
        if (control.signal.aborted) return
        const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
        const codigo = error instanceof ErrorApi ? error.estado : 0
        setResultado({ estado: 'error', mensaje, codigo })
      })
    return () => control.abort()
    // El servicio cambia en cada render; las dependencias indican cuándo repetir la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return [resultado, reintentar]
}
