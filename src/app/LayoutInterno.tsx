import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoAbajo, IconoBuscar, IconoCampana, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { obtenerContadores, useVersionTramites } from '../services/tramites'
import { useSesion } from '../sesion/useSesion'
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
  menu: GrupoMenu[]
  /** Ruta de la lista donde busca la cabecera, por ejemplo /sunass/expedientes. */
  rutaBusqueda?: string
  rutaAlertas?: string
}

/**
 * Estructura de las vistas con sesión (SUNASS y EPS): cabecera, menú lateral y contenido.
 * El cargo que se muestra sale de la sesión.
 */
export function LayoutInterno({ vista, menu, rutaBusqueda, rutaAlertas }: Props) {
  const navegar = useNavigate()
  const { sesion, salir } = useSesion()
  const [saliendo, setSaliendo] = useState(false)

  async function cerrar() {
    setSaliendo(true)
    try {
      await salir()
    } finally {
      navegar('/', { replace: true })
    }
  }
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
        <details className="menu-sesion">
          <summary className="pildora-perfil">
            <IconoPersonas tamano={16} />
            <span className="pildora-perfil__texto">{sesion?.nombre ?? 'Mi cuenta'}</span>
            <span className="solo-lectores"> (opciones de la sesión)</span>
            <span className="pildora-perfil__texto" aria-hidden="true">
              <IconoAbajo tamano={14} />
            </span>
          </summary>
          <div className="menu-sesion__panel">
            <div>
              <p style={{ fontWeight: 700 }}>{sesion?.nombre}</p>
              <p className="texto-pequeno texto-suave">
                {sesion?.perfil === 'eps' ? `Vista EPS · ${sesion.eps ?? ''}` : 'Vista SUNASS'}
                {sesion?.simulado && ' · Cuenta de demostración'}
              </p>
            </div>
            <button type="button" className="boton boton--secundario boton--bloque" onClick={cerrar} disabled={saliendo}>
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </details>
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
