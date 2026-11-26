import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { ROLES_SUNASS, rolSunass } from '../sesion/roles'
import { useSesion } from '../sesion/useSesion'
import { LayoutInterno } from './LayoutInterno'
import { menuSunass, rutaPermitida } from './menus'

/**
 * Vista SUNASS: el menú sale de los permisos que entrega el backend (o del rol en el modo de ejemplos)
 * y el ámbito, del perfil (Analista SRT, Coordinación DRE o Jefatura DRE).
 */
export function LayoutSunass() {
  const { sesion } = useSesion()
  const perfil = ROLES_SUNASS[rolSunass(sesion)]
  const puede = (permiso: string) => !sesion?.permisos || sesion.permisos.includes(permiso)
  return (
    <LayoutInterno
      vista={`SUNASS · ${perfil.cargo}`}
      menu={menuSunass(sesion)}
      rutaBusqueda={puede('expediente.consultar') ? '/sunass/expedientes' : undefined}
      rutaAlertas={puede('alerta.consultar') ? '/sunass/alertas' : undefined}
      ambito={{ cargo: perfil.cargo, detalle: perfil.ambito }}
      conAgente={puede('agente.consultar')}
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
  if (rutaPermitida(sesion, ruta)) return <>{children}</>
  const perfil = ROLES_SUNASS[rolSunass(sesion)]
  return (
    <div className="pagina">
      <h1>Esta vista no corresponde a tu perfil</h1>
      <div className="mensaje">
        <p>
          {perfil.cargo} trabaja con {perfil.ambito.toLowerCase()}. Tu cuenta no tiene permiso para{' '}
          <code>{pathname}</code>; si lo necesitas, pídelo a Jefatura DRE.
        </p>
      </div>
    </div>
  )
}
