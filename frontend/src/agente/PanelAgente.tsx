import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Fuente } from '../components/Chip'
import { Dialogo } from '../components/Dialogo'
import { IconoChispa, IconoCerrar, IconoEnviar } from '../components/Iconos'
import { useAgente } from './useAgente'
import type { PreguntaAgente } from './tipos'

interface Mensaje {
  pregunta: string
  respuesta: string
  fuentes: string[]
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
  const { abierto, abrir, cerrar, contexto, preguntaInicial } = useAgente()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const final = useRef<HTMLDivElement>(null)
  const preguntas = contexto?.preguntas ?? []

  // Al cambiar de pantalla, la conversación empieza de nuevo.
  useEffect(() => setMensajes([]), [contexto?.espacio])

  useEffect(() => {
    if (abierto && preguntaInicial) setMensajes((m) => [...m, buscarRespuesta(preguntaInicial, preguntas)])
    // Solo cuando se abre con una pregunta concreta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, preguntaInicial])

  useEffect(() => final.current?.scrollIntoView({ block: 'end' }), [mensajes])

  function preguntar(pregunta: string) {
    if (!pregunta.trim()) return
    setMensajes((m) => [...m, buscarRespuesta(pregunta.trim(), preguntas)])
    setTexto('')
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
                      {m.fuentes.map((f) => (
                        <Fuente key={f}>{f}</Fuente>
                      ))}
                    </div>
                  )}
                  <p className="nota">Propuesta del agente · una persona la valida.</p>
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
              <button type="submit" className="boton boton--primario" aria-label="Enviar pregunta">
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
