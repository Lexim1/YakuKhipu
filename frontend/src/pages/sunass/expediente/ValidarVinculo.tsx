import { useState } from 'react'
import { Chip, Fuente } from '../../../components/Chip'
import { Dialogo } from '../../../components/Dialogo'
import { IconoCheck, IconoFlecha } from '../../../components/Iconos'
import { MensajeError } from '../../../components/Mensajes'
import type { VinculoPropuesto } from '../../../types/tramite'

interface Props {
  vinculo: VinculoPropuesto
  abierto: boolean
  alCerrar: () => void
  /** Registra la confirmación en la API; si falla, el diálogo muestra el error. */
  alConfirmar: () => Promise<void>
  alRechazar: () => void
}

/** Una persona confirma o rechaza el vínculo que propuso el agente. */
export function ValidarVinculo({ vinculo, abierto, alCerrar, alConfirmar, alRechazar }: Props) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    setGuardando(true)
    setError(null)
    try {
      await alConfirmar()
      alCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos registrar la validación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialogo abierto={abierto} titulo="Validar vínculo propuesto" alCerrar={alCerrar}>
      <div className="dialogo__cuerpo">
        <div className="fila-chips">
          <Chip tono="agente">Propuesto por el agente</Chip>
          <Chip tono="ok">Confianza alta</Chip>
        </div>
        <div className="vinculo">
          <div className="vinculo__caja">
            <p className="siguiente__antetitulo">Documento recibido</p>
            <strong>{vinculo.documento}</strong>
            <span className="texto-suave">{vinculo.eps_fecha}</span>
          </div>
          <span style={{ color: 'var(--color-primario-texto)' }} aria-label="responde a">
            <IconoFlecha />
          </span>
          <div className="vinculo__caja">
            <p className="siguiente__antetitulo">Responde a</p>
            <strong>{vinculo.responde_a}</strong>
            <span className="texto-suave">{vinculo.responde_detalle}</span>
          </div>
        </div>
        <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <h3>Evidencia</h3>
          <p>{vinculo.evidencia}</p>
          <Fuente>{vinculo.fuente}</Fuente>
        </div>
        <p className="texto-suave texto-pequeno">{vinculo.efecto}</p>
        {error && <MensajeError mensaje={error} />}
        <div className="dialogo__acciones">
          <button type="button" className="boton boton--secundario" onClick={alRechazar}>
            Rechazar
          </button>
          <button type="button" className="boton boton--primario" onClick={confirmar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Confirmar vínculo'}
            <IconoCheck tamano={16} />
          </button>
        </div>
      </div>
    </Dialogo>
  )
}
