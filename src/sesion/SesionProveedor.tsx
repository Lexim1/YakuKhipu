import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { escucharSesionPerdida } from '../services/api'
import { cerrarSesion, iniciarSesion, obtenerSesion } from '../services/sesion'
import type { Credenciales, Sesion } from '../types/sesion'
import { ContextoSesion, type ValorSesion } from './contexto'

/** Consulta la sesión al abrir el portal y la comparte con todas las pantallas. */
export function SesionProveedor({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<ValorSesion['estado']>('cargando')
  const [sesion, setSesion] = useState<Sesion | null>(null)

  useEffect(() => {
    const control = new AbortController()
    obtenerSesion(control.signal)
      .then((actual) => {
        setSesion(actual)
        setEstado('listo')
      })
      .catch(() => {
        // Si el servidor no responde, se muestra el ingreso; ahí aparecerá el error al intentar entrar.
        if (control.signal.aborted) return
        setSesion(null)
        setEstado('listo')
      })
    return () => control.abort()
  }, [])

  // Un 401 en cualquier pantalla significa que la sesión venció.
  useEffect(() => escucharSesionPerdida(() => setSesion(null)), [])

  const ingresar = useCallback(async (credenciales: Credenciales) => {
    const nueva = await iniciarSesion(credenciales)
    setSesion(nueva)
    return nueva
  }, [])

  const salir = useCallback(async () => {
    try {
      await cerrarSesion()
    } finally {
      setSesion(null)
    }
  }, [])

  const valor = useMemo(() => ({ estado, sesion, ingresar, salir }), [estado, sesion, ingresar, salir])
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
