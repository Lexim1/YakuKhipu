import { Barra } from '../../../components/Barra'
import { Chip, Fuente } from '../../../components/Chip'
import type { Expediente } from '../../../types/tramite'
import { SiguienteAccion } from './SiguienteAccion'

/** Pestaña «Línea de tiempo»: hitos con su documento, siguiente acción y resumen. */
export function LineaTiempo({ expediente, alValidar }: { expediente: Expediente; alValidar: () => void }) {
  return (
    <div className="dos-columnas">
      <section className="tarjeta" aria-label="Línea de tiempo">
        <ol className="linea">
          {expediente.linea_tiempo?.map((h) => (
            <li key={h.id} className="hito">
              <span className="hito__fecha">{h.fecha_texto}</span>
              <span className="hito__riel" aria-hidden="true">
                <span className="hito__punto" />
              </span>
              <div className="hito__contenido">
                <h3 className="hito__titulo">{h.titulo}</h3>
                <p className="texto-suave">{h.detalle}</p>
                <div className="fila-chips">
                  <Chip tono={h.chip.tono}>{h.chip.texto}</Chip>
                  {h.fuente && <Fuente>{h.fuente}</Fuente>}
                  {h.validar && (
                    <button
                      type="button"
                      className="boton boton--secundario"
                      style={{ minHeight: 30, padding: '4px 12px' }}
                      onClick={alValidar}
                    >
                      Validar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <div className="columna">
        <SiguienteAccion accion={expediente.siguiente} alValidar={alValidar} />
        {expediente.resumen && (
          <section className="tarjeta" aria-labelledby="titulo-resumen">
            <h2 id="titulo-resumen" style={{ marginBottom: 8 }}>
              Resumen
            </h2>
            <dl className="lista-datos">
              {expediente.resumen.map((r) => (
                <div key={r.etiqueta}>
                  <dt>{r.etiqueta}</dt>
                  <dd>{r.valor}</dd>
                </div>
              ))}
            </dl>
            <p className="texto-pequeno" style={{ margin: '12px 0 6px', fontWeight: 600 }}>
              Plazo usado: {expediente.plazo.dias_usados} de {expediente.plazo.dias_totales} días hábiles
            </p>
            <Barra
              usado={expediente.plazo.dias_usados}
              total={expediente.plazo.dias_totales}
              tono="marca"
              etiqueta="Plazo usado"
            />
          </section>
        )}
      </div>
    </div>
  )
}
