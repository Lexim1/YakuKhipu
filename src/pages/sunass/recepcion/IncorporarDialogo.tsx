import { useState, type FormEvent } from 'react'
import { Chip } from '../../../components/Chip'
import { Dialogo } from '../../../components/Dialogo'
import { IconoCheck } from '../../../components/Iconos'
import { Contenido, MensajeError } from '../../../components/Mensajes'
import { usarEjemplos } from '../../../services/api'
import { obtenerCatalogosRecepcion, registrarExpedienteRecepcion, type Incorporacion } from '../../../services/tramites'
import { useConsulta } from '../../../services/useConsulta'
import { NOMBRE_COMPLETO, type CatalogosRecepcion, type DocumentoRecibido, type Procedimiento } from '../../../types/tramite'

interface Props {
  documento: DocumentoRecibido | null
  documentos: DocumentoRecibido[]
  alCerrar: () => void
  /** Recibe también el nombre de la persona asignada, para el mensaje de confirmación. */
  alIncorporar: (datos: Incorporacion, persona: string) => Promise<void>
  alRegistrar: (id: string, persona: string) => void
}

/** «Incorporar documento»: la persona confirma el expediente propuesto y a quién se asigna. */
export function IncorporarDialogo({ documento, documentos, alCerrar, alIncorporar, alRegistrar }: Props) {
  // Las opciones vienen del servicio: con la API real incluyen los expedientes que entrega el backend.
  const [catalogos, reintentar] = useConsulta((signal) => obtenerCatalogosRecepcion(signal), [])

  return (
    <Dialogo abierto={documento != null} titulo="Incorporar documento" alCerrar={alCerrar}>
      <Contenido resultado={catalogos} reintentar={reintentar} textoCarga="Cargando opciones…">
        {(datos) => (
          <Formulario
            catalogos={datos}
            documento={documento}
            documentos={documentos}
            alCerrar={alCerrar}
            alIncorporar={alIncorporar}
            alRegistrar={alRegistrar}
          />
        )}
      </Contenido>
    </Dialogo>
  )
}

function Formulario({ catalogos, documento, documentos, alCerrar, alIncorporar, alRegistrar }: Props & { catalogos: CatalogosRecepcion }) {
  // Solo documentos oficiales cuyo PDF (si lo tienen) ya terminó de procesarse.
  const oficiales = documentos.filter(
    (d) => d.canal_oficial && (!d.procesamiento_pdf || d.procesamiento_pdf.estado === 'listo'),
  )
  const [documentoId, setDocumentoId] = useState(documento?.id ?? '')
  const elegido = oficiales.find((d) => d.id === documentoId) ?? documento
  const propuesto = elegido?.propuesta?.tramite_id ?? ''
  // El backend solo acepta expedientes de la misma EPS que el documento.
  const expedientes = catalogos.expedientes.filter(
    (t) => !elegido?.eps_id || !t.eps_id || t.eps_id === elegido.eps_id,
  )
  const [tramiteId, setTramiteId] = useState(propuesto)
  const [tipo, setTipo] = useState(catalogos.tipos_actuacion[0] ?? '')
  const [asignado, setAsignado] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [procedimiento, setProcedimiento] = useState<Procedimiento>('CPI')
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarDocumento(id: string) {
    setDocumentoId(id)
    setTramiteId(oficiales.find((d) => d.id === id)?.propuesta?.tramite_id ?? '')
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (guardando) return
    if (!nuevo && !tramiteId) {
      setError('Elige el expediente al que pertenece el documento.')
      return
    }
    if (nuevo && !fechaIngreso) {
      setError('Indica la fecha de ingreso acreditada por Mesa de Partes.')
      return
    }
    const version = catalogos.expedientes.find((t) => t.id === tramiteId)?.version
    if (!nuevo && version == null) {
      setError('Ese expediente ya no admite documentos. Elige otro.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const persona = catalogos.asignables.find((a) => a.id === asignado)?.texto ?? ''
      if (nuevo) {
        const creado = await registrarExpedienteRecepcion({
          documento_id: documentoId, procedimiento, fecha_ingreso: fechaIngreso, asignado_a: asignado || null,
        })
        alRegistrar(creado.tramite_id, persona)
        return
      }
      await alIncorporar(
        {
          documento_id: documentoId,
          tramite_id: tramiteId,
          tipo_actuacion: tipo,
          asignado_a: asignado || null,
          avisar: false,
          version: version!,
        },
        persona,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos incorporar el documento.')
      setGuardando(false)
    }
  }

  return (
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
        {!usarEjemplos && catalogos.asignables.length > 0 && (
          <label className="campo">
            Destino
            <select value={nuevo ? 'nuevo' : 'existente'} onChange={(e) => setNuevo(e.target.value === 'nuevo')}>
              <option value="existente">Expediente existente</option>
              <option value="nuevo">Registrar expediente nuevo</option>
            </select>
          </label>
        )}
        {nuevo ? (
          <>
            <label className="campo">
              Procedimiento
              <select value={procedimiento} onChange={(e) => setProcedimiento(e.target.value as Procedimiento)}>
                {(['CPI', 'UFI', 'RP'] as const).map((p) => <option key={p} value={p}>{NOMBRE_COMPLETO[p]}</option>)}
              </select>
            </label>
            <label className="campo">
              Fecha de ingreso según el cargo de Mesa de Partes
              <input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} required />
            </label>
          </>
        ) : (
          <>
        <label className="campo">
          <span className="etiqueta-campo">
            Expediente
            {tramiteId && tramiteId === propuesto && <Chip tono="agente">Propuesto por el agente</Chip>}
          </span>
          <select value={tramiteId} onChange={(e) => setTramiteId(e.target.value)} required>
            <option value="">Elige un expediente</option>
            {expedientes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} · {t.eps}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Tipo de actuación
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {catalogos.tipos_actuacion.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
          </>
        )}
        {catalogos.asignables.length > 0 && <label className="campo">
          <span className="etiqueta-campo">
            Asignar a{catalogos.asignables.find((a) => a.id === asignado)?.menor_carga && <Chip tono="agente">Menor carga</Chip>}
          </span>
          <select value={asignado} onChange={(e) => setAsignado(e.target.value)}>
            <option value="">{nuevo ? 'Sin asignar; Coordinación lo deriva después' : 'Conservar la asignación actual'}</option>
            {catalogos.asignables.map((a) => (
              <option key={a.id} value={a.id}>
                {a.texto}{a.carga_activa != null ? ` · ${a.carga_activa} activos` : ' · carga no disponible'}{a.recomendado ? ' · menor carga' : ''}
              </option>
            ))}
          </select>
        </label>}
        {catalogos.asignables.length > 0 && <p className="nota">Carga de expedientes abiertos al consultar el formulario; no incluye concluidos. {catalogos.asignables.length === 1 ? 'Solo hay un analista activo.' : 'La recomendación no asigna automáticamente: puedes elegir según disponibilidad y especialidad.'}</p>}
        {error && <MensajeError mensaje={error} />}
        <div className="dialogo__acciones">
          <button type="button" className="boton boton--secundario" onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? 'Guardando…' : nuevo ? (asignado ? 'Registrar y derivar' : 'Registrar solicitud') : asignado ? 'Incorporar y asignar' : 'Incorporar documento'}
            <IconoCheck tamano={16} />
          </button>
        </div>
    </form>
  )
}
