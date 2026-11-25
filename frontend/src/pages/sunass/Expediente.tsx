import { Link, useParams } from 'react-router'
import { useState } from 'react'
import { baseUrl, pedirJson } from '../../services/api'
import { useConsulta } from '../../services/useConsulta'
import { useSesion } from '../../app/sesionEstado'

interface Propuesta {
  documento_id: string
  estado: string
  propuesta: string | null
  fuentes: { titulo: string; pagina_pdf: number | null; documento_id: string }[]
  advertencias: string[]
  error: string | null
  revision_motivo: string | null
}

export function Expediente() {
  const { id = '' } = useParams()
  const { sesion } = useSesion()
  const [actualizacion, setActualizacion] = useState(0)
  const [mensaje, setMensaje] = useState('')
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const verHistorial = sesion?.permisos.includes('trazabilidad.consultar')
  const ruta = '/api/tramites/' + encodeURIComponent(id)
  const [resultado, reintentar] = useConsulta(async (signal) => {
    const [ficha, documentos, eventos, propuestas] = await Promise.all([
      pedirJson<{ tema: string; eps: string; etapa: string; procedimiento: string }>(ruta, { signal }),
      pedirJson<{ items: { id: string; titulo: string; paginas: number | null; pdf_disponible: boolean }[] }>(ruta + '/documentos', { signal }),
      verHistorial ? pedirJson<{ items: { id: number; titulo: string }[] }>(ruta + '/eventos', { signal }) : null,
      sesion?.permisos.includes('agente.consultar')
        ? pedirJson<{ items: Propuesta[] }>(ruta + '/propuestas', { signal }) : null,
    ])
    return { ficha, documentos, eventos, propuestas }
  }, [ruta, verHistorial, actualizacion])
  if (resultado.estado === 'cargando') return <p role="status">Cargando expediente…</p>
  if (resultado.estado === 'error') return <p role="alert">No se pudo abrir el expediente. <button onClick={reintentar}>Reintentar</button></p>
  const { ficha, documentos, eventos, propuestas } = resultado.datos
  async function revisar(documentoId: string, decision: 'aceptada' | 'rechazada') {
    try {
      await pedirJson(ruta + '/propuestas/' + encodeURIComponent(documentoId) + '/revision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, motivo: motivos[documentoId] || '' }),
      })
      setMensaje('Revisión registrada.')
      setActualizacion((n) => n + 1)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo registrar la revisión.')
    }
  }
  return <section>
    <Link to="/sunass/expedientes">Volver a expedientes</Link>
    <h1>{ficha.tema}</h1>
    <p>{ficha.eps} · {ficha.procedimiento} · {ficha.etapa}</p>
    {propuestas && <section aria-label="Propuestas del agente">
      <h2>Propuestas para revisar</h2>
      {propuestas.items.length === 0 && <p>No hay propuestas de documentos incorporados.</p>}
      {propuestas.items.map((p) => <article key={p.documento_id}>
        <h3>Documento {p.documento_id}</h3>
        <p>Estado {p.estado}</p>
        {p.propuesta && <p>{p.propuesta}</p>}
        {p.error && <p role="status">{p.error}</p>}
        {p.advertencias.map((a) => <p key={a}>{a}</p>)}
        {p.fuentes.map((f) => <p key={f.documento_id + '-' + f.pagina_pdf}>
          <a href={baseUrl + '/api/documentos/' + encodeURIComponent(f.documento_id) +
            '/contenido?pagina=' + f.pagina_pdf} target="_blank" rel="noreferrer">
            {f.titulo} · página {f.pagina_pdf}
          </a></p>)}
        {p.estado === 'lista' && sesion?.permisos.includes('evaluacion.validar') && <>
          <label>Motivo de revisión <input value={motivos[p.documento_id] || ''}
            onChange={(e) => setMotivos({ ...motivos, [p.documento_id]: e.target.value })} /></label>
          <button type="button" disabled={(motivos[p.documento_id] || '').trim().length < 3}
            onClick={() => revisar(p.documento_id, 'aceptada')}>Aceptar propuesta</button>
          <button type="button" disabled={(motivos[p.documento_id] || '').trim().length < 3}
            onClick={() => revisar(p.documento_id, 'rechazada')}>Rechazar propuesta</button>
        </>}
        {p.revision_motivo && <p>Motivo de revisión {p.revision_motivo}</p>}
      </article>)}
      {mensaje && <p role="status">{mensaje}</p>}
      <button type="button" onClick={() => setActualizacion((n) => n + 1)}>Actualizar propuestas</button>
    </section>}
    <h2>Documentos</h2>
    {documentos.items.length ? <ul>{documentos.items.map((d) => {
      const contenido = baseUrl + '/api/documentos/' + encodeURIComponent(d.id) + '/contenido'
      return <li key={d.id}>{d.titulo}{d.paginas ? ` · ${d.paginas} páginas` : ''}{' '}
        <a href={contenido} target="_blank" rel="noreferrer">Ver texto</a>{' '}
        {d.pdf_disponible && <a href={contenido + '?formato=pdf'}>Descargar PDF</a>}
      </li>
    })}</ul> : <p>No hay documentos visibles.</p>}
    {eventos && <><h2>Trazabilidad</h2><ol>{eventos.items.map((e) => <li key={e.id}>{e.titulo}</li>)}</ol></>}
  </section>
}
