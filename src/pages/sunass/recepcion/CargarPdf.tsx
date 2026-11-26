import { useEffect, useState, type FormEvent } from 'react'
import { IconoDocumento } from '../../../components/Iconos'
import { MensajeError } from '../../../components/Mensajes'
import { cargarPdf, listarDestinos } from '../../../services/tramites'
import { obtenerEstadoServidor } from '../../../services/sesion'

/** Fecha de hoy en formato del campo date: no se aceptan documentos con fecha futura. */
function hoyIso() {
  const hoy = new Date()
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset())
  return hoy.toISOString().slice(0, 10)
}

/**
 * Carga de un PDF recibido por Mesa de Partes. El backend lo guarda en un bucket privado y un proceso
 * aparte extrae el texto (con OCR si hace falta). Solo se muestra si el servidor tiene la carga habilitada.
 */
export function CargarPdf({ alCargar }: { alCargar: (titulo: string) => void }) {
  const [habilitada, setHabilitada] = useState<boolean | null>(null)
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [abierto, setAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const control = new AbortController()
    void obtenerEstadoServidor().then((e) => !control.signal.aborted && setHabilitada(e.carga_pdf))
    listarDestinos(control.signal)
      .then((destinos) =>
        setEmpresas([...new Map(destinos.map((d) => [d.eps_id, d.eps])).entries()].map(([id, nombre]) => ({ id, nombre }))),
      )
      .catch(() => {
        // Sin destinos no se puede elegir la EPS; el formulario lo indica.
      })
    return () => control.abort()
  }, [])

  if (habilitada === null) return null

  if (!habilitada) {
    return (
      <p className="mensaje texto-pequeno">
        La carga de PDF se activa cuando el servidor tiene configurado el almacenamiento privado de documentos.
      </p>
    )
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formulario = e.currentTarget
    const datos = new FormData(formulario)
    const archivo = datos.get('archivo')
    if (!(archivo instanceof File) || archivo.size === 0) return setError('Elige el archivo PDF.')
    if (archivo.size > 20 * 1024 * 1024) return setError('El PDF supera el límite de 20 MiB.')
    setEnviando(true)
    setError(null)
    try {
      await cargarPdf(datos)
      formulario.reset()
      setAbierto(false)
      alCargar(String(datos.get('titulo')))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el PDF.')
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <div>
        <button type="button" className="boton boton--secundario" onClick={() => setAbierto(true)}>
          Cargar PDF recibido
          <IconoDocumento tamano={16} />
        </button>
      </div>
    )
  }

  return (
    <form className="tarjeta columna" onSubmit={enviar} aria-labelledby="titulo-cargar-pdf">
      <h2 id="titulo-cargar-pdf">Cargar PDF recibido</h2>
      <p className="texto-pequeno texto-suave">
        Hasta 20 MiB y 80 páginas. El texto se extrae en segundo plano; podrás incorporarlo cuando esté listo.
      </p>
      <div className="dos-mitades">
        <label className="campo">
          Título
          <input name="titulo" required minLength={3} maxLength={200} placeholder="Ej. Oficio 1628-2026" />
        </label>
        <label className="campo">
          Referencia o hoja de trámite
          <input name="referencia" required minLength={2} maxLength={120} placeholder="Ej. 2026-E01-067906" />
        </label>
        <label className="campo">
          Fecha del documento
          <input name="fecha_documento" type="date" required max={hoyIso()} />
        </label>
        <label className="campo">
          EPS
          <select name="eps_id" required defaultValue="">
            <option value="" disabled>
              {empresas.length ? 'Elige la EPS' : 'No hay expedientes abiertos'}
            </option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="campo">
        Archivo PDF
        <input name="archivo" type="file" accept=".pdf,application/pdf" required />
      </label>
      {error && <MensajeError mensaje={error} />}
      <div className="dialogo__acciones">
        <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? 'Cargando…' : 'Cargar PDF'}
        </button>
      </div>
    </form>
  )
}
