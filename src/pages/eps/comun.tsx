// Piezas compartidas por las pantallas EPS.

import { NavLink } from 'react-router'
import { Chip } from '../../components/Chip'
import { IconoCheck, IconoEnlace, IconoFlecha, IconoLista, IconoTarea } from '../../components/Iconos'
import { TONO_ESTADO_EPS, type AvisoEps, type EstadoEps, type PasoSeguimiento } from '../../types/eps'

export function ChipEstadoEps({ estado, texto }: { estado: EstadoEps; texto: string }) {
  return <Chip tono={TONO_ESTADO_EPS[estado]}>{texto}</Chip>
}

const TEXTO_PASO: Record<PasoSeguimiento['estado'], string> = {
  hecho: 'Hecho',
  actual: 'En curso',
  pendiente: 'Pendiente',
}

/** Línea de pasos del trámite, en el lenguaje de la EPS. */
export function Seguimiento({ pasos }: { pasos: PasoSeguimiento[] }) {
  return (
    <ol className="seguimiento">
      {pasos.map((paso, i) => (
        <li
          key={`${paso.titulo}-${i}`}
          className={`seguimiento__paso seguimiento__paso--${paso.estado}`}
          aria-current={paso.estado === 'actual' ? 'step' : undefined}
        >
          <span className="seguimiento__marca" aria-hidden="true">
            {paso.estado === 'hecho' && <IconoCheck tamano={12} />}
          </span>
          <div>
            <p className="seguimiento__titulo">
              {paso.titulo}
              <span className="solo-lectores"> ({TEXTO_PASO[paso.estado]})</span>
            </p>
            <p className="seguimiento__fecha">{paso.fecha_texto}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

interface NavegacionProps {
  /** Trámite al que llevan «Siguiente paso» y «Seguimiento». null si no hay ninguno. */
  tramiteId: string | null
  /** Tareas pendientes para el contador de «Siguiente paso». */
  pendientes: number
}

/** Barra inferior de la vista EPS en celular: Trámites, Siguiente paso y Seguimiento (Figma «EPS móvil»). */
export function NavegacionEps({ tramiteId, pendientes }: NavegacionProps) {
  const base = tramiteId ? `/eps/tramites/${encodeURIComponent(tramiteId)}` : null
  return (
    <nav className="navegacion-movil eps-navegacion" aria-label="Vista EPS">
      <NavLink to="/eps/tramites" end>
        <IconoLista tamano={20} />
        Trámites
      </NavLink>
      {base ? (
        <NavLink to={`${base}/respuesta`} end>
          <span className="eps-navegacion__icono">
            <IconoTarea tamano={20} />
            {pendientes > 0 && (
              <span className="eps-navegacion__contador">
                {pendientes}
                <span className="solo-lectores"> pendientes</span>
              </span>
            )}
          </span>
          Siguiente paso
        </NavLink>
      ) : (
        <span aria-disabled="true">
          <IconoTarea tamano={20} />
          Siguiente paso
        </span>
      )}
      {base ? (
        <NavLink to={base} end>
          <IconoFlecha tamano={20} />
          Seguimiento
        </NavLink>
      ) : (
        <span aria-disabled="true">
          <IconoFlecha tamano={20} />
          Seguimiento
        </span>
      )}
    </nav>
  )
}

/** Aviso sin tarea obligatoria: participación opcional o trámite concluido (mensajes del Figma). */
export function AvisoEstado({ aviso }: { aviso: AvisoEps }) {
  return (
    <section className={`tarjeta eps-tarea eps-aviso eps-aviso--${aviso.tipo}`} aria-labelledby="titulo-aviso">
      <p className="antetitulo">{aviso.etiqueta}</p>
      <h2 id="titulo-aviso">{aviso.titulo}</h2>
      <p className="texto-pequeno">{aviso.texto}</p>
      {aviso.tipo === 'participacion' && <Chip tono="info">Opcional</Chip>}
      {aviso.enlace && (
        <a className="boton boton--secundario boton--bloque" href={aviso.enlace} target="_blank" rel="noreferrer">
          Ir al canal oficial
          <span className="solo-lectores"> (se abre en otra pestaña)</span>
          <IconoEnlace tamano={16} />
        </a>
      )}
    </section>
  )
}
