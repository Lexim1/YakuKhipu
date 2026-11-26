import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Cargando } from '../components/Mensajes'
import { INICIO_PERFIL, type PerfilSesion } from '../types/sesion'
import { useSesion } from './useSesion'

/**
 * Muestra la vista solo al perfil que corresponde. Sin sesión, lleva al ingreso y recuerda a dónde
 * volver; con otro perfil, lleva a la pantalla inicial de ese perfil.
 * La protección real la hace el backend: esto solo ordena la navegación.
 */
export function RequiereSesion({ perfil, children }: { perfil: PerfilSesion; children: ReactNode }) {
  const { estado, sesion } = useSesion()
  const ubicacion = useLocation()

  if (estado === 'cargando') {
    return (
      <main id="contenido" className="publico">
        <Cargando texto="Revisando tu sesión…" />
      </main>
    )
  }
  if (!sesion) {
    const volver = `${ubicacion.pathname}${ubicacion.search}`
    return <Navigate to={`/?volver=${encodeURIComponent(volver)}`} replace />
  }
  if (sesion.perfil !== perfil) return <Navigate to={INICIO_PERFIL[sesion.perfil]} replace />
  return <>{children}</>
}
