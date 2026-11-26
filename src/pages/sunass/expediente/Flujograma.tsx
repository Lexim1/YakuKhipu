import { Barra } from '../../../components/Barra'
import type { Flujograma as TipoFlujograma, Situacion } from '../../../types/tramite'

interface Props {
  flujo: TipoFlujograma
  situacion: Situacion
  usado: number | null
  total: number | null
}

const TONO_CHIP: Record<Situacion, string> = {
  en_plazo: 'ok',
  por_vencer: 'aviso',
  vencido: 'peligro',
  concluido: 'neutro',
  pendiente_de_validacion: 'neutro',
}

/** Flujograma del procedimiento: pasos en orden, el paso actual resaltado y el avance del plazo. */
export function Flujograma({ flujo, situacion, usado, total }: Props) {
  const urgente = situacion === 'por_vencer' || situacion === 'vencido'
  return (
    <section className="flujograma" aria-labelledby="titulo-flujograma">
      <div className="flujograma__cabecera">
        <div>
          <p className="flujograma__antetitulo">{flujo.encabezado}</p>
          <h2 id="titulo-flujograma" className="flujograma__titulo">
            {flujo.titulo}
          </h2>
        </div>
        <span className={`chip chip--${TONO_CHIP[situacion]} flujograma__chip`}>{flujo.chip}</span>
      </div>
      <ol className="pasos">
        {flujo.pasos.map((paso, i) => (
          <li
            key={paso.titulo}
            className={`paso paso--${paso.estado}${urgente ? ' paso--aviso' : ''}`}
            aria-current={paso.estado === 'actual' ? 'step' : undefined}
          >
            <div className="paso__caja">
              <span className="paso__titulo">
                {i + 1} · {paso.titulo}
              </span>
              <span className="paso__detalle">{paso.detalle}</span>
              <span className="paso__nota">{paso.nota}</span>
            </div>
            {i < flujo.pasos.length - 1 && (
              <span className="paso__flecha" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <Barra usado={usado} total={total} tono={urgente ? 'aviso' : 'marca'} etiqueta="Plazo usado" />
      <p className="nota">{flujo.nota}</p>
    </section>
  )
}
