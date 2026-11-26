import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Fuente } from '../components/Chip'
import { Dialogo } from '../components/Dialogo'
import { IconoChispa, IconoCerrar, IconoEnviar } from '../components/Iconos'
import { usarEjemplos } from '../services/api'
import { preguntarAgente, urlFuente } from '../services/agente'
import { useAgente } from './useAgente'
import type { ConsultaAgente, PreguntaAgente } from './tipos'

interface FuenteMensaje {
  texto: string
  url?: string | null
}

interface Mensaje {
  pregunta: string
  respuesta: string
  fuentes: FuenteMensaje[]
  advertencias?: string[]
  cargando?: boolean
}

/** Respuesta de la API real, con la cita de cada página. */
async function consultarApi(
  consulta: ConsultaAgente,
  pregunta: string,
  conversacion: { current: string | null },
): Promise<Mensaje> {
  try {
    const r = await preguntarAgente(consulta, pregunta, conversacion.current)
    conversacion.current = r.conversacion_id
    return {
      pregunta,
      respuesta: r.respuesta,
      fuentes: r.fuentes.map((f) => ({
        texto: f.pagina_pdf ? `${f.titulo} · p. ${f.pagina_pdf}` : f.titulo,
        url: urlFuente(f.enlace),
      })),
      advertencias: r.advertencias,
    }
  } catch (error) {
    const estado = error instanceof Error && 'estado' in error ? (error as { estado: number }).estado : 0
    const respuesta =
      estado === 503
        ? 'El agente no está disponible en este momento. El resto del portal sigue funcionando.'
        : estado === 429
          ? 'Se alcanzó el límite de preguntas por hora. Inténtalo más tarde.'
          : error instanceof Error
            ? error.message
            : 'No pudimos consultar al agente.'
    return { pregunta, respuesta, fuentes: [] }
  }
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function buscarRespuesta(texto: string, preguntas: PreguntaAgente[]): Mensaje {
  const t = normalizar(texto)
  const elegida = preguntas.find(
    (p) => normalizar(p.pregunta) === t || (p.palabras ?? []).some((palabra) => t.includes(normalizar(palabra))),
  )
  if (elegida) return { pregunta: texto, respuesta: elegida.respuesta, fuentes: elegida.fuentes.map((f) => ({ texto: f })) }
  return {
    pregunta: texto,
    respuesta:
      'En esta demostración el agente responde las preguntas sugeridas. Con el backend conectado, buscará en los documentos del expediente y citará la página.',
    fuentes: [],
  }
}

/** Botón flotante «Preguntar al agente» y su panel de conversación. */
export function PanelAgente() {
  const { abierto, abrir, cerrar, contexto, preguntaInicial } = useAgente()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const final = useRef<HTMLDivElement>(null)
  const conversacion = useRef<string | null>(null)
  // Con la API real el agente responde sobre un caso concreto; sin caso no hay a quién preguntar.
  const consulta = usarEjemplos ? undefined : contexto?.consulta
  const preguntas = usarEjemplos || consulta ? (contexto?.preguntas ?? []) : []
  const esperando = mensajes.some((m) => m.cargando)

  // Al cambiar de pantalla, la conversación empieza de nuevo.
  useEffect(() => {
    setMensajes([])
    conversacion.current = null
  }, [contexto?.espacio])

  useEffect(() => {
    if (abierto && preguntaInicial) preguntar(preguntaInicial)
    // Solo cuando se abre con una pregunta concreta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, preguntaInicial])

  // Con llaves: algunos navegadores devuelven una promesa desde scrollIntoView y React la tomaría como limpieza.
  useEffect(() => {
    final.current?.scrollIntoView({ block: 'end' })
  }, [mensajes])

  function preguntar(entrada: string) {
    const pregunta = entrada.trim()
    if (!pregunta || esperando) return
    setTexto('')
    if (!consulta) {
      setMensajes((m) => [...m, buscarRespuesta(pregunta, preguntas)])
      return
    }
    setMensajes((m) => [...m, { pregunta, respuesta: 'Buscando en los documentos del caso…', fuentes: [], cargando: true }])
    void consultarApi(consulta, pregunta, conversacion).then((respuesta) =>
      setMensajes((m) => m.map((x) => (x.cargando && x.pregunta === pregunta ? respuesta : x))),
    )
  }

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
                  : 'Abre un expediente o una decisión para preguntar sobre ese caso.'}
              </p>
            )}
            {mensajes.map((m, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <p className="agente__pregunta">{m.pregunta}</p>
                <div className="agente__respuesta">
                  <p>{m.respuesta}</p>
                  {m.fuentes.length > 0 && (
                    <div className="fila-chips">
                      {m.fuentes.map((f) =>
                        f.url ? (
                          <a key={f.texto} href={f.url} target="_blank" rel="noreferrer">
                            <Fuente>{f.texto}</Fuente>
                          </a>
                        ) : (
                          <Fuente key={f.texto}>{f.texto}</Fuente>
                        ),
                      )}
                    </div>
                  )}
                  {m.advertencias?.map((a) => (
                    <p key={a} className="nota">
                      ⚠ {a}
                    </p>
                  ))}
                  {!m.cargando && <p className="nota">Propuesta del agente · una persona la valida.</p>}
                </div>
              </div>
            ))}
            {pendientes.length > 0 && (
              <div className="agente__sugerencias" aria-label="Preguntas sugeridas">
                {pendientes.map((p) => (
                  <button key={p.pregunta} type="button" className="pastilla" onClick={() => preguntar(p.pregunta)}>
                    {p.pregunta}
                  </button>
                ))}
              </div>
            )}
            <div ref={final} />
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
              />
              <button type="submit" className="boton boton--primario" aria-label="Enviar pregunta" disabled={esperando}>
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
