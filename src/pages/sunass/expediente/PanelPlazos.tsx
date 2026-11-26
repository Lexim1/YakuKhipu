import { Barra } from '../../../components/Barra'
import { Chip } from '../../../components/Chip'
import type { Plazos } from '../../../types/tramite'

/** Pestaña «Plazos»: plazo normativo, meta interna y plazo del oficio, con las próximas fechas. */
export function PanelPlazos({ datos }: { datos: Plazos }) {
  return (
    <>
      <div className="tres-columnas">
        {datos.tarjetas.map((t) => (
          <section key={t.tipo} className="tarjeta tarjeta-plazo" aria-label={`Plazo ${t.tipo.toLowerCase()}`}>
            <p className="siguiente__antetitulo">{t.tipo}</p>
            <p className="tarjeta-plazo__valor">{t.valor}</p>
            <p className="texto-suave texto-pequeno">{t.detalle}</p>
            <Barra
              usado={t.usado}
              total={t.total}
              tono={t.usado >= t.total ? 'marca' : 'ok'}
              etiqueta={`Plazo ${t.tipo.toLowerCase()}`}
            />
            <p className="tarjeta-plazo__pie">{t.pie}</p>
          </section>
        ))}
      </div>
      <section className="tarjeta" aria-labelledby="titulo-fechas">
        <h2 id="titulo-fechas" style={{ marginBottom: 8 }}>
          Próximas fechas
        </h2>
        {datos.proximas.map((f) => (
          <div key={f.titulo} className="fila-fecha">
            <span className="fila-fecha__fecha">{f.fecha_texto}</span>
            <span style={{ fontWeight: 600 }}>{f.titulo}</span>
            <Chip tono={f.chip.tono}>{f.chip.texto}</Chip>
          </div>
        ))}
        <p className="nota" style={{ marginTop: 8 }}>
          {datos.nota}
        </p>
      </section>
    </>
  )
}
