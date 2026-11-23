import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoAbajo, IconoBuscar, IconoCampana, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { obtenerContadores, useVersionTramites } from '../services/tramites'
import type { Contadores } from '../types/tramite'
import { Marca } from './Marca'
import type { EnlaceMenu, GrupoMenu } from './menus'

/** Contadores del menú. Conserva el último valor mientras se actualizan, para que no parpadeen. */
function useContadores(necesarios: boolean): Contadores | null {
  const version = useVersionTramites()
  const [contadores, setContadores] = useState<Contadores | null>(null)
  useEffect(() => {
    if (!necesarios) return
    const control = new AbortController()
    obtenerContadores(control.signal)
      .then(setContadores)
      .catch(() => {
        // Sin contadores el menú sigue funcionando; las pantallas muestran su propio error.
      })
    return () => control.abort()
  }, [necesarios, version])
  return contadores
}

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
  const contadores = useContadores(menu.some((g) => g.enlaces.some((e) => e.contadorVivo)))

  function contadorDe(enlace: EnlaceMenu) {
    if (enlace.contadorVivo) return contadores?.[enlace.contadorVivo] ?? null
    return enlace.contador ?? null
  }

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
                {grupo.enlaces.map((enlace) => {
                  const contador = contadorDe(enlace)
                  return (
                    <li key={enlace.ruta}>
                      <NavLink to={enlace.ruta} className="lateral__enlace">
                        {enlace.icono}
                        <span className="lateral__texto">{enlace.texto}</span>
                        {contador != null && contador > 0 && (
                          <span className="contador">
                            {contador}
                            <span className="solo-lectores"> pendientes</span>
                          </span>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
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
