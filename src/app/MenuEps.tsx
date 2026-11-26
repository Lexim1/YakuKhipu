import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { Gotita } from '../components/Gotita'
import { IconoFlecha, IconoTarea } from '../components/Iconos'
import { listarMisTramites } from '../services/eps'
import { useVersionTramites } from '../services/tramites'
import type { TramiteEpsResumen } from '../types/eps'

/**
 * Enlaces de la EPS que dependen de su trámite activo: «Siguiente paso» y «Seguimiento»,
 * más la nota «Antes de responder». Usa el trámite con respuesta pendiente, o el primero.
 */
export function MenuEps() {
  const version = useVersionTramites()
  const [tramites, setTramites] = useState<TramiteEpsResumen[] | null>(null)

  useEffect(() => {
    const control = new AbortController()
    listarMisTramites(control.signal)
      .then((r) => setTramites(r.items))
      .catch(() => {
        // Sin la lista, el menú muestra solo «Mis trámites».
      })
    return () => control.abort()
  }, [version])

  if (!tramites || tramites.length === 0) return null
  const pendientes = tramites.filter((t) => t.pendiente)
  const activo = pendientes[0] ?? tramites[0]
  const base = `/eps/tramites/${encodeURIComponent(activo.id)}`

  return (
    <>
      <nav aria-label="Trámite activo">
        <p className="lateral__grupo">Tu trámite activo</p>
        <ul className="lateral__lista">
          <li>
            <NavLink to={`${base}/respuesta`} className="lateral__enlace" end>
              <IconoTarea />
              <span className="lateral__texto">Siguiente paso</span>
              {pendientes.length > 0 && (
                <span className="contador">
                  {pendientes.length}
                  <span className="solo-lectores"> pendientes</span>
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to={base} className="lateral__enlace" end>
              <IconoFlecha />
              <span className="lateral__texto">Seguimiento</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      {activo.pendiente && (
        <div className="lateral__nota lateral__nota--eps">
          <Gotita pose="avatar-naranja" alto={40} animada={false} />
          <div>
            <p className="lateral__nota-titulo">Antes de responder</p>
            <p>
              {activo.id} · {activo.eps}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
