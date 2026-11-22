import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoBuscar, IconoDocumento, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { Marca } from './Marca'

/** Estructura de la consulta ciudadana: acceso público, sin sesión ni menú lateral. */
export function LayoutPublico() {
  // «Ficha de la decisión» se marca activa cuando hay una ficha abierta.
  const enFicha = useMatch('/ciudadania/decisiones/:id')
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
        <Link to="/" className="pildora-perfil" title="Volver al ingreso">
          <IconoPersonas tamano={16} />
          <span className="pildora-perfil__texto">Perfil: Ciudadanía</span>
          <span className="solo-lectores"> (cambiar de vista)</span>
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
