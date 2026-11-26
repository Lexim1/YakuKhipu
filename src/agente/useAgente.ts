import { useContext, useEffect } from 'react'
import { Contexto } from './contexto'
import type { ContextoAgente } from './tipos'

export function useAgente() {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useAgente debe usarse dentro de AgenteProveedor')
  return valor
}

/** Cada pantalla indica al agente sobre qué puede responder mientras está abierta. */
export function useContextoAgente(contexto: ContextoAgente | null) {
  const { registrar } = useAgente()
  const caso = contexto?.consulta
    ? contexto.consulta.tipo === 'publico'
      ? contexto.consulta.caso_id
      : contexto.consulta.tramite_id
    : ''
  const clave = contexto ? `${contexto.espacio}|${contexto.preguntas.length}|${caso}` : ''
  useEffect(() => {
    registrar(contexto)
    return () => registrar(null)
    // La clave resume el contexto: evita registrar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
}
