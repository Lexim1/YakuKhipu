import { Chip, Fuente, type Tono } from '../../../components/Chip'
import type { EstadoDato, Impacto } from '../../../types/tramite'

const TONO_DATO: Record<EstadoDato, Tono> = {
  Verificado: 'ok',
  Estimado: 'info',
  Potencial: 'marca',
  'Por validar': 'aviso',
  Simulado: 'agente',
  'No está en el expediente': 'peligro',
}

/** Miles separados por espacio, como en los documentos de Sunass: 12 527. */
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')

/** Pestaña «Impacto social»: a quién llega la inversión, cada dato con su estado y su fuente. */
export function PanelImpacto({ datos }: { datos: Impacto }) {
  const maximo = Math.max(...datos.localidades.map((l) => (l.renovacion ?? 0) + l.nuevas))
  return (
    <>
      <div className="cuatro-columnas">
        {datos.indicadores.map((i) => (
          <div key={i.etiqueta} className="tarjeta">
            <p className="texto-suave">{i.etiqueta}</p>
            <p className={`indicador__valor indicador__valor--${i.tono}`}>{i.valor}</p>
            <p className="nota">{i.detalle}</p>
          </div>
        ))}
      </div>

      <section className="tarjeta columna" aria-labelledby="titulo-impacto">
        <div>
          <p className="antetitulo">Impacto social</p>
          <h2 id="titulo-impacto">¿A quién llega esta inversión?</h2>
          <p className="texto-suave" style={{ marginTop: 6 }}>
            Cada dato muestra su estado y su fuente. Los marcados como «Simulado» son datos de demostración.
          </p>
        </div>
        <div className="cuatro-columnas">
          {datos.datos.map((d) => (
            <div key={d.pregunta} className="dato-impacto">
              <p className="dato-impacto__pregunta">{d.pregunta}</p>
              <Chip tono={TONO_DATO[d.estado]}>{d.estado}</Chip>
              <p>{d.texto}</p>
              <Fuente>{d.fuente}</Fuente>
            </div>
          ))}
        </div>
        <p className="nota">
          Cómo cuidamos estos datos: solo se usan como verificados los que tienen documento; los simulados no sustentan
          decisiones.
        </p>
      </section>

      <section className="tarjeta" aria-labelledby="titulo-localidades">
        <h2 id="titulo-localidades" style={{ marginBottom: 8 }}>
          Por localidad
        </h2>
        {datos.localidades.map((l) => {
          const total = (l.renovacion ?? 0) + l.nuevas
          return (
            <div key={l.nombre} className="localidad">
              <strong>{l.nombre}</strong>
              <div>
                <div
                  className="barra-doble"
                  style={{ width: `${Math.max(4, (total / maximo) * 100)}%` }}
                  aria-hidden="true"
                >
                  <span className="barra-doble__renovacion" style={{ flex: l.renovacion ?? 0 }} />
                  <span className="barra-doble__nuevas" style={{ flex: l.nuevas }} />
                </div>
                <p className="nota">
                  Renovación {l.renovacion == null ? '—' : miles(l.renovacion)} · Nuevas{' '}
                  {miles(l.nuevas)}
                </p>
              </div>
            </div>
          )
        })}
        <Fuente>{datos.fuente_localidades}</Fuente>
      </section>
    </>
  )
}
