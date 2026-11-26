import { useState } from 'react'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, type Tono } from '../../components/Chip'
import { ENCARGOS } from '../../mocks/seguimiento'
import type { EstadoEncargo } from '../../types/seguimiento'

const ESTADO: Record<EstadoEncargo, { texto: string; tono: Tono; plural: string }> = {
  en_curso: { texto: 'En curso', tono: 'info', plural: 'En curso' },
  pendiente: { texto: 'Pendiente', tono: 'aviso', plural: 'Pendientes' },
  hecho: { texto: 'Hecho', tono: 'ok', plural: 'Hechos' },
}

/** Lo que queda por hacer después de cada resolución, con responsable y fecha. Datos de demostración. */
export function Encargos() {
  const [filtro, setFiltro] = useState<EstadoEncargo | ''>('')
  const visibles = ENCARGOS.filter((e) => !filtro || e.estado === filtro)

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

      <div className="pastillas" role="group" aria-label="Filtrar por estado">
        <button type="button" className="pastilla" aria-pressed={filtro === ''} onClick={() => setFiltro('')}>
          Todos {ENCARGOS.length}
        </button>
        {(Object.keys(ESTADO) as EstadoEncargo[]).map((e) => (
          <button key={e} type="button" className="pastilla" aria-pressed={filtro === e} onClick={() => setFiltro(e)}>
            {ESTADO[e].plural} {ENCARGOS.filter((x) => x.estado === e).length}
          </button>
        ))}
      </div>

      <AvisoSimulado />

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
              <tr key={`${e.decision}-${e.encargo}`}>
                <td>
                  <strong>{e.encargo}</strong>
                  <span className="celda__detalle">{e.detalle}</span>
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
