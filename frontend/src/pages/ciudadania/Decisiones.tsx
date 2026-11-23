import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, Fuente } from '../../components/Chip'
import { IconoBuscar, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { buscarDecisiones, obtenerCifrasSector } from '../../services/publico'
import { useConsulta } from '../../services/useConsulta'
import { TEXTO_ESTADO_PUBLICO, type DecisionResumen, type EstadoPublico } from '../../types/publico'

const POR_PAGINA = 9

const TONO_ESTADO: Record<EstadoPublico, 'ok' | 'info' | 'aviso'> = {
  decision_publicada: 'ok',
  en_evaluacion: 'info',
  en_consulta: 'aviso',
}

function TarjetaDecision({ decision }: { decision: DecisionResumen }) {
  return (
    <li className="tarjeta decision">
      <p className="decision__eps">{decision.eps}</p>
      <h2 className="decision__titulo">{decision.titulo}</h2>
      <p className="decision__cifra">{decision.cifra}</p>
      <div className="fila-chips">
        <Chip tono={TONO_ESTADO[decision.estado_publico]}>{TEXTO_ESTADO_PUBLICO[decision.estado_publico]}</Chip>
        <span className="texto-pequeno texto-suave">{decision.nota_estado}</span>
      </div>
      {decision.ficha_disponible && (
        <Link
          className="boton boton--secundario boton--bloque decision__boton"
          to={`/ciudadania/decisiones/${encodeURIComponent(decision.id)}`}
        >
          Ver la decisión
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
  const q = parametros.get('q') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)
  const [texto, setTexto] = useState(q)

  // Busca mientras la persona escribe, con una pausa breve para no consultar en cada tecla.
  useEffect(() => {
    const espera = setTimeout(() => {
      if (texto.trim() !== q) setParametros(texto.trim() ? { q: texto.trim() } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(espera)
  }, [texto, q, setParametros])

  const [resultado, reintentar] = useConsulta(
    (signal) => buscarDecisiones({ q, page: pagina, pageSize: POR_PAGINA }, signal),
    [q, pagina],
  )
  const [cifras, reintentarCifras] = useConsulta((signal) => obtenerCifrasSector(signal), [])

  useContextoAgente({
    espacio: 'Consulta ciudadana',
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
    siguientes.set('pagina', String(nueva))
    setParametros(siguientes)
  }

  return (
    <div className="pagina publico__pagina">
      <section className="portada-ciudadana" aria-labelledby="titulo-decisiones">
        <h1 id="titulo-decisiones">Decisiones sobre inversiones de agua</h1>
        <p className="portada-ciudadana__texto">
          Busca tu empresa de agua y mira qué se autorizó, qué se hizo y a quién llega.
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
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej. Tacna, Río Claro, Altiplano"
            autoComplete="off"
          />
        </form>
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
                    <button type="button" className="boton boton--secundario" onClick={() => setTexto('')}>
                      Ver todas las decisiones
                    </button>
                  </>
                )}
              </SinResultados>
            )
          }
          const paginas = Math.max(1, Math.ceil(lista.total / lista.page_size))
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
        <h2 id="titulo-cifras">El agua en el Perú, en cifras de Sunass</h2>
        <Contenido resultado={cifras} reintentar={reintentarCifras} textoCarga="Cargando cifras…">
          {(lista) => (
            <ul className="decisiones">
              {lista.map((c) => (
                <li key={c.valor} className="tarjeta cifra-sector">
                  <p className="cifra-sector__valor">{c.valor}</p>
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
