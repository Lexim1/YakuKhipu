import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoBuscar, IconoDocumento, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { useSesion } from '../sesion/useSesion'
import { INICIO_PERFIL } from '../types/sesion'
import { Marca } from './Marca'
import { URL_INGRESO_INSTITUCIONAL } from '../services/sesion'

/** Estructura de la consulta ciudadana: acceso público, sin sesión ni menú lateral. */
export function LayoutPublico() {
  // «Ficha de la decisión» se marca activa cuando hay una ficha abierta.
  const enFicha = useMatch('/ciudadania/decisiones/:id')
  const { sesion } = useSesion()
  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <Marca vista="Consulta ciudadana" />
        <div className="cabecera__espacio" />
        <nav className="cabecera__nav" aria-label="Consulta ciudadana">
          <NavLink to="/ciudadania/decisiones" end>
            Decisiones
          </NavLink>
          <span className={enFicha ? 'active' : undefined} aria-current={enFicha ? 'page' : undefined}>
            Ficha de la decisión
          </span>
        </nav>
        <Link to={sesion ? INICIO_PERFIL[sesion.perfil] : URL_INGRESO_INSTITUCIONAL} reloadDocument={!sesion} className="pildora-perfil" aria-label={sesion ? 'Ir a mi vista' : 'Iniciar sesión (personal de SUNASS o de una EPS)'}>
          <IconoPersonas tamano={16} />
          <span className="pildora-perfil__texto">{sesion ? 'Ir a mi vista' : 'Iniciar sesión'}</span>
          <span className="solo-lectores">{sesion ? ' (volver a tu vista)' : ' (personal de SUNASS o de una EPS)'}</span>
        </Link>
        <Accesibilidad />
      </header>
      <main id="contenido" className="publico" tabIndex={-1}>
        <Outlet />
      </main>
      <nav className="navegacion-movil" aria-label="Consulta ciudadana">
        <NavLink to="/ciudadania/decisiones" end>
          <IconoBuscar tamano={20} />
          Decisiones
        </NavLink>
        <span className={enFicha ? 'active' : undefined} aria-current={enFicha ? 'page' : undefined}>
          <IconoDocumento tamano={20} />
          Ficha
        </span>
      </nav>
      <PanelAgente />
    </>
  )
}
