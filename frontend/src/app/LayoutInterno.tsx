import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoAbajo, IconoBuscar, IconoCampana, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { Marca } from './Marca'
import type { GrupoMenu } from './menus'

interface Props {
  vista: string
  perfil: string
  menu: GrupoMenu[]
  /** Ruta de la lista donde busca la cabecera, por ejemplo /sunass/expedientes. */
  rutaBusqueda?: string
  rutaAlertas?: string
}

/**
 * Estructura de las vistas con sesión (SUNASS y EPS): cabecera, menú lateral y contenido.
 * El perfil es simulado hasta que el backend entregue la sesión real.
 */
export function LayoutInterno({ vista, perfil, menu, rutaBusqueda, rutaAlertas }: Props) {
  const navegar = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  function buscar(e: FormEvent) {
    e.preventDefault()
    if (!rutaBusqueda) return
    const q = busqueda.trim()
    navegar(q ? `${rutaBusqueda}?q=${encodeURIComponent(q)}` : rutaBusqueda)
  }

  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <Marca vista={vista} />
        <div className="cabecera__espacio" />
        {rutaBusqueda && (
          <form className="buscador-cabecera" role="search" onSubmit={buscar}>
            <IconoBuscar tamano={14} />
            <label htmlFor="buscar-cabecera" className="solo-lectores">
              Buscar expediente, EPS u oficio
            </label>
            <input
              id="buscar-cabecera"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar expediente, EPS u oficio"
            />
          </form>
        )}
        {rutaAlertas && (
          <Link to={rutaAlertas} className="boton-circular" aria-label="Alertas">
            <IconoCampana tamano={16} />
          </Link>
        )}
        <Link to="/" className="pildora-perfil" title="Perfil simulado: volver al ingreso para cambiarlo">
          <IconoPersonas tamano={16} />
          <span className="pildora-perfil__texto">Perfil: {perfil}</span>
          <span className="solo-lectores"> (cambiar de vista)</span>
          <span className="pildora-perfil__texto" aria-hidden="true">
            <IconoAbajo tamano={14} />
          </span>
        </Link>
        <Accesibilidad />
      </header>
      <div className="estructura">
        <aside className="lateral">
          {menu.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <p className="lateral__grupo">{grupo.titulo}</p>
              <ul className="lateral__lista">
                {grupo.enlaces.map((enlace) => (
                  <li key={enlace.ruta}>
                    <NavLink to={enlace.ruta} className="lateral__enlace">
                      {enlace.icono}
                      <span className="lateral__texto">{enlace.texto}</span>
                      {enlace.contador != null && (
                        <span className="contador">
                          {enlace.contador}
                          <span className="solo-lectores"> pendientes</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </aside>
        <main id="contenido" className="principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <PanelAgente />
    </>
  )
}
