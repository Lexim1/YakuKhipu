import { useState, type FormEvent } from 'react'
import { Dialogo } from '../../../components/Dialogo'
import { Contenido, MensajeError, SinResultados } from '../../../components/Mensajes'
import { ErrorApi } from '../../../services/api'
import { asignarExpediente, listarCandidatosAsignacion } from '../../../services/tramites'
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

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (resultado.estado !== 'listo' || guardando || conflicto) return
    const persona = resultado.datos.find((candidato) => candidato.id === usuario)
    if (!persona || motivo.trim().length < 3) return
    setGuardando(true)
    setError(null)
    try {
      await asignarExpediente(expediente.id, { usuario_id: persona.id, motivo: motivo.trim(), version: expediente.version })
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
            <label className="campo">
              Analista SRT
              <select value={usuario} onChange={(e) => setUsuario(e.target.value)} required disabled={guardando || conflicto}>
                <option value="" disabled>Selecciona un analista</option>
                {candidatos.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
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
                <button type="submit" className="boton boton--primario" disabled={guardando || !usuario || motivo.trim().length < 3}>
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
