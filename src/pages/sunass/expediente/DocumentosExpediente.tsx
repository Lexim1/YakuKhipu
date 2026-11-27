import { useState } from 'react'
import { LectorDocumento } from '../../../components/LectorDocumento'
import { Dialogo } from '../../../components/Dialogo'
import { Contenido, MensajeError } from '../../../components/Mensajes'
import { pedirJson } from '../../../services/api'
import { useConsulta } from '../../../services/useConsulta'
import type { Expediente } from '../../../types/tramite'

export function DocumentosExpediente({ expediente, puedeRevisar, alActualizar }: { expediente: Expediente; puedeRevisar?: boolean; alActualizar?: () => void }) {
  const [id, setId] = useState<string | null>(null)
  const [revision, setRevision] = useState<string | null>(null)
  return <section className="tarjeta"><h2>Documentos incorporados</h2>
    {expediente.documentos?.length ? <ul className="lista-simple">{expediente.documentos.map((d) => <li key={d.id} className="documentos-expediente__fila">
      <span>{d.titulo}</span><button className="boton boton--secundario" type="button" onClick={() => setId(d.id)}>Leer documento</button>
      {puedeRevisar && <button className="boton boton--secundario" type="button" aria-label={`Revisar acceso EPS: ${d.titulo}`} onClick={() => setRevision(d.id)}>Revisar acceso EPS</button>}
    </li>)}</ul> : <p>No hay documentos incorporados. Coordinación puede recibirlos y vincularlos desde Recepción.</p>}
    {id && <LectorDocumento id={id} alCerrar={() => setId(null)} />}
    {revision && <RevisionAcceso key={revision} expediente={expediente} documentoId={revision} alCerrar={() => setRevision(null)} alGuardar={() => { setRevision(null); alActualizar?.() }} />}
  </section>
}

function RevisionAcceso({ expediente, documentoId, alCerrar, alGuardar }: { expediente: Expediente; documentoId: string; alCerrar: () => void; alGuardar: () => void }) {
  const [consulta, reintentar] = useConsulta((signal) => pedirJson<{ visibilidad: string }>(`/api/documentos/${encodeURIComponent(documentoId)}/contenido`, { signal }), [documentoId])
  const [visibilidad, setVisibilidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  return <Dialogo abierto titulo="Revisar acceso de la EPS" alCerrar={alCerrar}>
    <Contenido resultado={consulta} reintentar={reintentar} textoCarga="Consultando acceso actual…">
      {(actual) => actual.visibilidad === 'publica' ? <p className="dialogo__cuerpo">Este documento está publicado. Revisa la publicación antes de cambiar su acceso.</p> : <form className="dialogo__cuerpo columna" onSubmit={async (event) => {
        event.preventDefault(); if (guardando) return; setGuardando(true); setError('')
        try {
          await pedirJson(`/api/tramites/${encodeURIComponent(expediente.id)}/documentos/${encodeURIComponent(documentoId)}/visibilidad`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibilidad: visibilidad || actual.visibilidad, motivo, version: expediente.version }) })
          alGuardar()
        } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo revisar el acceso.'); setGuardando(false) }
      }}>
        <p>Revisa el documento antes de compartirlo. La EPS de este expediente podrá leerlo; la ciudadanía requiere una publicación aparte.</p>
        <label className="campo">Acceso del documento<select value={visibilidad || actual.visibilidad} onChange={(e) => setVisibilidad(e.target.value)}><option value="interna">Solo equipo SUNASS</option><option value="partes">SUNASS y EPS de este expediente</option></select></label>
        <label className="campo">Motivo de la revisión<textarea required minLength={3} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></label>
        {error && <MensajeError mensaje={error} />}
        <button className="boton boton--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar acceso revisado'}</button>
      </form>}
    </Contenido>
  </Dialogo>
}
