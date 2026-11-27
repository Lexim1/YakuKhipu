import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { PanelAgente } from '../agente/PanelAgente'
import { IconoAbajo, IconoBuscar, IconoCampana, IconoPersonas } from '../components/Iconos'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { obtenerContadores, useVersionTramites } from '../services/tramites'
import { useSesion } from '../sesion/useSesion'
import type { Contadores } from '../types/tramite'
import { Marca } from './Marca'
import { MenuEps } from './MenuEps'
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
  /** Perfil y ámbito que se muestran arriba del menú (vistas SUNASS). */
  ambito?: { cargo: string; detalle: string }
  /** false si la cuenta no tiene el permiso agente.consultar: no se muestra el botón del agente. */
  conAgente?: boolean
}

/**
 * Estructura de las vistas con sesión (SUNASS y EPS): cabecera, menú lateral y contenido.
 * El cargo que se muestra sale de la sesión.
 */
export function LayoutInterno({ vista, menu, rutaBusqueda, rutaAlertas, ambito, conAgente = true }: Props) {
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
          {ambito && (
            <div className="lateral__ambito">
              <p className="lateral__cargo">{ambito.cargo}</p>
              <p className="lateral__detalle">{ambito.detalle}</p>
            </div>
          )}
          {menu.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <p className="lateral__grupo">{grupo.titulo}</p>
              <ul className="lateral__lista">
                {grupo.enlaces.map((enlace) => {
                  const contador = contadorDe(enlace)
                  return (
                    <li key={enlace.ruta}>
                      <NavLink to={enlace.ruta} className="lateral__enlace" end={enlace.exacto}>
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
          {vista === 'EPS' && <MenuEps />}
          {ambito && (
            <div className="lateral__nota">
              <p className="lateral__nota-titulo">Trazabilidad disponible</p>
              <p>Historia, fuentes, responsables y plazos dentro de tu ámbito.</p>
            </div>
          )}
        </aside>
        <main id="contenido" className="principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      {conAgente && <PanelAgente />}
    </>
  )
}
