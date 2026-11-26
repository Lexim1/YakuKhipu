import { useState } from 'react'
import { Chip, Fuente, type Tono } from '../../../components/Chip'
import { IconoChispa } from '../../../components/Iconos'
import { Contenido, MensajeError } from '../../../components/Mensajes'
import { listarPropuestas, revisarPropuesta, type PropuestaAgente } from '../../../services/tramites'
import { useConsulta } from '../../../services/useConsulta'

const ESTADO: Record<string, { tono: Tono; texto: string }> = {
  pendiente: { tono: 'info', texto: 'En cola' },
  procesando: { tono: 'info', texto: 'El agente está analizando' },
  lista: { tono: 'agente', texto: 'Lista para revisar' },
  aceptada: { tono: 'ok', texto: 'Aceptada' },
  rechazada: { tono: 'neutro', texto: 'Rechazada' },
  error: { tono: 'peligro', texto: 'No se pudo analizar' },
}

/**
 * Propuestas automáticas del agente sobre los PDF incorporados. Solo SUNASS las ve; quien tiene
 * evaluacion.validar las acepta o rechaza con un motivo. La revisión no cambia el estado del expediente.
 */
export function PropuestasAgente({ tramiteId, puedeRevisar }: { tramiteId: string; puedeRevisar: boolean }) {
  const [version, setVersion] = useState(0)
  const [resultado, reintentar] = useConsulta((signal) => listarPropuestas(tramiteId, signal), [tramiteId, version])

  return (
    <section className="tarjeta columna" aria-labelledby="titulo-propuestas">
      <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
        <h2 id="titulo-propuestas">Propuestas del agente</h2>
        <button type="button" className="boton boton--secundario" onClick={() => setVersion((n) => n + 1)}>
          Actualizar
        </button>
      </div>
      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando propuestas…">
        {(propuestas) =>
          propuestas.length === 0 ? (
            <p className="texto-suave">
              Cuando se incorpore un PDF a este expediente, el agente propondrá un análisis con citas para revisar.
            </p>
          ) : (
            <ul className="lista-simple">
              {propuestas.map((p) => (
                <Propuesta
                  key={p.documento_id}
                  tramiteId={tramiteId}
                  propuesta={p}
                  puedeRevisar={puedeRevisar}
                  alRevisar={() => setVersion((n) => n + 1)}
                />
              ))}
            </ul>
          )
        }
      </Contenido>
    </section>
  )
}

function Propuesta({
  tramiteId,
  propuesta: p,
  puedeRevisar,
  alRevisar,
}: {
  tramiteId: string
  propuesta: PropuestaAgente
  puedeRevisar: boolean
  alRevisar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const estado = ESTADO[p.estado] ?? { tono: 'neutro' as Tono, texto: p.estado }

  async function revisar(decision: 'aceptada' | 'rechazada') {
    if (motivo.trim().length < 3) return setError('Escribe el motivo de tu revisión (al menos 3 caracteres).')
    setEnviando(true)
    setError(null)
    try {
      await revisarPropuesta(tramiteId, p.documento_id, decision, motivo.trim())
      alRevisar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la revisión.')
      setEnviando(false)
    }
  }

  return (
    <li style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
        <span className="texto-pequeno texto-suave">Documento {p.documento_id}</span>
        <Chip tono={estado.tono}>{estado.texto}</Chip>
      </div>
      {p.propuesta && (
        <div className="propuesta">
          <IconoChispa tamano={18} />
          <p className="propuesta__texto">{p.propuesta}</p>
        </div>
      )}
      {p.fuentes && p.fuentes.length > 0 && (
        <div className="fila-chips">
          {p.fuentes.map((f) => (
            <Fuente key={`${f.documento_id}-${f.pagina_pdf}`}>
              {f.titulo}
              {f.pagina_pdf ? ` · pág. ${f.pagina_pdf}` : ''}
            </Fuente>
          ))}
        </div>
      )}
      {p.advertencias?.map((a) => (
        <p key={a} className="nota">
          ⚠ {a}
        </p>
      ))}
      {p.error && <MensajeError mensaje={p.error} />}
      {p.revision_motivo && <p className="texto-pequeno">Motivo de la revisión: {p.revision_motivo}</p>}
      {p.estado === 'lista' && puedeRevisar && (
        <div className="columna">
          <label className="campo">
            Motivo de tu revisión
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} />
          </label>
          {error && <MensajeError mensaje={error} />}
          <div className="dialogo__acciones">
            <button
              type="button"
              className="boton boton--secundario"
              disabled={enviando}
              onClick={() => revisar('rechazada')}
            >
              Rechazar
            </button>
            <button type="button" className="boton boton--primario" disabled={enviando} onClick={() => revisar('aceptada')}>
              Aceptar propuesta
            </button>
          </div>
          <p className="nota">Aceptar registra tu revisión; no cambia el estado del expediente.</p>
        </div>
      )}
    </li>
  )
}
