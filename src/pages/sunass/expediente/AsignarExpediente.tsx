import { useState, type FormEvent } from 'react'
import { Dialogo } from '../../../components/Dialogo'
import { Contenido, MensajeError, SinResultados } from '../../../components/Mensajes'
import { ErrorApi } from '../../../services/api'
import { asignarExpediente, listarCandidatosAsignacion, textoCandidato } from '../../../services/tramites'
import { useConsulta } from '../../../services/useConsulta'
import type { Expediente } from '../../../types/tramite'

interface Props {
  expediente: Expediente
  alCerrar: () => void
  alRecargar: () => void
  alAsignar: (nombre: string) => void
}

export function AsignarExpediente({ expediente, alCerrar, alRecargar, alAsignar }: Props) {
  const [resultado, reintentar] = useConsulta((signal) => listarCandidatosAsignacion(expediente.id, signal), [expediente.id])
  const [usuario, setUsuario] = useState('')
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const disponibles = resultado.estado === 'listo' ? resultado.datos.filter((p) => !p.asignacion_actual) : []
  const seleccionado = usuario || (disponibles.length === 1 ? disponibles[0].id : '')

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const ventana = evento.currentTarget.closest('dialog')
    if (resultado.estado !== 'listo' || guardando || conflicto) return
    const persona = disponibles.find((candidato) => candidato.id === seleccionado)
    if (!persona || motivo.trim().length < 3) return
    setGuardando(true)
    setError(null)
    try {
      await asignarExpediente(expediente.id, { usuario_id: persona.id, motivo: motivo.trim(), version: expediente.version })
      ventana?.close()
      alAsignar(persona.nombre)
    } catch (err) {
      setConflicto(err instanceof ErrorApi && err.estado === 409)
      setError(err instanceof Error ? err.message : 'No se pudo asignar el expediente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialogo abierto titulo="Asignar expediente" alCerrar={alCerrar}>
      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando analistas…">
        {(candidatos) => candidatos.length === 0 ? (
          <SinResultados titulo="No hay analistas activos para asignar" />
        ) : (
          <form className="columna" onSubmit={enviar}>
            <p className="nota">Ordenados por expedientes abiertos asignados. Los concluidos no aumentan la carga. En empate aparece primero quien recibió una asignación hace más tiempo. La elección final es tuya.</p>
            {candidatos.filter((p) => p.recomendado).length > 0 ? <p role="status">Menor carga: {candidatos.filter((p) => p.recomendado).map((p) => `${p.nombre} (${p.carga_activa} activos)`).join(', ')}.</p> : candidatos.some((p) => p.asignacion_actual && p.menor_carga) ? <p role="status">La asignación actual ya tiene la menor carga registrada.</p> : null}
            {candidatos.length === 1 && <p className="nota">Solo hay un analista activo; no hay otras personas entre las que distribuir expedientes.</p>}
            {disponibles.length === 0 && <p className="mensaje" role="status">Este expediente ya está asignado al único analista disponible. No necesitas asignarlo otra vez: continúa con el perfil de ese analista. Para reasignar se necesita otro analista activo.</p>}
            <button type="button" className="boton boton--secundario" disabled={guardando} onClick={() => { setUsuario(''); reintentar() }}>Actualizar carga</button>
            <label className="campo">
              Analista SRT
              <select value={seleccionado} onChange={(e) => setUsuario(e.target.value)} required disabled={guardando || conflicto || disponibles.length === 0}>
                <option value="" disabled>Selecciona un analista</option>
                {candidatos.map((persona) => <option key={persona.id} value={persona.id} disabled={persona.asignacion_actual}>{textoCandidato(persona)}</option>)}
              </select>
            </label>
            <label className="campo">
              Motivo
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} required minLength={3} maxLength={1000} disabled={guardando || conflicto} />
            </label>
            {error && <MensajeError mensaje={error} />}
            <div className="dialogo__acciones">
              {conflicto ? (
                <button type="button" className="boton boton--secundario" onClick={alRecargar}>Actualizar expediente</button>
              ) : (
                <button type="submit" className="boton boton--primario" disabled={guardando || !seleccionado || disponibles.length === 0 || motivo.trim().length < 3}>
                  {guardando ? 'Asignando…' : 'Confirmar asignación'}
                </button>
              )}
            </div>
          </form>
        )}
      </Contenido>
    </Dialogo>
  )
}
