import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, Fuente } from '../../components/Chip'
import { Anillo, OlaAnimada, Puntos, TituloIcono } from '../../components/Graficos'
import { Gotita } from '../../components/Gotita'
import { IconoBuscar, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { buscarDecisiones, obtenerCifrasSector } from '../../services/publico'
import { useConsulta } from '../../services/useConsulta'
import { TEXTO_ESTADO_PUBLICO, type CifraSector, type DecisionResumen, type EstadoPublico } from '../../types/publico'

const POR_PAGINA = 9

/** Página pedida en la URL: un entero desde 1. Cualquier otro valor se trata como la página 1. */
function leerPagina(valor: string | null) {
  const n = Number(valor)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

const TONO_ESTADO: Record<EstadoPublico, 'ok' | 'info' | 'aviso'> = {
  decision_publicada: 'ok',
  en_evaluacion: 'info',
  en_consulta: 'aviso',
}

/** Ícono decorativo de cada proceso: medidor y obras, fondo de emergencia, tarifa. */
const ICONO_PROCESO: Record<string, string> = { CPI: '🛠️', UFI: '🛟', RP: '🧾' }

/** Avance del plazo cuando la nota dice «Día 23 de 30». */
function avancePlazo(nota: string) {
  const m = /d[ií]a\s+(\d+)\s+de\s+(\d+)/i.exec(nota)
  return m ? { dia: Number(m[1]), total: Number(m[2]) } : null
}

function TarjetaDecision({ decision }: { decision: DecisionResumen }) {
  const plazo = avancePlazo(decision.nota_estado)
  const publicada = decision.estado_publico === 'decision_publicada'
  return (
    <li className="tarjeta decision">
      <div className="decision__cabeza">
        <span className={`decision__icono decision__icono--${decision.procedimiento}`} aria-hidden="true">
          {ICONO_PROCESO[decision.procedimiento] ?? '💧'}
        </span>
        <div>
          <p className="decision__eps">{decision.eps}</p>
          <h2 className="decision__titulo">{decision.titulo}</h2>
        </div>
      </div>
      <p className="decision__cifra">{decision.cifra}</p>
      <div className="fila-chips">
        <Chip tono={TONO_ESTADO[decision.estado_publico]}>{TEXTO_ESTADO_PUBLICO[decision.estado_publico]}</Chip>
        <span className="texto-pequeno texto-suave">{decision.nota_estado}</span>
      </div>
      {decision.estado_publico === 'en_consulta' && (
        <p className="texto-pequeno decision__invitacion">🗣️ ¡Tu opinión cuenta! Participa en la audiencia pública.</p>
      )}
      {(plazo || publicada) && (
        <div className="progreso-plazo">
          <span className="progreso-plazo__pista" aria-hidden="true">
            <span
              className={`progreso-plazo__barra${publicada ? ' progreso-plazo__barra--ok' : plazo && plazo.dia / plazo.total >= 0.75 ? ' progreso-plazo__barra--aviso' : ''}`}
              style={{ width: publicada ? '100%' : `${(plazo!.dia / plazo!.total) * 100}%` }}
            />
          </span>
          <span className="texto-pequeno texto-suave progreso-plazo__texto">
            {!publicada && plazo && (
              <Gotita
                pose={plazo.dia / plazo.total >= 0.75 ? 'avatar-naranja' : 'avatar-azul'}
                alto={28}
                animada={false}
              />
            )}
            {publicada
              ? '✅ ¡Listo! Ya puedes ver qué se autorizó'
              : `⏳ Sunass lleva ${plazo!.dia} de ${plazo!.total} días para decidir`}
          </span>
        </div>
      )}
      {decision.ficha_disponible && (
        <Link
          className="boton boton--secundario boton--bloque decision__boton"
          to={`/ciudadania/decisiones/${encodeURIComponent(decision.id)}`}
        >
          👀 Ver qué se aprobó
          <span className="solo-lectores">
            : {decision.titulo}, {decision.eps}
          </span>
          <IconoFlecha tamano={16} />
        </Link>
      )}
    </li>
  )
}

/** Buscador ciudadano: decisiones públicas por EPS o localidad. Acceso sin sesión. */
export function Decisiones() {
  const [parametros, setParametros] = useSearchParams()
  const q = (parametros.get('q') ?? '').trim()
  const pagina = leerPagina(parametros.get('pagina'))
  const [texto, setTexto] = useState(q)
  const [qAnterior, setQAnterior] = useState(q)
  const [escribiendo, setEscribiendo] = useState(false)

  // La URL manda: si cambia desde fuera (menú «Decisiones», volver atrás, un enlace),
  // el cuadro de búsqueda muestra esa consulta y se descarta lo que estaba pendiente.
  if (q !== qAnterior) {
    setQAnterior(q)
    if (texto.trim() !== q) setTexto(q)
    setEscribiendo(false)
  }

  // Busca mientras la persona escribe, con una pausa breve para no consultar en cada tecla.
  // Solo actúa después de que la persona escribió: nunca reescribe una URL nueva con texto viejo.
  useEffect(() => {
    if (!escribiendo) return
    const espera = setTimeout(() => {
      setEscribiendo(false)
      const nueva = texto.trim()
      if (nueva !== q) setParametros(nueva ? { q: nueva } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(espera)
  }, [texto, escribiendo, q, setParametros])

  function escribir(valor: string) {
    setTexto(valor)
    setEscribiendo(true)
  }

  function limpiar() {
    setTexto('')
    setEscribiendo(false)
    setParametros({}, { replace: true })
  }

  const [resultado, reintentar] = useConsulta(
    (signal) => buscarDecisiones({ q, page: pagina, pageSize: POR_PAGINA }, signal),
    [q, pagina],
  )
  const [cifras, reintentarCifras] = useConsulta((signal) => obtenerCifrasSector(signal), [])

  useContextoAgente({
    espacio: 'Consulta ciudadana',
    publico: true,
    preguntas: [
      {
        pregunta: '¿Qué se aprobó para Tacna?',
        respuesta:
          'Sunass autorizó a EPS Tacna incluir 19 935 medidores en su plan de inversiones, por S/ 3 817 752: 12 527 reemplazan medidores antiguos y 7 408 son nuevas instalaciones.',
        fuentes: ['RCD 032-2026'],
        palabras: ['tacna', 'aprobo', 'medidores'],
      },
      {
        pregunta: '¿Cómo opino sobre las tarifas de Altiplano?',
        respuesta:
          'La audiencia pública es el 3 de diciembre y puedes enviar comentarios hasta el 10 de diciembre por el canal indicado en la convocatoria. Participar es opcional. (Caso simulado.)',
        fuentes: ['Convocatoria · simulado'],
        palabras: ['altiplano', 'opino', 'opinar', 'audiencia', 'tarifa'],
      },
    ],
  })

  function irAPagina(nueva: number) {
    const siguientes = new URLSearchParams(parametros)
    if (nueva <= 1) siguientes.delete('pagina')
    else siguientes.set('pagina', String(nueva))
    setParametros(siguientes)
  }

  // Una página fuera de rango vuelve sola a la última página válida.
  const totalPaginas =
    resultado.estado === 'listo' && resultado.datos.total > 0
      ? Math.ceil(resultado.datos.total / resultado.datos.page_size)
      : null
  useEffect(() => {
    if (totalPaginas == null || pagina <= totalPaginas) return
    const siguientes = new URLSearchParams(parametros)
    if (totalPaginas <= 1) siguientes.delete('pagina')
    else siguientes.set('pagina', String(totalPaginas))
    setParametros(siguientes, { replace: true })
  }, [totalPaginas, pagina, parametros, setParametros])

  return (
    <div className="pagina publico__pagina">
      <section
        className="portada-ciudadana portada-ciudadana--viva"
        aria-labelledby="titulo-decisiones"
        onMouseMove={(e) => {
          const caja = e.currentTarget.getBoundingClientRect()
          e.currentTarget.style.setProperty('--mx', String((e.clientX - caja.left) / caja.width - 0.5))
          e.currentTarget.style.setProperty('--my', String((e.clientY - caja.top) / caja.height - 0.5))
        }}
      >
        <OlaAnimada />
        <span className="burbujas-suben" aria-hidden="true">
          <i /> <i /> <i /> <i /> <i /> <i />
        </span>
        <h1 id="titulo-decisiones">¿En qué se invierte el agua de tu ciudad?</h1>
        <p className="portada-ciudadana__texto">
          Busca tu empresa de agua y mira qué se aprobó, cuánto avanza y cómo te llega. Sin cuentas ni trámites.
        </p>
        <form role="search" className="buscador-publico" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="busqueda-publica" className="solo-lectores">
            Buscar por ciudad o empresa de agua
          </label>
          <IconoBuscar tamano={18} />
          <input
            id="busqueda-publica"
            type="search"
            value={texto}
            onChange={(e) => escribir(e.target.value)}
            placeholder="Ej. Tacna, Río Claro, Altiplano"
            autoComplete="off"
          />
        </form>
        <div className="sugerencias" aria-label="Búsquedas rápidas">
          {['Tacna', 'Río Claro', 'Altiplano'].map((lugar) => (
            <button key={lugar} type="button" onClick={() => escribir(lugar)}>
              📍 {lugar}
            </button>
          ))}
        </div>
        <Gotita pose="hola" alto={210} className="portada-ciudadana__gotita" />

      </section>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Buscando decisiones…">
        {(lista) => {
          if (lista.total === 0) {
            return (
              <SinResultados
                titulo={q ? `No encontramos decisiones para «${q}»` : 'Todavía no hay decisiones publicadas'}
              >
                {q && (
                  <>
                    <p className="texto-suave">Revisa cómo está escrito o busca por el nombre de tu provincia.</p>
                    <button type="button" className="boton boton--secundario" onClick={limpiar}>
                      Ver todas las decisiones
                    </button>
                  </>
                )}
              </SinResultados>
            )
          }
          const paginas = Math.max(1, Math.ceil(lista.total / lista.page_size))
          if (pagina > paginas || lista.items.length === 0) {
            return (
              <SinResultados titulo={`La página ${pagina} no existe`}>
                <p className="texto-suave">
                  {q ? `La búsqueda «${q}» tiene` : 'Hay'} {paginas} {paginas === 1 ? 'página' : 'páginas'} de
                  resultados.
                </p>
                <button type="button" className="boton boton--secundario" onClick={() => irAPagina(paginas)}>
                  Ir a la página {paginas}
                </button>
              </SinResultados>
            )
          }
          return (
            <>
              <p className="solo-lectores" aria-live="polite">
                {lista.total} {lista.total === 1 ? 'decisión encontrada' : 'decisiones encontradas'}
              </p>
              <ul className="decisiones">
                {lista.items.map((d) => (
                  <TarjetaDecision key={d.id} decision={d} />
                ))}
              </ul>
              {lista.items.some((d) => d.simulado) && (
                <AvisoSimulado texto="Algunas decisiones son ejemplos simulados para la demostración. La decisión de EPS Tacna se basa en la resolución publicada." />
              )}
              {paginas > 1 && (
                <nav className="pastillas" aria-label="Páginas de resultados" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    disabled={pagina <= 1}
                    onClick={() => irAPagina(pagina - 1)}
                  >
                    Anterior
                  </button>
                  <span className="texto-pequeno">
                    Página {pagina} de {paginas}
                  </span>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    disabled={pagina >= paginas}
                    onClick={() => irAPagina(pagina + 1)}
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )
        }}
      </Contenido>

      <section aria-labelledby="titulo-cifras" className="columna">
        <TituloIcono id="titulo-cifras" emoji="🗺️" color="cielo">El agua en el Perú, en números</TituloIcono>
        <Contenido resultado={cifras} reintentar={reintentarCifras} textoCarga="Cargando cifras…">
          {(lista) => (
            <ul className="decisiones">
              {lista.map((c) => (
                <li key={c.valor} className="tarjeta cifra-sector">
                  <div className="cifra-visual">
                    <VisualCifra cifra={c} />
                    <p className="cifra-sector__valor">{c.valor}</p>
                  </div>
                  <p>{c.texto}</p>
                  <Fuente>{c.fuente}</Fuente>
                </li>
              ))}
            </ul>
          )}
        </Contenido>
      </section>
    </div>
  )
}

/** Dibujo de cada cifra según su forma: porcentaje (anillo), «N de M» (puntos) o personas (gotas). */
function VisualCifra({ cifra }: { cifra: CifraSector }) {
  const porcentaje = /^([\d.,]+)\s*%/.exec(cifra.valor)
  if (porcentaje) {
    const valor = Number(porcentaje[1].replace(',', '.'))
    return (
      <Anillo porcentaje={valor} tono="aviso" tamano={64} grosor={8} etiqueta={`${cifra.valor} ${cifra.texto}`}>
        <span className="texto-pequeno">💧</span>
      </Anillo>
    )
  }
  const parte = /^(\d+)\s+de\s+(\d+)/.exec(cifra.valor)
  if (parte) {
    return <Puntos marcados={Number(parte[1])} total={Number(parte[2])} etiqueta={`${cifra.valor} ${cifra.texto}`} />
  }
  return (
    <span className="cifra-visual__gotas" aria-hidden="true">
      🚱
    </span>
  )
}
