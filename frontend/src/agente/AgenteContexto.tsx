import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Contexto } from './contexto'
import type { ContextoAgente } from './tipos'

export function AgenteProveedor({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [contexto, setContexto] = useState<ContextoAgente | null>(null)
  const [preguntaInicial, setPreguntaInicial] = useState<string | null>(null)

  const abrir = useCallback((pregunta?: string) => {
    setPreguntaInicial(pregunta ?? null)
    setAbierto(true)
  }, [])
  const cerrar = useCallback(() => setAbierto(false), [])

  const valor = useMemo(
    () => ({ abierto, contexto, preguntaInicial, abrir, cerrar, registrar: setContexto }),
    [abierto, contexto, preguntaInicial, abrir, cerrar],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
