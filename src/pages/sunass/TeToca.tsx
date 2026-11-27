import { Link } from 'react-router'
import { useAgente, useContextoAgente } from '../../agente/useAgente'
import { Chip, type Tono } from '../../components/Chip'
import { Burbuja, ContadorAnimado, Saludo } from '../../components/Graficos'
import { Gotita, type PoseGotita } from '../../components/Gotita'
import { IconoChispa, IconoEnlace, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { obtenerBandeja, useVersionTramites } from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import { useSesion } from '../../sesion/useSesion'
import type { AvisoAgente, BandejaTareas, Tarea, UrgenciaTarea } from '../../types/tramite'

const URGENCIA: Record<UrgenciaTarea, { tono: Tono; texto: string; orden: number }> = {
  hoy: { tono: 'aviso', texto: 'Hoy', orden: 0 },
  por_vencer: { tono: 'aviso', texto: 'Por vencer', orden: 1 },
  en_plazo: { tono: 'ok', texto: 'En plazo', orden: 2 },
}

const AVISO: Record<AvisoAgente['tipo'], { tono: Tono; texto: string }> = {
  reporte_faltante: { tono: 'aviso', texto: 'Reporte faltante' },
  avance_inconsistente: { tono: 'aviso', texto: 'Avance por verificar' },
  dato_duplicado: { tono: 'aviso', texto: 'Dato duplicado' },
  saldo_inconsistente: { tono: 'aviso', texto: 'Saldo por conciliar' },
  deposito_insuficiente: { tono: 'aviso', texto: 'Depósito insuficiente' },
  cifra_sin_documento: { tono: 'aviso', texto: 'Cifra sin documento' },
  vinculo_propuesto: { tono: 'agente', texto: 'Vínculo propuesto' },
  por_vencer: { tono: 'info', texto: 'Plazo próximo' },
  vencido: { tono: 'peligro', texto: 'Plazo vencido' },
  documento_por_asociar: { tono: 'agente', texto: 'Documento por asociar' },
  dos_numeraciones: { tono: 'info', texto: 'Dos numeraciones' },
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

const EMOJI_TAREA: Record<Tarea['tipo'], string> = {
  validar: '🔗',
  comparar: '⚖️',
  informe: '📝',
  revisar_documento: '📄',
}

const GOTA_URGENCIA: Record<UrgenciaTarea, PoseGotita> = {
  hoy: 'avatar-rojo',
  por_vencer: 'avatar-naranja',
  en_plazo: 'avatar-azul',
}

function TarjetaTarea({ tarea, numero }: { tarea: Tarea; numero: number }) {
  const urgencia = URGENCIA[tarea.urgencia]
  const principal = tarea.tipo === 'validar'
  return (
    <li className={`mision mision--${tarea.urgencia}`}>
      <span className="mision__numero" aria-hidden="true">
        {numero}
      </span>
      <div className="tarjeta tarea mision__tarjeta">
        <span className="mision__emoji" aria-hidden="true">
          {EMOJI_TAREA[tarea.tipo]}
        </span>
        <div className="tarea__cuerpo">
          <div className="fila-chips">
            <Chip tono={urgencia.tono}>{urgencia.texto}</Chip>
            <span className="texto-pequeno texto-suave">
              {tarea.tramite_id} · {tarea.eps} · {tarea.etapa}
            </span>
          </div>
          <h3 className="tarea__titulo">{tarea.titulo}</h3>
          <p className="texto-suave">{tarea.detalle}</p>
        </div>
        <Gotita pose={GOTA_URGENCIA[tarea.urgencia]} alto={46} animada={false} className="mision__gota" />
        <Link className={`boton ${principal ? 'boton--primario' : 'boton--secundario'}`} to={tarea.destino}>
          {tarea.boton}
          <span className="solo-lectores">: {tarea.titulo}</span>
          {principal ? <IconoEnlace tamano={16} /> : <IconoFlecha tamano={16} />}
        </Link>
      </div>
    </li>
  )
}

function Resumen({ bandeja }: { bandeja: BandejaTareas }) {
  const expedientes = [...new Set(bandeja.tareas.map((t) => t.tramite_id))]
  const porValidar = bandeja.tareas.filter((t) => t.tipo === 'validar').length
  const tarjetas = [
    {
      etiqueta: 'Acciones de hoy',
      valor: bandeja.tareas.length,
      detalle: expedientes.length > 0 ? `En ${expedientes.join(', ')}` : 'Sin acciones pendientes',
      tono: '',
      emoji: '🎯',
      color: 'cielo',
    },
    { etiqueta: 'Por vencer', emoji: '⏳', color: 'durazno', valor: bandeja.por_vencer.total, detalle: bandeja.por_vencer.detalle, tono: 'aviso' },
    {
      etiqueta: 'Por validar',
      valor: porValidar,
      detalle: porValidar > 0 ? 'Vínculo propuesto por el agente' : 'Nada por validar',
      tono: 'agente',
      emoji: '🔗',
      color: 'lila',
    },
    {
      etiqueta: 'Expedientes asignados',
      valor: bandeja.expedientes_asignados.total,
      detalle: bandeja.expedientes_asignados.detalle,
      tono: '',
      emoji: '📂',
      color: 'menta',
    },
  ] as const
  return (
    <ul className="cuatro-columnas resumen-bandeja">
      {tarjetas.map((t) => (
        <li key={t.etiqueta} className="tarjeta resumen-bandeja__tarjeta indicador-vivo">
          <Burbuja emoji={t.emoji} color={t.color} tamano="sm" />
          <p className="texto-suave">{t.etiqueta}</p>
          <p className={`indicador__valor${t.tono ? ` indicador__valor--${t.tono}` : ''}`}>
            <ContadorAnimado valor={t.valor} />
          </p>
          <p className="texto-pequeno texto-suave">{t.detalle}</p>
        </li>
      ))}
    </ul>
  )
}

/** «Te toca actuar»: acciones pendientes del perfil actual, ordenadas por urgencia. */
export function TeToca() {
  const versionDatos = useVersionTramites()
  const [resultado, reintentar] = useConsulta((signal) => obtenerBandeja(signal), [versionDatos])
  const { abrir } = useAgente()
  const { sesion } = useSesion()

  useContextoAgente({
    espacio: 'Espacio SUNASS · Te toca actuar',
    cartera: true,
    preguntas: [
      {
        pregunta: '¿Por dónde empiezo hoy?',
        respuesta:
          'Por validar el vínculo del Oficio 1628 en CPI-2026-0007: el agente propone que responde al Oficio 156 y, mientras no se valide, el documento sigue por asociar.',
        fuentes: ['Oficio 1628 · pág. 1'],
        palabras: ['empiezo', 'primero', 'urgente', 'hoy'],
      },
      {
        pregunta: '¿Qué cifra no tiene documento?',
        respuesta:
          'Los 19 935 medidores de EPS Tacna llegaron por correo el 20 de agosto y el correo no consta en el expediente. Pide que lo formalicen por Mesa de Partes.',
        fuentes: ['Correo del 20 ago', 'RCD 032 · nota 9'],
        palabras: ['cifra', 'documento', 'correo'],
      },
    ],
  })

  return (
    <div className="pagina">
      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando tus acciones…">
        {(bandeja) => {
          const tareas = [...bandeja.tareas].sort((a, b) => URGENCIA[a.urgencia].orden - URGENCIA[b.urgencia].orden)
          const expedientes = new Set(tareas.map((t) => t.tramite_id)).size
          return (
            <>
              <div>
                <p className="antetitulo">{sesion?.nombre ?? bandeja.cargo}</p>
                <h1>Te toca actuar</h1>
              </div>

              <Saludo
                pose={tareas.length === 0 ? 'al-dia' : 'hola'}
                titulo={tareas.length > 0 ? `🎯 Hoy tienes ${plural(tareas.length, 'misión', 'misiones')}` : '🌤️ ¡Estás al día!'}
                texto={
                  tareas.length > 0
                    ? `En ${plural(expedientes, 'expediente', 'expedientes')}. Sigue la ruta de abajo: empieza por la número 1, que es la más urgente.`
                    : 'No tienes acciones pendientes. ¡Buen trabajo!'
                }
              >
                {tareas.length > 0 && (
                  <div className="saludo__progreso">
                    <span className="saludo__urgentes">
                      {tareas.filter((t) => t.urgencia === 'hoy').length}
                    </span>
                    <span className="texto-pequeno">
                      {tareas.filter((t) => t.urgencia === 'hoy').length === 1 ? 'urgente para hoy' : 'urgentes para hoy'} 🔥
                    </span>
                  </div>
                )}
              </Saludo>

              <Resumen bandeja={bandeja} />

              <div className="dos-columnas">
                <section aria-labelledby="titulo-tareas" className="columna">
                  <h2 id="titulo-tareas" className="titulo-icono">
                    <Burbuja emoji="🗺️" color="limon" tamano="sm" />
                    <span>Tu ruta de hoy</span>
                  </h2>
                  {tareas.length === 0 ? (
                    <SinResultados titulo="Estás al día">
                      <p className="texto-suave">Cuando te asignen un documento o una validación, aparecerá aquí.</p>
                    </SinResultados>
                  ) : (
                    <ol className="lista-tareas ruta-misiones">
                      {tareas.map((t, i) => (
                        <TarjetaTarea key={t.id} tarea={t} numero={i + 1} />
                      ))}
                      <li className="ruta-misiones__meta" aria-hidden="true">
                        <span className="mision__numero">🏁</span>
                        <span className="texto-pequeno texto-suave">¡Meta! Terminaste tu ruta de hoy 🎉</span>
                      </li>
                    </ol>
                  )}
                </section>

                <section aria-labelledby="titulo-avisos" className="columna">
                  <h2 id="titulo-avisos" className="titulo-icono">
                    <Burbuja emoji="💬" color="lila" tamano="sm" />
                    <span>Yaku te avisa</span>
                  </h2>
                  <div className="tarjeta avisos-agente chat-yaku">
                    <div className="chat-yaku__cabeza">
                      <Gotita pose="verificando" alto={70} />
                      <p className="texto-pequeno texto-suave">Revisé tus expedientes y encontré esto 👇</p>
                    </div>
                    {bandeja.avisos.length === 0 ? (
                      <p className="texto-suave">El agente no tiene avisos nuevos.</p>
                    ) : (
                      <ul className="avisos-agente__lista chat-yaku__lista">
                        {bandeja.avisos.map((a, i) => (
                          <li key={a.id} className="chat-yaku__burbuja" style={{ animationDelay: `${300 + i * 450}ms` }}>
                            <Chip tono={AVISO[a.tipo].tono}>{AVISO[a.tipo].texto}</Chip>
                            <p>{a.texto}</p>
                          </li>
                        ))}
                        <li className="chat-yaku__escribiendo" aria-hidden="true" style={{ animationDelay: `${300 + bandeja.avisos.length * 450}ms` }}>
                          <span />
                          <span />
                          <span />
                        </li>
                      </ul>
                    )}
                    <button type="button" className="boton boton--secundario boton--bloque" onClick={() => abrir()}>
                      Preguntar al agente
                      <IconoChispa tamano={16} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )
        }}
      </Contenido>
    </div>
  )
}
