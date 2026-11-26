import { useRef, useState, type FormEvent } from 'react'
import { Dialogo } from '../../../components/Dialogo'
import { Contenido, MensajeError } from '../../../components/Mensajes'
import { pedirJson } from '../../../services/api'
import { useConsulta } from '../../../services/useConsulta'
import type { Expediente } from '../../../types/tramite'

interface Accion { tipo: string; texto: string; requiere_documento: boolean }
export function RegistrarActuacion({ expediente, alCerrar, alGuardar }: { expediente: Expediente; alCerrar: () => void; alGuardar: () => void }) {
  const [r, retry] = useConsulta((s) => pedirJson<{ items: Accion[] }>(`/api/tramites/${encodeURIComponent(expediente.id)}/acciones`, { signal: s }), [expediente.id, expediente.version])
  const [tipo, setTipo] = useState(''); const [documento, setDocumento] = useState(''); const [fecha, setFecha] = useState('')
  const [detalle, setDetalle] = useState(''); const [dias, setDias] = useState(''); const [requisitos, setRequisitos] = useState('')
  const [resultado, setResultado] = useState('autorizado'); const [estado, setEstado] = useState('en_evaluacion'); const [paso, setPaso] = useState(1)
  const [error, setError] = useState(''); const [enviando, setEnviando] = useState(false)
  const clave = useRef(crypto.randomUUID())
  async function enviar(e: FormEvent) {
    e.preventDefault(); if (enviando) return; setEnviando(true); setError('')
    const accion = r.estado === 'listo' ? r.datos.items.find((a) => a.tipo === tipo) : null
    if (!accion) { setError('Selecciona una actuación permitida.'); setEnviando(false); return }
    const body = { tipo, version: expediente.version, fecha_acreditada: fecha, documento_id: documento || null, detalle: detalle || null,
      ...(['requerir_informacion', 'requerir_subsanacion'].includes(tipo) ? { plazo_dias: Number(dias), requisitos: requisitos.split('\n').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(tipo === 'resolver' ? { resultado } : {}), ...(tipo === 'validar_expediente' ? { estado_validado: estado, paso_validado: paso } : {}) }
    try { await pedirJson(`/api/tramites/${encodeURIComponent(expediente.id)}/eventos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave.current }, body: JSON.stringify(body) }); alGuardar() }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar. Actualiza el expediente antes de reintentar si cambió su versión.') }
    finally { setEnviando(false) }
  }
  return <Dialogo abierto titulo="Registrar actuación con sustento" alCerrar={alCerrar}><Contenido resultado={r} reintentar={retry} textoCarga="Consultando acciones autorizadas…">{({ items }) => items.length === 0 ? <p className="dialogo__cuerpo">No hay actuaciones habilitadas para tu rol y el estado actual.</p> : <form className="dialogo__cuerpo columna" onSubmit={enviar}><p className="nota">Registra hechos ya acreditados. El servidor comprueba permiso, estado, evidencia y versión; el portal no emite ni firma actos regulatorios.</p><label className="campo">Actuación<select required value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Selecciona una actuación</option>{items.map((a) => <option key={a.tipo} value={a.tipo}>{a.texto}</option>)}</select></label><label className="campo">Documento de sustento<select required={items.find((a) => a.tipo === tipo)?.requiere_documento} value={documento} onChange={(e) => setDocumento(e.target.value)}><option value="">Selecciona un documento incorporado</option>{(expediente.documentos ?? []).map((d) => <option key={d.id} value={d.id}>{d.titulo}</option>)}</select></label><label className="campo">Fecha acreditada<input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label><label className="campo">Detalle de la evidencia<textarea maxLength={2000} value={detalle} onChange={(e) => setDetalle(e.target.value)} /></label>{['requerir_informacion', 'requerir_subsanacion'].includes(tipo) && <><label className="campo">Días señalados expresamente en el oficio<input required min={1} max={60} type="number" value={dias} onChange={(e) => setDias(e.target.value)} /></label><label className="campo">Requisitos documentados (uno por línea)<textarea required value={requisitos} onChange={(e) => setRequisitos(e.target.value)} /></label></>}{tipo === 'resolver' && <label className="campo">Resultado acreditado<select value={resultado} onChange={(e) => setResultado(e.target.value)}><option value="autorizado">Autorizado</option><option value="no_autorizado">No autorizado</option></select></label>}{tipo === 'validar_expediente' && <><label className="campo">Estado documentado<select value={estado} onChange={(e) => setEstado(e.target.value)}>{['en_evaluacion', 'autorizado', 'no_autorizado', 'concluido'].map((s) => <option value={s} key={s}>{s}</option>)}</select></label><label className="campo">Paso documentado<input type="number" min={1} max={9} value={paso} onChange={(e) => setPaso(Number(e.target.value))} /></label></>}{error && <MensajeError mensaje={error} />}<button className="boton boton--primario" disabled={enviando || !tipo}>{enviando ? 'Registrando…' : 'Confirmar actuación documentada'}</button></form>}</Contenido></Dialogo>
}
