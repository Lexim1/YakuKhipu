import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useMatch } from 'react-router'
import { Fuente } from '../components/Chip'
import { Dialogo } from '../components/Dialogo'
import { IconoChispa, IconoCerrar, IconoEnviar } from '../components/Iconos'
import { useAgente } from './useAgente'
import type { PreguntaAgente } from './tipos'
import { baseUrl, pedirJson, usarEjemplos } from '../services/api'

interface Mensaje {
  pregunta: string
  respuesta: string
  fuentes: string[]
  citas?: Cita[]
}

interface Cita {
  titulo: string
  fragmento_id: string
  pagina_pdf: number | null
  enlace: string | null
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function buscarRespuesta(texto: string, preguntas: PreguntaAgente[]): Mensaje {
  const t = normalizar(texto)
  const elegida = preguntas.find(
    (p) => normalizar(p.pregunta) === t || (p.palabras ?? []).some((palabra) => t.includes(normalizar(palabra))),
  )
  if (elegida) return { pregunta: texto, respuesta: elegida.respuesta, fuentes: elegida.fuentes }
  return {
    pregunta: texto,
    respuesta:
      'En esta demostración el agente responde las preguntas sugeridas. Con el backend conectado, buscará en los documentos del expediente y citará la página.',
    fuentes: [],
  }
}

/** Botón flotante «Preguntar al agente» y su panel de conversación. */
export function PanelAgente() {
  const { pathname } = useLocation()
  return <PanelConversacion key={pathname} />
}

function PanelConversacion() {
  const { abierto, abrir, cerrar, contexto, preguntaInicial } = useAgente()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const final = useRef<HTMLDivElement>(null)
  const solicitud = useRef<AbortController | null>(null)
  const conversacion = useRef<string | undefined>(undefined)
  const expediente = useMatch('/sunass/expedientes/:id')
  const tramiteEps = useMatch('/eps/tramites/:id/*')
  const decision = useMatch('/ciudadania/decisiones/:id')
  const casoId = decision?.params.id
  const tramiteId = expediente?.params.id || tramiteEps?.params.id
  const preguntas = contexto?.preguntas ?? []

  useEffect(() => () => {
    solicitud.current?.abort()
    solicitud.current = null
  }, [])

  useEffect(() => final.current?.scrollIntoView({ block: 'end' }), [mensajes])

  const preguntar = useCallback(async (entrada: string) => {
    const pregunta = entrada.trim()
    if (pregunta.length < 2 || solicitud.current) return
    setTexto('')
    if (usarEjemplos) {
      setMensajes((m) => [...m, buscarRespuesta(pregunta, contexto?.preguntas ?? [])])
      return
    }
    if (!casoId && !tramiteId) {
      setMensajes((m) => [...m, { pregunta, respuesta: 'Abre un expediente o una decisión para consultar sus fuentes.', fuentes: [] }])
      return
    }
    const controlador = new AbortController()
    solicitud.current = controlador
    setOcupado(true)
    try {
      const ruta = casoId ? '/api/publico/asistente/chat' : '/api/agente/chat'
      const payload = { pregunta, conversacion_id: conversacion.current,
        ...(casoId ? { caso_id: casoId } : { tramite_id: tramiteId }) }
      const datos = await pedirJson<{ respuesta: string; fuentes: Cita[]; conversacion_id: string }>(ruta, {
        method: 'POST', signal: controlador.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      conversacion.current = datos.conversacion_id
      setMensajes((m) => [...m, { pregunta, respuesta: datos.respuesta, fuentes: [], citas: datos.fuentes }])
    } catch (e) {
      if (!controlador.signal.aborted) {
        const respuesta = e instanceof Error ? e.message : 'El agente no está disponible.'
        setMensajes((m) => [...m, { pregunta, respuesta, fuentes: [] }])
      }
    } finally {
      if (solicitud.current === controlador) {
        solicitud.current = null
        setOcupado(false)
      }
    }
  }, [casoId, tramiteId, contexto])

  const inicialProcesada = useRef<string | null>(null)
  useEffect(() => {
    if (!abierto) inicialProcesada.current = null
    else if (preguntaInicial && preguntaInicial !== inicialProcesada.current) {
      inicialProcesada.current = preguntaInicial
      void preguntar(preguntaInicial)
    }
  }, [abierto, preguntaInicial, preguntar])

  function enviar(e: FormEvent) {
    e.preventDefault()
    preguntar(texto)
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
              <p className="texto-pequeno texto-suave">Te ayuda a revisar con fuentes</p>
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

          <div className="agente__conversacion" aria-live="polite">
            {mensajes.length === 0 && (
              <p className="texto-suave">
                {preguntas.length > 0
                  ? 'Elige una pregunta o escribe la tuya.'
                  : casoId || tramiteId ? 'Escribe una pregunta sobre este caso.' : 'Abre un expediente o una decisión para preguntar sobre ese caso.'}
              </p>
            )}
            {mensajes.map((m, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <p className="agente__pregunta">{m.pregunta}</p>
                <div className="agente__respuesta">
                  <p>{m.respuesta}</p>
                  {m.fuentes.length > 0 && (
                    <div className="fila-chips">
                      {m.fuentes.map((f) => (
                        <Fuente key={f}>{f}</Fuente>
                      ))}
                    </div>
                  )}
                  {m.citas?.map((cita) => {
                    const rotulo = cita.pagina_pdf ? `${cita.titulo} · p. ${cita.pagina_pdf}` : cita.titulo
                    return <p key={cita.fragmento_id}>
                      {cita.enlace?.startsWith('/api/') ?
                        <a href={baseUrl + cita.enlace} target="_blank" rel="noreferrer">{rotulo}</a> : rotulo}
                    </p>
                  })}
                  <p className="nota">Propuesta del agente · una persona la valida.</p>
                </div>
              </div>
            ))}
            {pendientes.length > 0 && (
              <div className="agente__sugerencias" aria-label="Preguntas sugeridas">
                {pendientes.map((p) => (
                  <button key={p.pregunta} type="button" className="pastilla" disabled={ocupado} onClick={() => preguntar(p.pregunta)}>
                    {p.pregunta}
                  </button>
                ))}
              </div>
            )}
            <div ref={final} />
            {ocupado && <p role="status">Consultando fuentes…</p>}
          </div>

          <div className="agente__pie">
            <form className="agente__formulario" onSubmit={enviar}>
              <label htmlFor="pregunta-agente" className="solo-lectores">
                Escribe tu pregunta sobre el caso
              </label>
              <input
                id="pregunta-agente"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu pregunta sobre el caso"
                autoComplete="off"
                maxLength={casoId ? 600 : 1000}
              />
              <button type="submit" className="boton boton--primario" aria-label="Enviar pregunta" disabled={ocupado}>
                <IconoEnviar tamano={18} />
              </button>
            </form>
            <p className="nota">Propone con cita de página. Una persona decide.</p>
          </div>
        </div>
      </Dialogo>
    </>
  )
}
