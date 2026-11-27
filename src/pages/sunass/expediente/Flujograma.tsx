import { useState } from 'react'
import { Barra } from '../../../components/Barra'
import type { Flujograma as TipoFlujograma, Situacion } from '../../../types/tramite'

interface Props {
  flujo: TipoFlujograma
  situacion: Situacion
  usado: number | null
  total: number | null
  alRegistrarPaso?: () => void
}

const TONO_CHIP: Record<Situacion, string> = {
  en_plazo: 'ok',
  por_vencer: 'aviso',
  vencido: 'peligro',
  concluido: 'neutro',
  pendiente_de_validacion: 'neutro',
}

/** Flujograma del procedimiento: pasos en orden, el paso actual resaltado y el avance del plazo. */
export function Flujograma({ flujo, situacion, usado, total, alRegistrarPaso }: Props) {
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const urgente = situacion === 'por_vencer' || situacion === 'vencido'
  const actual = flujo.pasos.findIndex((paso) => paso.estado === 'actual')
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
            <button type="button" className="paso__caja paso__boton" onClick={() => setSeleccionado(i)}
              aria-label={`Paso ${i + 1}: ${paso.titulo}. ${paso.nota.startsWith('No realizado:') ? 'No realizado' : paso.estado === 'hecho' ? 'Registrado' : paso.estado === 'actual' ? 'Actual' : 'Pendiente'}`}
              aria-expanded={seleccionado === i}>
              <span className="paso__titulo">
                {i + 1} · {paso.titulo}
              </span>
              <span className="paso__detalle">{paso.detalle}</span>
              <span className="paso__nota">{paso.nota}</span>
            </button>
            {i < flujo.pasos.length - 1 && (
              <span className="paso__flecha" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      {seleccionado !== null && <div className="flujograma__detalle" role="status">
        <strong>Paso {seleccionado + 1}: {flujo.pasos[seleccionado].titulo}</strong>
        <p>{flujo.pasos[seleccionado].detalle}. {flujo.pasos[seleccionado].nota}</p>
        {actual >= 0 && seleccionado === actual + 1 && alRegistrarPaso &&
          <button className="boton boton--secundario" type="button" onClick={alRegistrarPaso}>Registrar avance con sustento</button>}
        {actual >= 0 && seleccionado === actual + 1 && !alRegistrarPaso &&
          <p className="nota">Para registrar este avance se necesita el perfil responsable y el documento incorporado. Consulta a Coordinación DRE si corresponde una derivación o asignación.</p>}
        {actual >= 0 && flujo.pasos[seleccionado].estado === 'pendiente' && seleccionado !== actual + 1 &&
          <p className="nota">Este paso se habilita cuando se registren los anteriores.</p>}
      </div>}
      <Barra usado={usado} total={total} tono={urgente ? 'aviso' : 'marca'} etiqueta="Plazo usado" />
      <p className="nota">{flujo.nota}</p>
    </section>
  )
}
