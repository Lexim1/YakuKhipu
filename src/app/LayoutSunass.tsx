import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { ROLES_SUNASS, rolSunass } from '../sesion/roles'
import { useSesion } from '../sesion/useSesion'
import { LayoutInterno } from './LayoutInterno'
import { menuSunass, rutaPermitida } from './menus'

/** Vista SUNASS: el menú y el ámbito dependen del perfil de la sesión (Analista SRT, Coordinación o Jefatura DRE). */
export function LayoutSunass() {
  const { sesion } = useSesion()
  const rol = rolSunass(sesion)
  const perfil = ROLES_SUNASS[rol]
  return (
    <LayoutInterno
      vista={`SUNASS · ${perfil.cargo}`}
      menu={menuSunass(rol)}
      rutaBusqueda="/sunass/expedientes"
      rutaAlertas="/sunass/alertas"
      ambito={{ cargo: perfil.cargo, detalle: perfil.ambito }}
    />
  )
}

/**
 * Pantalla que solo corresponde a ciertos perfiles. Fuera de ellos se explica por qué no se muestra;
 * el backend igual rechaza las consultas sin permiso.
 */
export function SoloPerfil({ ruta, children }: { ruta: string; children: ReactNode }) {
  const { sesion } = useSesion()
  const { pathname } = useLocation()
  const rol = rolSunass(sesion)
  if (rutaPermitida(rol, ruta)) return <>{children}</>
  return (
    <div className="pagina">
      <h1>Esta vista no corresponde a tu perfil</h1>
      <div className="mensaje">
        <p>
          {ROLES_SUNASS[rol].cargo} trabaja con {ROLES_SUNASS[rol].ambito.toLowerCase()}. La ruta <code>{pathname}</code>{' '}
          está disponible para otros perfiles de la DRE.
        </p>
      </div>
    </div>
  )
}
