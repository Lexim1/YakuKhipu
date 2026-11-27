import { useState } from 'react'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, type Tono } from '../../components/Chip'
import { Dona, Saludo, type TonoSegmento } from '../../components/Graficos'
import { ENCARGOS } from '../../mocks/seguimiento'
import type { EstadoEncargo } from '../../types/seguimiento'

const ESTADO: Record<EstadoEncargo, { texto: string; tono: Tono; plural: string; emoji: string; segmento: TonoSegmento }> = {
  en_curso: { texto: 'En curso', tono: 'info', plural: 'En curso', emoji: '🚧', segmento: 'info' },
  pendiente: { texto: 'Pendiente', tono: 'aviso', plural: 'Pendientes', emoji: '⏳', segmento: 'aviso' },
  hecho: { texto: 'Hecho', tono: 'ok', plural: 'Hechos', emoji: '✅', segmento: 'ok' },
}

/** Lo que queda por hacer después de cada resolución, con responsable y fecha. Datos de demostración. */
export function Encargos() {
  const [filtro, setFiltro] = useState<EstadoEncargo | ''>('')
  const visibles = ENCARGOS.filter((e) => !filtro || e.estado === filtro)
  const contar = (estado: EstadoEncargo) => ENCARGOS.filter((x) => x.estado === estado).length
  const hechos = contar('hecho')

  useContextoAgente({
    espacio: 'Espacio SUNASS · Encargos posteriores',
    preguntas: [
      {
        pregunta: '¿Qué encargos siguen pendientes?',
        respuesta: ENCARGOS.filter((e) => e.estado !== 'hecho')
          .map((e) => `${e.encargo} (${e.decision}, ${e.responsable}, vence ${e.vence})`)
          .join('; '),
        fuentes: ['Encargos posteriores (simulado)'],
        palabras: ['pendiente', 'falta', 'encargo'],
      },
    ],
  })

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Seguimiento</p>
        <h1>Encargos posteriores</h1>
        <p className="subtitulo">Lo que queda por hacer después de cada resolución, con responsable y fecha.</p>
      </div>

      <AvisoSimulado />

      <div className="bento-arriba">
        <Saludo
          pose={hechos === ENCARGOS.length ? 'logrado' : 'pensando'}
          titulo={`📌 ${ENCARGOS.length - hechos} encargos siguen abiertos`}
          texto="Después de cada resolución quedan tareas. Aquí ves quién las tiene y cuándo vencen."
        >
          <div className="saludo__progreso-barra" role="img" aria-label={`${hechos} de ${ENCARGOS.length} encargos hechos`}>
            <span style={{ width: `${ENCARGOS.length ? (hechos / ENCARGOS.length) * 100 : 0}%` }} />
          </div>
          <p className="texto-pequeno">
            ✅ {hechos} de {ENCARGOS.length} hechos
          </p>
        </Saludo>
        <section className="tarjeta tarjeta-dona" aria-labelledby="titulo-dona-encargos">
          <h2 id="titulo-dona-encargos" className="titulo-icono">
            <span className="burbuja burbuja--lila burbuja--sm" aria-hidden="true">📊</span>
            <span>¿Cómo van?</span>
          </h2>
          <Dona
            etiqueta={`Encargos por estado: ${(Object.keys(ESTADO) as EstadoEncargo[]).map((e) => `${ESTADO[e].plural} ${contar(e)}`).join(', ')}`}
            segmentos={(Object.keys(ESTADO) as EstadoEncargo[]).map((e) => ({
              texto: ESTADO[e].plural,
              valor: contar(e),
              tono: ESTADO[e].segmento,
            }))}
          />
        </section>
      </div>

      <div className="pastillas" role="group" aria-label="Filtrar por estado">
        <button type="button" className="pastilla" aria-pressed={filtro === ''} onClick={() => setFiltro('')}>
          Todos {ENCARGOS.length}
        </button>
        {(Object.keys(ESTADO) as EstadoEncargo[]).map((e) => (
          <button key={e} type="button" className="pastilla" aria-pressed={filtro === e} onClick={() => setFiltro(e)}>
            <span aria-hidden="true">{ESTADO[e].emoji} </span>
            {ESTADO[e].plural} {contar(e)}
          </button>
        ))}
      </div>

      <div className="tabla-expedientes">
        <table>
          <caption className="solo-lectores">Encargos posteriores a las resoluciones</caption>
          <thead>
            <tr>
              <th scope="col">Encargo</th>
              <th scope="col">Decisión</th>
              <th scope="col">Responsable</th>
              <th scope="col">Vence</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e) => (
              <tr key={`${e.decision}-${e.encargo}`} className="fila-viva">
                <td>
                  <span className="celda-gotita">
                    <span className={`burbuja burbuja--sm burbuja--${e.estado === 'hecho' ? 'menta' : e.estado === 'pendiente' ? 'durazno' : 'cielo'}`} aria-hidden="true">
                      {ESTADO[e.estado].emoji}
                    </span>
                    <span>
                  <strong>{e.encargo}</strong>
                  <span className="celda__detalle">{e.detalle}</span>
                    </span>
                  </span>
                </td>
                <td>
                  <strong>{e.decision}</strong>
                  <span className="celda__detalle">{e.eps}</span>
                </td>
                <td>
                  <strong>{e.responsable}</strong>
                  <span className="celda__detalle">{e.area}</span>
                </td>
                <td>{e.vence}</td>
                <td>
                  <Chip tono={ESTADO[e.estado].tono}>{ESTADO[e.estado].texto}</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
