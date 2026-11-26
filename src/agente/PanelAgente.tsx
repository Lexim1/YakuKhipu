import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Fuente } from '../components/Chip'
import { Dialogo } from '../components/Dialogo'
import { IconoChispa, IconoCerrar, IconoDocumento, IconoEnviar } from '../components/Iconos'
import { usarEjemplos } from '../services/api'
import {
  preguntarAlAgente,
  type FuenteCita,
  type RespuestaAgente,
} from '../services/asistente'
import { useAgente } from './useAgente'
import { VisorFuente } from './VisorFuente'

type Mensaje = { id: number; pregunta: string } & (
  | { estado: 'cargando' }
  | { estado: 'listo'; respuesta: RespuestaAgente }
  | { estado: 'error'; mensaje: string }
)

const NOTA_SIN_FUENTES: Record<string, string> = {
  sin_fuentes: 'No encontré documentos que respalden una respuesta. Revisa el expediente o pregunta de otra forma.',
  no_disponible: 'Esta información todavía no está disponible en las fuentes del caso.',
}

function textoCita(f: FuenteCita) {
  return f.pagina_pdf ? `${f.titulo} · pág. ${f.pagina_pdf}` : f.titulo
}

/** Botón flotante «Preguntar al agente» y su panel de conversación. */
export function PanelAgente() {
  const { abierto, abrir, cerrar, contexto, preguntaInicial } = useAgente()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [citaAbierta, setCitaAbierta] = useState<FuenteCita | null>(null)
  const conversacion = useRef<string | null>(null)
  const control = useRef<AbortController | null>(null)
  const final = useRef<HTMLDivElement>(null)
  const siguienteId = useRef(0)
  const preguntas = contexto?.preguntas ?? []
  const publico = contexto?.publico ?? contexto?.caso?.tipo === 'publico'
  const claveCaso = `${contexto?.espacio ?? ''}|${contexto?.caso?.id ?? ''}`
  const esperando = mensajes.some((m) => m.estado === 'cargando')
  const puedePreguntar = usarEjemplos || Boolean(contexto?.caso || contexto?.cartera)

  // Al cambiar de caso, la conversación empieza de nuevo y se cancela la pregunta pendiente.
  useEffect(() => {
    control.current?.abort()
    conversacion.current = null
    setMensajes([])
    setCitaAbierta(null)
  }, [claveCaso])

  useEffect(() => () => control.current?.abort(), [])

  useEffect(() => {
    if (abierto && preguntaInicial) preguntar(preguntaInicial)
    // Solo cuando se abre con una pregunta concreta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, preguntaInicial])

  useEffect(() => {
    if (!citaAbierta) final.current?.scrollIntoView({ block: 'end' })
  }, [mensajes, citaAbierta])

  function actualizar(mensaje: Mensaje) {
    setMensajes((actuales) => actuales.map((m) => (m.id === mensaje.id ? mensaje : m)))
  }

  async function preguntar(pregunta: string) {
    const limpia = pregunta.trim()
    if (!limpia || esperando || !puedePreguntar) return
    setTexto('')
    siguienteId.current += 1
    const id = siguienteId.current
    setMensajes((actuales) => [...actuales, { id, pregunta: limpia, estado: 'cargando' }])

    const nuevo = new AbortController()
    control.current = nuevo
    try {
      const respuesta = await preguntarAlAgente(
        { caso: contexto?.caso, cartera: contexto?.cartera, pregunta: limpia, preguntas, conversacionId: conversacion.current },
        nuevo.signal,
      )
      if (contexto?.caso && !usarEjemplos) conversacion.current = respuesta.conversacion_id
      actualizar({ id, pregunta: limpia, estado: 'listo', respuesta })
    } catch (error) {
      if (nuevo.signal.aborted) return
      const mensaje = error instanceof Error ? error.message : 'No pudimos obtener la respuesta.'
      actualizar({ id, pregunta: limpia, estado: 'error', mensaje })
    }
  }

  function reintentar(id: number, pregunta: string) {
    setMensajes((actuales) => actuales.filter((m) => m.id !== id))
    void preguntar(pregunta)
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    void preguntar(texto)
  }

  const pendientes = preguntas.filter((p) => !mensajes.some((m) => m.pregunta === p.pregunta))

  return (
    <>
      <button type="button" className="boton-agente" onClick={() => abrir()} aria-haspopup="dialog">
        <span className="boton-agente__icono">
          <IconoChispa tamano={16} />
        </span>
        <span className="boton-agente__texto">Preguntar al agente</span>
        <span className="solo-lectores">Preguntar al agente</span>
      </button>
      <Dialogo abierto={abierto} titulo="Agente YakuKhipu" alCerrar={cerrar} lateral sinCabecera>
        <div className="agente">
          <div className="agente__cabecera">
            <span className="agente__logo">
              <IconoChispa tamano={18} />
            </span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.0625rem' }}>Agente YakuKhipu</h2>
              <p className="texto-pequeno texto-suave">
                {publico ? 'Explica en lenguaje sencillo' : 'Te ayuda a revisar con fuentes'}
              </p>
              {contexto && (
                <span className="chip chip--marca chip--sin-punto" style={{ marginTop: 6 }}>
                  {contexto.espacio}
                </span>
              )}
            </div>
            <button type="button" className="dialogo__cerrar" onClick={cerrar} aria-label="Cerrar">
              <IconoCerrar tamano={16} />
            </button>
          </div>

          {citaAbierta ? (
            <div className="agente__conversacion">
              <VisorFuente cita={citaAbierta} alVolver={() => setCitaAbierta(null)} />
            </div>
          ) : (
            <div className="agente__conversacion" aria-live="polite">
              {mensajes.length === 0 && (
                <p className="texto-suave">
                  {contexto?.caso
                    ? 'Pregunta lo que quieras sobre este caso. Responderé citando la página de cada documento.'
                    : contexto?.cartera
                      ? 'Consulta qué expedientes de tu cartera ya vencieron o están por vencer.'
                      : puedePreguntar
                      ? 'Elige una pregunta sugerida o escribe la tuya.'
                      : 'Abre un expediente o una decisión para consultar documentos con el agente. Para próximos vencimientos, revisa Alertas.'}
                </p>
              )}
              {mensajes.map((m) => (
                <div key={m.id} style={{ display: 'contents' }}>
                  <p className="agente__pregunta">{m.pregunta}</p>
                  {m.estado === 'cargando' && (
                    <div className="agente__respuesta agente__respuesta--cargando" role="status">
                      <span className="agente__puntos" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      Revisando las fuentes…
                    </div>
                  )}
                  {m.estado === 'error' && (
                    <div className="agente__respuesta agente__respuesta--error">
                      <p>{m.mensaje}</p>
                      <button
                        type="button"
                        className="boton boton--secundario"
                        onClick={() => reintentar(m.id, m.pregunta)}
                        disabled={esperando}
                      >
                        Volver a preguntar
                      </button>
                    </div>
                  )}
                  {m.estado === 'listo' && (
                    <div className="agente__respuesta">
                      <p>{m.respuesta.respuesta}</p>
                      {m.respuesta.estado !== 'ok' && (
                        <p className="agente__aviso">{NOTA_SIN_FUENTES[m.respuesta.estado]}</p>
                      )}
                      {m.respuesta.fuentes.length > 0 && (
                        <div className="fila-chips">
                          {m.respuesta.fuentes.map((f) =>
                            f.enlace ? (
                              <button
                                key={f.fragmento_id}
                                type="button"
                                className="fuente fuente--boton"
                                onClick={() => setCitaAbierta(f)}
                              >
                                <IconoDocumento tamano={12} />
                                {textoCita(f)}
                                <span className="solo-lectores"> (abrir la fuente)</span>
                              </button>
                            ) : (
                              <Fuente key={f.fragmento_id}>{textoCita(f)}</Fuente>
                            ),
                          )}
                        </div>
                      )}
                      {m.respuesta.advertencias.map((a) => (
                        <p key={a} className="agente__aviso">
                          {a}
                        </p>
                      ))}
                      {m.respuesta.conversacion_id !== 'cartera' && <p className="nota">Consulta de fuentes · una persona revisa el resultado.</p>}
                    </div>
                  )}
                </div>
              ))}
              {puedePreguntar && pendientes.length > 0 && (
                <div className="agente__sugerencias" aria-label="Preguntas sugeridas">
                  {pendientes.map((p) => (
                    <button
                      key={p.pregunta}
                      type="button"
                      className="pastilla"
                      onClick={() => preguntar(p.pregunta)}
                      disabled={esperando}
                    >
                      {p.pregunta}
                    </button>
                  ))}
                </div>
              )}
              <div ref={final} />
            </div>
          )}

          <div className="agente__pie">
            {puedePreguntar && <form className="agente__formulario" onSubmit={enviar}>
              <label htmlFor="pregunta-agente" className="solo-lectores">
                Escribe tu pregunta sobre el caso
              </label>
              <input
                id="pregunta-agente"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu pregunta sobre el caso"
                autoComplete="off"
                maxLength={publico ? 600 : 1000}
              />
              <button
                type="submit"
                className="boton boton--primario"
                aria-label="Enviar pregunta"
                disabled={esperando || texto.trim().length < 2}
              >
                <IconoEnviar tamano={18} />
              </button>
            </form>}
            <p className="nota">
              {publico
                ? 'Cita solo fuentes públicas. Para participar, usa los canales oficiales.'
                : 'Propone con cita de página. Una persona decide.'}
            </p>
          </div>
        </div>
      </Dialogo>
    </>
  )
}
