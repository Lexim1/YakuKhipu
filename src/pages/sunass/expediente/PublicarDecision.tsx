import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Dialogo } from '../../../components/Dialogo'
import { MensajeError } from '../../../components/Mensajes'
import { pedirJson } from '../../../services/api'
import type { Expediente } from '../../../types/tramite'
import { NOMBRE_PROCEDIMIENTO } from '../../../types/tramite'
export function PublicarDecision({ expediente, alCerrar }: { expediente: Expediente; alCerrar: () => void }) {
  const [titulo, setTitulo] = useState(`${NOMBRE_PROCEDIMIENTO[expediente.procedimiento]} · ${expediente.eps}`)
  const [resumen, setResumen] = useState(''); const [localidad, setLocalidad] = useState('')
  const [documentos, setDocumentos] = useState<Set<string>>(new Set())
  const [error, setError] = useState(''); const [guardando, setGuardando] = useState(false); const [publicada, setPublicada] = useState('')
  async function enviar(e: FormEvent) {
    e.preventDefault(); if (guardando) return; setGuardando(true); setError('')
    try {
      const d = await pedirJson<{ id: string }>(`/api/tramites/${encodeURIComponent(expediente.id)}/publicacion`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: expediente.version, titulo, resumen_ciudadano: resumen, localidad, documentos_publicos: [...documentos] }) })
      setPublicada(d.id)
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo publicar.') } finally { setGuardando(false) }
  }
  return <Dialogo abierto titulo="Publicar decisión revisada" alCerrar={alCerrar}>{publicada ? <div className="dialogo__cuerpo"><p role="status">Publicación registrada. Solo los documentos seleccionados son públicos.</p><Link to={`/ciudadania/decisiones/${encodeURIComponent(publicada)}`}>Abrir la ficha ciudadana</Link></div> : <form className="dialogo__cuerpo columna" onSubmit={enviar}><p className="mensaje">Revisa la información antes de publicar. Este paso hace públicos el resumen y los documentos que selecciones; no firma ni aprueba una resolución.</p><label className="campo">Título<input required minLength={3} maxLength={200} value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label><label className="campo">Resumen ciudadano<textarea required minLength={10} maxLength={3000} value={resumen} onChange={(e) => setResumen(e.target.value)} /></label><label className="campo">Localidad<input required minLength={2} maxLength={120} value={localidad} onChange={(e) => setLocalidad(e.target.value)} /></label><fieldset><legend>Documentos revisados que autorizas a publicar</legend>{(expediente.documentos ?? []).map((d) => <label className="documento-publicable" key={d.id}><input type="checkbox" value={d.id} checked={documentos.has(d.id)} onChange={(e) => setDocumentos((old) => { const next = new Set(old); if (e.target.checked) next.add(d.id); else next.delete(d.id); return next })} />{d.titulo}</label>)}</fieldset>{error && <MensajeError mensaje={error} />}<button className="boton boton--primario" disabled={guardando || documentos.size === 0}>{guardando ? 'Publicando…' : 'Confirmar publicación'}</button></form>}</Dialogo>
}
