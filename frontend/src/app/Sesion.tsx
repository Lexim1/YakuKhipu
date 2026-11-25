import { useEffect, useState, type ReactNode } from 'react'
import { ErrorApi, pedir, pedirJson } from '../services/api'
import { ContextoSesion, type Sesion } from './sesionEstado'

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>()
  const [error, setError] = useState('')

  useEffect(() => {
    const abortar = new AbortController()
    const vencer = () => setSesion(null)
    pedirJson<Sesion>('/api/sesion', { signal: abortar.signal }).then(setSesion).catch((fallo) => {
      if (abortar.signal.aborted) return
      if (!(fallo instanceof ErrorApi && fallo.estado === 401)) setError('El servicio de sesión no está disponible.')
      setSesion(null)
    })
    window.addEventListener('sesion-vencida', vencer)
    return () => {
      abortar.abort()
      window.removeEventListener('sesion-vencida', vencer)
    }
  }, [])

  async function salir() {
    const respuesta = await pedir('/api/sesion', { method: 'DELETE' })
    setSesion(null)
    window.location.assign(respuesta.headers.get('X-Logout-URL') || '/')
  }

  return <ContextoSesion.Provider value={{ sesion, error, salir }}>{children}</ContextoSesion.Provider>
}
