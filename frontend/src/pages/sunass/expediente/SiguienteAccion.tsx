import { Link } from 'react-router'
import { IconoEnlace } from '../../../components/Iconos'
import type { SiguienteAccion as Tipo } from '../../../types/tramite'

/** Tarjeta «Siguiente acción»: qué hacer, quién lo hace y el botón para hacerlo. */
export function SiguienteAccion({ accion, alValidar }: { accion: Tipo; alValidar: () => void }) {
  return (
    <section className={`siguiente${accion.urgente ? ' siguiente--urgente' : ''}`} aria-labelledby="titulo-siguiente">
      <p className="siguiente__antetitulo">Siguiente acción</p>
      <h2 id="titulo-siguiente" className="siguiente__titulo">
        {accion.titulo}
      </h2>
      {accion.responsable && (
        <p style={{ fontWeight: 700, color: 'var(--color-primario-texto)' }}>Responsable: {accion.responsable}</p>
      )}
      <p className="texto-suave">{accion.detalle}</p>
      {accion.accion === 'validar' ? (
        <button type="button" className="boton boton--primario boton--bloque" onClick={alValidar}>
          {accion.boton}
          <IconoEnlace tamano={16} />
        </button>
      ) : (
        <Link
          className={`boton boton--bloque ${accion.urgente ? 'boton--naranja' : 'boton--primario'}`}
          to="/sunass/alertas"
        >
          {accion.boton}
        </Link>
      )}
    </section>
  )
}
