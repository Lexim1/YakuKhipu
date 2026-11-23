import { useState, type FormEvent } from 'react'
import { Chip } from '../../../components/Chip'
import { Dialogo } from '../../../components/Dialogo'
import { IconoCheck } from '../../../components/Iconos'
import { MensajeError } from '../../../components/Mensajes'
import { ASIGNABLES, TIPOS_ACTUACION, TRAMITES } from '../../../mocks/tramites'
import type { Incorporacion } from '../../../services/tramites'
import type { DocumentoRecibido } from '../../../types/tramite'

interface Props {
  documento: DocumentoRecibido | null
  documentos: DocumentoRecibido[]
  alCerrar: () => void
  alIncorporar: (datos: Incorporacion) => Promise<void>
}

/** «Incorporar documento»: la persona confirma el expediente propuesto y a quién se asigna. */
export function IncorporarDialogo({ documento, documentos, alCerrar, alIncorporar }: Props) {
  const oficiales = documentos.filter((d) => d.canal_oficial)
  const [documentoId, setDocumentoId] = useState(documento?.id ?? '')
  const elegido = oficiales.find((d) => d.id === documentoId) ?? documento
  const propuesto = elegido?.propuesta?.tramite_id ?? ''
  const [tramiteId, setTramiteId] = useState(propuesto)
  const [tipo, setTipo] = useState(TIPOS_ACTUACION[0])
  const [asignado, setAsignado] = useState(ASIGNABLES[0].id)
  const [avisar, setAvisar] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarDocumento(id: string) {
    setDocumentoId(id)
    setTramiteId(oficiales.find((d) => d.id === id)?.propuesta?.tramite_id ?? '')
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!tramiteId) {
      setError('Elige el expediente al que pertenece el documento.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await alIncorporar({
        documento_id: documentoId,
        tramite_id: tramiteId,
        tipo_actuacion: tipo,
        asignado_a: asignado,
        avisar,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos incorporar el documento.')
      setGuardando(false)
    }
  }

  return (
    <Dialogo abierto={documento != null} titulo="Incorporar documento" alCerrar={alCerrar}>
      <form className="dialogo__cuerpo" onSubmit={enviar}>
        <label className="campo">
          Documento
          <select value={documentoId} onChange={(e) => cambiarDocumento(e.target.value)}>
            {oficiales.map((d) => (
              <option key={d.id} value={d.id}>
                {d.titulo} · {d.eps}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="etiqueta-campo">
            Expediente
            {tramiteId && tramiteId === propuesto && <Chip tono="agente">Propuesto por el agente</Chip>}
          </span>
          <select value={tramiteId} onChange={(e) => setTramiteId(e.target.value)} required>
            <option value="">Elige un expediente</option>
            {TRAMITES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} · {t.eps}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Tipo de actuación
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_ACTUACION.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="etiqueta-campo">
            Asignar a{ASIGNABLES.find((a) => a.id === asignado)?.menor_carga && <Chip tono="agente">Menor carga</Chip>}
          </span>
          <select value={asignado} onChange={(e) => setAsignado(e.target.value)}>
            {ASIGNABLES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.texto}
              </option>
            ))}
          </select>
        </label>
        <label className="casilla">
          <input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />
          Avisar a la analista y abrir su tarea
        </label>
        {error && <MensajeError mensaje={error} />}
        <div className="dialogo__acciones">
          <button type="button" className="boton boton--secundario" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? 'Incorporando…' : 'Incorporar y asignar'}
            <IconoCheck tamano={16} />
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
