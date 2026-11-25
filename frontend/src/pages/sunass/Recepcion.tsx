import { useEffect, useState, type FormEvent } from 'react'
import { pedir, pedirJson } from '../../services/api'

interface Destino {
  id: string
  titulo: string
  eps_id: string
  eps: string
  version: number
}

interface Recibido {
  id: string
  titulo: string
  referencia: string
  eps_id: string
  procesamiento_pdf?: { estado: string; error?: string; paginas?: number }
}

export function Recepcion() {
  const [recibidos, setRecibidos] = useState<Recibido[]>([])
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const empresas = [...new Map(destinos.map((d) => [d.eps_id, d.eps])).entries()]

  async function actualizar(signal?: AbortSignal) {
    const [recepcion, expedientes] = await Promise.all([
      pedirJson<{ items: Recibido[] }>('/api/recepcion', { signal }),
      pedirJson<{ items: Destino[] }>('/api/recepcion/destinos', { signal }),
    ])
    setRecibidos(recepcion.items)
    setDestinos(expedientes.items)
  }

  useEffect(() => {
    const controlador = new AbortController()
    const cargar = () => actualizar(controlador.signal).catch((e: Error) => {
      if (!controlador.signal.aborted) setError(e.message)
    })
    void cargar()
    const timer = window.setInterval(cargar, 5000)
    return () => {
      controlador.abort()
      window.clearInterval(timer)
    }
  }, [])

  async function ejecutar(operacion: () => Promise<unknown>, resultado: string) {
    setOcupado(true)
    setError('')
    setMensaje('')
    try {
      await operacion()
      setMensaje(resultado)
      await actualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la operación.')
    } finally {
      setOcupado(false)
    }
  }

  function cargar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    void ejecutar(async () => {
      await pedir('/api/recepcion/pdf', { method: 'POST', body: datos })
      formulario.reset()
    }, 'PDF recibido. El procesamiento continuará en segundo plano.')
  }

  function incorporar(evento: FormEvent<HTMLFormElement>, documento: Recibido) {
    evento.preventDefault()
    const seleccionado = new FormData(evento.currentTarget).get('tramite_id')
    const destino = destinos.find((d) => d.id === seleccionado && d.eps_id === documento.eps_id)
    if (!destino) return
    void ejecutar(() => pedir('/api/recepcion/incorporaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento_id: documento.id, tramite_id: destino.id, version: destino.version,
        tipo_actuacion: 'Incorporación desde Recepción' }),
    }), 'Documento incorporado al expediente.')
  }

  return (
    <section>
      <h1>Recepción de documentos</h1>
      <form onSubmit={cargar}>
        <fieldset disabled={ocupado}>
          <legend>Cargar PDF</legend>
          <label>Título <input name="titulo" required minLength={3} maxLength={200} /></label>{' '}
          <label>Referencia <input name="referencia" required minLength={2} maxLength={120} /></label>{' '}
          <label>Fecha del documento <input name="fecha_documento" type="date" required /></label>{' '}
          <label>EPS <select name="eps_id" required defaultValue="">
            <option value="" disabled>Selecciona la EPS</option>
            {empresas.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
          </select></label>{' '}
          <label>Archivo PDF <input name="archivo" type="file" accept=".pdf,application/pdf" required /></label>{' '}
          <button type="submit" className="boton boton--primario">Cargar PDF</button>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      <h2>Pendientes de incorporar</h2>
      {recibidos.length === 0 && <p>No hay documentos pendientes.</p>}
      {recibidos.map((d) => {
        const pdf = d.procesamiento_pdf
        return <article key={d.id}>
          <h3>{d.titulo} · {d.referencia}</h3>
          {pdf && <p>PDF {pdf.estado}{pdf.paginas ? ` · ${pdf.paginas} páginas` : ''}{pdf.error ? ` · ${pdf.error}` : ''}</p>}
          {(!pdf || pdf.estado === 'listo') && <form onSubmit={(e) => incorporar(e, d)}>
            <label>Expediente <select name="tramite_id" required defaultValue="">
              <option value="" disabled>Selecciona un expediente</option>
              {destinos.filter((item) => item.eps_id === d.eps_id).map((item) =>
                <option key={item.id} value={item.id}>{item.titulo}</option>)}
            </select></label>{' '}
            <button type="submit" className="boton boton--primario" disabled={ocupado}>Incorporar</button>
          </form>}
        </article>
      })}
    </section>
  )
}
