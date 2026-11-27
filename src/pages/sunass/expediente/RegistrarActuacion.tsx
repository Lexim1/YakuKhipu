import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Dialogo } from '../../../components/Dialogo'
import { Contenido, MensajeError } from '../../../components/Mensajes'
import { pedirJson } from '../../../services/api'
import { useConsulta } from '../../../services/useConsulta'
import type { Expediente } from '../../../types/tramite'

interface Accion { tipo: string; texto: string; requiere_documento: boolean }

export function RegistrarActuacion({ expediente, alCerrar, alGuardar, accionInicial, puedeRecepcion }: {
  expediente: Expediente; alCerrar: () => void; alGuardar: () => void; accionInicial?: string; puedeRecepcion?: boolean
}) {
  const [consulta, reintentar] = useConsulta(
    (signal) => pedirJson<{ items: Accion[] }>(`/api/tramites/${encodeURIComponent(expediente.id)}/acciones`, { signal }),
    [expediente.id, expediente.version],
  )
  const [tipo, setTipo] = useState(accionInicial ?? '')
  const [documento, setDocumento] = useState('')
  const [fecha, setFecha] = useState('')
  const [detalle, setDetalle] = useState('')
  const [dias, setDias] = useState('')
  const [requisitos, setRequisitos] = useState('')
  const [resultado, setResultado] = useState('autorizado')
  const [estado, setEstado] = useState('en_evaluacion')
  const [paso, setPaso] = useState(1)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const clave = useRef(crypto.randomUUID())

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando || consulta.estado !== 'listo') return
    const accion = consulta.datos.items.find((item) => item.tipo === tipo)
    if (!accion) return setError('Selecciona una actuación permitida para tu perfil y este paso.')
    if (accion.requiere_documento && !documento) return setError('Incorpora primero el documento de sustento.')
    setEnviando(true)
    setError('')
    const body = {
      tipo, version: expediente.version, fecha_acreditada: fecha || null,
      documento_id: documento || null, detalle: detalle || null,
      ...(['requerir_informacion', 'requerir_subsanacion'].includes(tipo)
        ? { plazo_dias: Number(dias), requisitos: requisitos.split('\n').map((s) => s.trim()).filter(Boolean) }
        : {}),
      ...(tipo === 'resolver' ? { resultado: resultado === 'autorizado_parcial' ? 'autorizado' : resultado, ...(resultado === 'autorizado_parcial' ? { alcance_autorizacion: 'parcial' } : {}) } : {}),
      ...(tipo === 'validar_expediente' ? { estado_validado: estado, paso_validado: paso } : {}),
    }
    try {
      await pedirJson(`/api/tramites/${encodeURIComponent(expediente.id)}/eventos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave.current },
        body: JSON.stringify(body),
      })
      alGuardar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar. Actualiza el expediente y vuelve a intentarlo.')
    } finally {
      setEnviando(false)
    }
  }

  return <Dialogo abierto titulo="Registrar actuación con sustento" alCerrar={alCerrar}>
    <Contenido resultado={consulta} reintentar={reintentar} textoCarga="Consultando acciones autorizadas…">
      {({ items }) => items.length === 0
        ? <p className="dialogo__cuerpo">No hay actuaciones habilitadas para tu perfil y el estado actual del expediente.</p>
        : <form className="dialogo__cuerpo columna" onSubmit={enviar}>
          <p className="nota">Registra únicamente hechos ya acreditados. El avance se guarda en el expediente y se refleja en el flujograma al confirmar.</p>
          <label className="campo">Actuación
            <select required value={tipo} onChange={(e) => { setTipo(e.target.value); setError('') }}>
              <option value="">Selecciona una actuación</option>
              {items.map((a) => <option key={a.tipo} value={a.tipo}>{a.texto}</option>)}
            </select>
          </label>
          {tipo && !items.some((a) => a.tipo === tipo) && <MensajeError mensaje="Este paso requiere otro perfil o estado. Elige una actuación de la lista." />}
          <label className="campo">Documento de sustento
            <select required={items.find((a) => a.tipo === tipo)?.requiere_documento} value={documento} onChange={(e) => setDocumento(e.target.value)}>
              <option value="">{expediente.documentos?.length ? 'Selecciona un documento incorporado' : 'Aún no hay documentos incorporados'}</option>
              {(expediente.documentos ?? []).map((d) => <option key={d.id} value={d.id}>{d.titulo}</option>)}
            </select>
          </label>
          {items.find((a) => a.tipo === tipo)?.requiere_documento && !expediente.documentos?.length &&
            <p className="mensaje">Coordinación DRE debe cargar el PDF recibido por Mesa de Partes y vincularlo a este expediente desde {puedeRecepcion ? <Link to="/sunass/recepcion" onClick={alCerrar}>Recepción de documentos</Link> : 'Recepción de documentos'}. Después actualiza esta ficha.</p>}
          <label className="campo">Fecha acreditada
            <input required={items.find((a) => a.tipo === tipo)?.requiere_documento} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="campo">Detalle de la evidencia
            <textarea required={tipo === 'cerrar_expediente'} maxLength={2000} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </label>
          {['requerir_informacion', 'requerir_subsanacion'].includes(tipo) && <>
            <label className="campo">Días señalados expresamente en el oficio
              <input required min={1} max={60} type="number" value={dias} onChange={(e) => setDias(e.target.value)} />
            </label>
            <label className="campo">Requisitos documentados (uno por línea)
              <textarea required value={requisitos} onChange={(e) => setRequisitos(e.target.value)} />
            </label>
          </>}
          {tipo === 'resolver' && <label className="campo">Resultado acreditado
            <select value={resultado} onChange={(e) => setResultado(e.target.value)}><option value="autorizado">Autorizado</option><option value="autorizado_parcial">Autorizado parcialmente</option><option value="no_autorizado">No autorizado</option></select>
          </label>}
          {tipo === 'validar_expediente' && <>
            <label className="campo">Estado documentado
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>{['en_evaluacion', 'autorizado', 'no_autorizado', 'concluido'].map((s) => <option value={s} key={s}>{s}</option>)}</select>
            </label>
            <label className="campo">Paso documentado
              <input type="number" min={1} max={expediente.flujo.pasos.length} value={paso} onChange={(e) => setPaso(Number(e.target.value))} />
            </label>
          </>}
          {error && <MensajeError mensaje={error} />}
          <button className="boton boton--primario" disabled={enviando || !tipo || (!!items.find((a) => a.tipo === tipo)?.requiere_documento && !expediente.documentos?.length)}>
            {enviando ? 'Registrando…' : 'Confirmar actuación documentada'}
          </button>
        </form>}
    </Contenido>
  </Dialogo>
}
