import { Link, useParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, Fuente } from '../../components/Chip'
import { Gotita, type PoseGotita } from '../../components/Gotita'
import { Anillo, Burbuja, OlaAnimada, TituloIcono } from '../../components/Graficos'
import { IconoAtras, IconoEnlace } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
import { obtenerDecision } from '../../services/publico'
import { useConsulta } from '../../services/useConsulta'
import {
  TEXTO_ESTADO_PUBLICO,
  type CantidadPublica,
  type DecisionPublica,
  type EstadoPublico,
  type FuentePublica,
} from '../../types/publico'

const TONO_ESTADO: Record<EstadoPublico, 'ok' | 'info' | 'aviso'> = {
  decision_publicada: 'ok',
  en_evaluacion: 'info',
  en_consulta: 'aviso',
}

const GOTA_ESTADO: Record<EstadoPublico, PoseGotita> = {
  decision_publicada: 'logrado',
  en_evaluacion: 'pensando',
  en_consulta: 'hola',
}

const EMOJI_CANTIDAD: Record<string, string> = { Solicitado: '📝', Autorizado: '✅', Ejecutado: '🔧' }
const EMOJI_IMPACTO = ['🏘️', '👩‍👧', '💧', '📍', '🧒', '🌱']
const COLOR_IMPACTO = ['cielo', 'rosa', 'menta', 'durazno', 'lila', 'limon'] as const

/** Explica por qué todavía no hay cantidad autorizada. */
const SIN_DECISION: Record<EstadoPublico, string> = {
  en_evaluacion: 'Sunass todavía evalúa el pedido.',
  en_consulta: 'Sunass recibe comentarios antes de decidir.',
  decision_publicada: 'La decisión no incluye una cantidad autorizada.',
}

const CONDICION = {
  verificado: { texto: 'Verificado', tono: 'ok' },
  estimado: { texto: 'Estimado', tono: 'aviso' },
  simulado: { texto: 'Simulado', tono: 'agente' },
} as const

/** «28 ago 2026» a partir de «2026-08-28». */
function fechaLarga(iso: string) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
    .toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '')
    .replace(/ de /g, ' ')
}

/** «RCD 032-2026 · Numeral 3.13». */
function citaFuente(f: FuentePublica) {
  const ubicacion = [f.articulo, f.pagina != null ? `p. ${f.pagina}` : null].filter(Boolean).join(', ')
  return ubicacion ? `${f.titulo} · ${ubicacion}` : f.titulo
}

/** Un documento por fila, con las partes citadas: «RCD 032-2026 · Cuadro 2, Numeral 3.13». */
function agruparFuentes(fuentes: FuentePublica[]) {
  const grupos = new Map<string, { titulo: string; ubicaciones: string[]; enlace: string | null }>()
  for (const f of fuentes) {
    const grupo = grupos.get(f.titulo) ?? { titulo: f.titulo, ubicaciones: [], enlace: null }
    if (f.articulo) grupo.ubicaciones.push(f.articulo)
    if (f.pagina != null) grupo.ubicaciones.push(`p. ${f.pagina}`)
    grupo.enlace ??= f.enlace
    grupos.set(f.titulo, grupo)
  }
  return [...grupos.values()]
}

interface TarjetaProps {
  etiqueta: string
  cantidad: CantidadPublica | null
  vacio: string
  /** Texto que acompaña al valor vacío. */
  explicacion?: string
  destacada?: boolean
  /** Avance frente a lo autorizado, si ambas cantidades usan la misma unidad. */
  avance?: number | null
}

function TarjetaCantidad({ etiqueta, cantidad, vacio, explicacion, destacada = false, avance = null }: TarjetaProps) {
  return (
    <li className={`tarjeta ficha-cantidad${destacada ? ' ficha-cantidad--destacada' : ''}`}>
      <p className={`ficha-cantidad__etiqueta ficha-cantidad__etiqueta--${etiqueta.toLowerCase()}`}>
        <span aria-hidden="true">{EMOJI_CANTIDAD[etiqueta]} </span>
        {etiqueta}
      </p>
      {cantidad ? (
        <>
          <p className="ficha-cantidad__valor">{cantidad.texto}</p>
          <p className="texto-pequeno texto-suave">
            {[cantidad.monto_texto, avance != null ? `${avance} % de lo autorizado` : null, fechaLarga(cantidad.fecha)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {avance != null && (
            <Anillo porcentaje={avance} tono={avance >= 100 ? 'ok' : 'marca'} tamano={78} grosor={9} etiqueta={`Avance: ${avance} %`}>
              <strong>{avance}%</strong>
            </Anillo>
          )}
          <div className="fila-chips">
            <Fuente>{cantidad.origen}</Fuente>
            {cantidad.simulado && <Chip tono="agente">Simulado</Chip>}
            {cantidad.estimado && <Chip tono="aviso">Estimado</Chip>}
          </div>
        </>
      ) : (
        <>
          <p className="ficha-cantidad__vacio">{vacio}</p>
          {explicacion && <p className="texto-pequeno texto-suave">{explicacion}</p>}
        </>
      )}
    </li>
  )
}

function FichaDecision({ d }: { d: DecisionPublica }) {
  const fuentes = new Map(d.fuentes.map((f) => [f.id, f]))
  const avance =
    d.ejecutado && d.autorizado && d.autorizado.valor > 0 && d.ejecutado.unidad === d.autorizado.unidad
      ? Math.round((d.ejecutado.valor / d.autorizado.valor) * 100)
      : null
  const haySimulados = d.simulado || d.ejecutado?.simulado || d.impacto.some((i) => i.condicion === 'simulado')

  return (
    <>
      <div className="ficha-cabecera ficha-cabecera--viva">
        <OlaAnimada />
        <Gotita pose={GOTA_ESTADO[d.estado_publico]} alto={120} className="ficha-cabecera__gotita" />
        <div className="ficha-cabecera__textos">
          <div className="fila-chips">
            <Chip tono={TONO_ESTADO[d.estado_publico]}>
              {TEXTO_ESTADO_PUBLICO[d.estado_publico]} · {d.nota_estado}
            </Chip>
            {d.autorizado && <Fuente>{d.autorizado.origen}</Fuente>}
          </div>
          <p className="antetitulo">
            📍 {d.eps} · {d.localidad}
          </p>
          <h1>{d.titulo}</h1>
          <p className="subtitulo">{d.resumen_ciudadano}</p>
          <ol className="camino-decision" aria-label="En qué va esta decisión">
            {[
              { texto: 'Pedido', emoji: '📝', listo: d.solicitado != null },
              { texto: 'Decisión', emoji: '✅', listo: d.autorizado != null },
              { texto: 'Obra', emoji: '🔧', listo: d.ejecutado != null },
            ].map((paso) => (
              <li key={paso.texto} className={paso.listo ? 'camino-decision--listo' : undefined}>
                <span aria-hidden="true">{paso.emoji}</span>
                {paso.texto}
                <span className="solo-lectores">{paso.listo ? ' (con dato)' : ' (todavía no)'}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {d.consulta && (
        <section className="ficha-consulta ficha-consulta--viva" aria-labelledby="titulo-consulta">
          <Gotita pose="hola" alto={80} className="ficha-consulta__gotita" />
          <p className="antetitulo">🗣️ Participa</p>
          <h2 id="titulo-consulta">Puedes opinar hasta el {d.consulta.fecha_limite_texto}</h2>
          {d.consulta.audiencia_texto && <p>{d.consulta.audiencia_texto}.</p>}
          <p className="texto-pequeno">Participar es opcional.</p>
          {d.consulta.enlace ? (
            <a className="boton boton--primario" href={d.consulta.enlace} target="_blank" rel="noreferrer">
              Ir al canal oficial
              <span className="solo-lectores"> (se abre en otra pestaña)</span>
              <IconoEnlace tamano={16} />
            </a>
          ) : (
            <p className="texto-pequeno">El enlace oficial se publicará con la convocatoria.</p>
          )}
        </section>
      )}

      <section aria-labelledby="titulo-cantidades" className="columna">
        <h2 id="titulo-cantidades" className="solo-lectores">
          Lo solicitado, lo autorizado y lo ejecutado
        </h2>
        <ul className="ficha-cantidades">
          <TarjetaCantidad etiqueta="Solicitado" cantidad={d.solicitado} vacio="No disponible" />
          <TarjetaCantidad
            etiqueta="Autorizado"
            cantidad={d.autorizado}
            vacio="Todavía no hay decisión"
            explicacion={SIN_DECISION[d.estado_publico]}
            destacada
          />
          <TarjetaCantidad
            etiqueta="Ejecutado"
            cantidad={d.ejecutado}
            vacio="Sin dato de ejecución"
            explicacion={
              d.autorizado
                ? 'La EPS todavía no informa avance.'
                : 'La ejecución empieza después de una autorización.'
            }
            avance={avance}
          />
        </ul>
        <p className="nota">
          Solicitado es lo que pidió la EPS; autorizado, lo que aprobó Sunass; ejecutado, lo que la EPS informa que ya
          hizo. Lo autorizado no significa que ya esté hecho.
        </p>
      </section>

      <section className="tarjeta ficha-impacto" aria-labelledby="titulo-impacto">
        <div>
          <p className="antetitulo">Impacto social</p>
          <TituloIcono id="titulo-impacto" emoji="🏘️" color="rosa">
            ¿A quién llega esta inversión?
          </TituloIcono>
          <p className="texto-pequeno texto-suave">
            Cada dato muestra su estado y su fuente. Los marcados como «Simulado» son datos de demostración.
          </p>
        </div>
        {d.impacto.length === 0 ? (
          <p className="ficha-cantidad__vacio">No disponible</p>
        ) : (
          <ul className="ficha-impacto__lista">
            {d.impacto.map((dato, n) => {
              const fuente = dato.fuente_id ? fuentes.get(dato.fuente_id) : undefined
              const condicion = CONDICION[dato.condicion]
              return (
                <li key={dato.pregunta} className="ficha-dato ficha-dato--vivo">
                  <Burbuja emoji={EMOJI_IMPACTO[n % EMOJI_IMPACTO.length]} color={COLOR_IMPACTO[n % COLOR_IMPACTO.length]} />
                  <h3 className="ficha-dato__pregunta">{dato.pregunta}</h3>
                  {dato.texto == null ? (
                    <p className="ficha-cantidad__vacio">No disponible</p>
                  ) : (
                    <>
                      <Chip tono={condicion.tono}>{condicion.texto}</Chip>
                      <p>{dato.texto}</p>
                    </>
                  )}
                  {fuente ? (
                    <Fuente>{citaFuente(fuente)}</Fuente>
                  ) : (
                    dato.fuente_prevista && <Fuente>Fuente prevista: {dato.fuente_prevista}</Fuente>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <p className="nota">
          <strong>Cómo cuidamos estos datos:</strong> no deducimos si una persona es mujer u hombre por su nombre. Un
          dato se publica cuando Sunass lo valida con su fuente.
        </p>
      </section>

      {d.fuentes.length > 0 && (
        <section className="tarjeta ficha-fuentes" aria-labelledby="titulo-fuentes">
          <TituloIcono id="titulo-fuentes" emoji="📚" color="cielo">
            Fuentes
          </TituloIcono>
          <ul>
            {agruparFuentes(d.fuentes).map(({ titulo, ubicaciones, enlace }) => (
              <li key={titulo}>
                <span>
                  {titulo}
                  {ubicaciones.length > 0 && <span className="texto-suave"> · {ubicaciones.join(', ')}</span>}
                </span>
                {enlace ? (
                  <a href={enlace} target="_blank" rel="noreferrer">
                    Abrir documento
                    <span className="solo-lectores"> {titulo} (se abre en otra pestaña)</span>
                    <IconoEnlace tamano={14} />
                  </a>
                ) : (
                  <span className="texto-pequeno texto-suave">Enlace público pendiente</span>
                )}
              </li>
            ))}
          </ul>
          <p className="nota">Actualizado el {fechaLarga(d.fecha_actualizacion)}.</p>
        </section>
      )}

      {haySimulados && (
        <AvisoSimulado
          texto={
            d.simulado
              ? 'Este caso es un ejemplo simulado para la demostración.'
              : 'Lo solicitado y lo autorizado se basan en la resolución publicada; los datos marcados como «Simulado» son de demostración.'
          }
        />
      )}
    </>
  )
}

/** Ficha pública de una decisión: solicitado, autorizado y ejecutado, con impacto y fuentes. */
export function Decision() {
  const { id = '' } = useParams()
  const [resultado, reintentar] = useConsulta((signal) => obtenerDecision(id, signal), [id])
  const d = resultado.estado === 'listo' ? resultado.datos : null

  useContextoAgente(
    d && {
      espacio: `Consulta ciudadana · ${d.titulo}`,
      caso: { tipo: 'publico', id: d.id },
      publico: true,
      preguntas: [
        ...(!d.autorizado
          ? [
              {
                pregunta: '¿Ya se decidió?',
                respuesta: `Todavía no. Estado: ${TEXTO_ESTADO_PUBLICO[d.estado_publico].toLowerCase()} (${d.nota_estado}). ${d.resumen_ciudadano}${d.consulta ? ` Puedes opinar hasta el ${d.consulta.fecha_limite_texto}.` : ''}`,
                fuentes: d.fuentes.map(citaFuente),
                palabras: ['decid', 'aprob', 'autoriz', 'estado'],
              },
            ]
          : []),
        ...(d.autorizado
          ? [
              {
                pregunta: '¿Qué se autorizó?',
                respuesta: `Sunass autorizó ${d.autorizado.texto}${d.autorizado.monto_texto ? ` por ${d.autorizado.monto_texto}` : ''} el ${fechaLarga(d.autorizado.fecha)}. ${d.resumen_ciudadano}`,
                fuentes: [d.autorizado.origen],
                palabras: ['autoriz', 'aprob'],
              },
            ]
          : []),
        {
          pregunta: '¿Cuánto se ha hecho?',
          respuesta: d.ejecutado
            ? `La EPS informa ${d.ejecutado.texto} al ${fechaLarga(d.ejecutado.fecha)}.${d.ejecutado.simulado ? ' Este dato es simulado para la demostración.' : ''}`
            : 'Todavía no hay avance informado para esta decisión.',
          fuentes: d.ejecutado ? [d.ejecutado.origen] : [],
          palabras: ['hecho', 'avance', 'ejecut', 'instal'],
        },
      ],
    },
  )

  return (
    <div className="pagina publico__pagina ficha">
      <div>
        <Link to="/ciudadania/decisiones" className="volver">
          <IconoAtras tamano={16} />
          Decisiones
        </Link>
      </div>
      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando la decisión…">
        {(datos) => <FichaDecision d={datos} />}
      </Contenido>
    </div>
  )
}
