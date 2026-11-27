import { Link, useParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, Fuente } from '../../components/Chip'
import { Gotita } from '../../components/Gotita'
import { Anillo, OlaAnimada, TituloIcono } from '../../components/Graficos'
import { IconoAtras, IconoFlecha } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
import { obtenerTramiteEps } from '../../services/eps'
import { useConsulta } from '../../services/useConsulta'
import type { TramiteEps } from '../../types/eps'
import { NOMBRE_PROCEDIMIENTO } from '../../types/tramite'
import { AvisoEstado, ChipEstadoEps, NavegacionEps, Seguimiento } from './comun'
import { textoFechaLimite, tonoPlazo } from './plazos'

const GOTA_PLAZO = { peligro: 'plazo-rojo', aviso: 'plazo-naranja', ok: 'plazo-azul' } as const

/** Lo que le toca hacer a la EPS ahora, o la confirmación de que no tiene tareas. */
function QueTeToca({ tramite }: { tramite: TramiteEps }) {
  const accion = tramite.siguiente_accion
  if (accion) {
    const listos = accion.requisitos.filter((r) => r.preparado).length
    return (
      <section className="tarjeta eps-tarea eps-tarea--viva" aria-labelledby="titulo-te-toca">
        <Gotita pose={GOTA_PLAZO[tonoPlazo(accion.dias_restantes)]} alto={76} className="eps-tarea__gotita" />
        <p className="antetitulo">🎯 Te toca · {accion.etiqueta}</p>
        <h2 id="titulo-te-toca">{accion.titulo}</h2>
        <Chip tono={tonoPlazo(accion.dias_restantes)}>
          {textoFechaLimite(accion.fecha_texto, accion.dias_restantes, accion.fecha_detalle)}
        </Chip>
        {accion.requisitos.length > 0 ? (
          <div className="eps-progreso eps-progreso--anillo">
            <Anillo
              porcentaje={(listos / accion.requisitos.length) * 100}
              tono={listos === accion.requisitos.length ? 'ok' : 'marca'}
              tamano={72}
              grosor={8}
              etiqueta={`${listos} de ${accion.requisitos.length} puntos preparados`}
            >
              <strong>
                {listos}/{accion.requisitos.length}
              </strong>
            </Anillo>
            <p className="texto-pequeno">
              {listos === accion.requisitos.length ? '¡Todo listo! 🎉' : `${listos} de ${accion.requisitos.length} puntos preparados 💪`}
            </p>
          </div>
        ) : (
          accion.instrucciones && <p className="texto-pequeno">{accion.instrucciones}</p>
        )}
        <Link
          className="boton boton--primario boton--bloque"
          to={`/eps/tramites/${encodeURIComponent(tramite.id)}/respuesta`}
        >
          {accion.texto}
          <IconoFlecha tamano={16} />
        </Link>
      </section>
    )
  }

  if (tramite.aviso) return <AvisoEstado aviso={tramite.aviso} />

  const respuesta = tramite.respuesta_informada
  if (respuesta) {
    return (
      <section className="tarjeta eps-tarea eps-tarea--viva" aria-labelledby="titulo-respuesta">
        <Gotita pose={respuesta.verificada ? 'logrado' : 'verificando'} alto={76} className="eps-tarea__gotita" />
        <p className="antetitulo">📨 Tu respuesta</p>
        <h2 id="titulo-respuesta">
          {respuesta.documento} · {respuesta.fecha_texto}
        </h2>
        <p className="texto-pequeno texto-suave">
          Informaste que la presentaste por {respuesta.canal}.
          {respuesta.cargo && ` Cargo: ${respuesta.cargo}.`}
        </p>
        {respuesta.verificada ? (
          <Chip tono="ok">Sunass la incorporó al expediente</Chip>
        ) : (
          <Chip tono="info">Pendiente de verificación por Sunass</Chip>
        )}
      </section>
    )
  }

  return (
    <section className="tarjeta eps-tarea eps-tarea--viva" aria-labelledby="titulo-sin-tareas">
      <Gotita pose="al-dia" alto={76} className="eps-tarea__gotita" />
      <p className="antetitulo">☀️ Te toca</p>
      <h2 id="titulo-sin-tareas">No tienes tareas pendientes</h2>
      <p className="texto-pequeno texto-suave">Te avisaremos cuando Sunass necesite algo de tu EPS.</p>
    </section>
  )
}

export function DetalleTramite() {
  const { id = '' } = useParams()
  const [resultado, reintentar] = useConsulta((signal) => obtenerTramiteEps(id, signal), [id])
  const tramite = resultado.estado === 'listo' ? resultado.datos : null

  useContextoAgente(
    tramite && {
      espacio: `Espacio EPS · ${tramite.id}`,
      caso: { tipo: 'tramite', id: tramite.id },
      preguntas: [
        {
          pregunta: '¿En qué va mi trámite?',
          respuesta: `${tramite.estado_texto}. ${tramite.resumen}`,
          fuentes: tramite.documentos.map((d) => d.titulo),
          palabras: ['en que va', 'estado', 'avance'],
        },
        ...(tramite.siguiente_accion
          ? [
              {
                pregunta: '¿Qué debo presentar y cuándo?',
                respuesta: `${tramite.siguiente_accion.titulo}. ${
                  tramite.siguiente_accion.requisitos.length > 0
                    ? `Sunass pide ${tramite.siguiente_accion.requisitos.length} puntos.`
                    : (tramite.siguiente_accion.instrucciones ?? '')
                } ${textoFechaLimite(tramite.siguiente_accion.fecha_texto, tramite.siguiente_accion.dias_restantes, tramite.siguiente_accion.fecha_detalle)}. Se presenta por ${tramite.siguiente_accion.canal}.`,
                fuentes: tramite.documentos.map((d) => d.titulo),
                palabras: ['presentar', 'debo', 'cuando', 'plazo'],
              },
            ]
          : []),
      ],
    },
  )

  return (
    <div className="pagina eps">
      <div>
        <Link to="/eps/tramites" className="volver">
          <IconoAtras tamano={16} />
          Mis trámites
        </Link>
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando tu trámite…">
        {(t) => (
          <>
            {(() => {
              const hechos = t.seguimiento.filter((p) => p.estado === 'hecho').length
              const total = t.seguimiento.length
              const pose = t.siguiente_accion
                ? GOTA_PLAZO[tonoPlazo(t.siguiente_accion.dias_restantes)]
                : hechos === total && total > 0
                  ? 'logrado'
                  : 'al-dia'
              return (
                <div className="eps-cabecera eps-cabecera--viva">
                  <OlaAnimada />
                  <Gotita pose={pose} alto={110} className="eps-cabecera__gotita" />
                  <div className="eps-cabecera__textos">
                    <p className="antetitulo">
                      {t.id} · {NOMBRE_PROCEDIMIENTO[t.procedimiento]}
                    </p>
                    <h1>¿En qué va mi trámite?</h1>
                    <p className="subtitulo">{t.resumen}</p>
                    <ChipEstadoEps estado={t.estado} texto={t.estado_texto} />
                  </div>
                  {total > 0 && (
                    <Anillo
                      porcentaje={(hechos / total) * 100}
                      tono={hechos === total ? 'ok' : 'marca'}
                      tamano={118}
                      grosor={12}
                      etiqueta={`${hechos} de ${total} pasos completados`}
                    >
                      <span className="expediente__anillo">
                        <strong>
                          {hechos}/{total}
                        </strong>
                        <span>pasos</span>
                      </span>
                    </Anillo>
                  )}
                </div>
              )
            })()}

            <div className="eps-dos-columnas">
              <section className="tarjeta" aria-labelledby="titulo-seguimiento">
                <h2 id="titulo-seguimiento" className="solo-lectores">
                  Pasos del trámite {t.titulo}
                </h2>
                <p className="eps-tarjeta__titulo titulo-icono" aria-hidden="true">
                  <span className="burbuja burbuja--cielo burbuja--sm">🧭</span>
                  <span>{t.titulo}</span>
                </p>
                <div className="seguimiento-vivo">
                  <Seguimiento pasos={t.seguimiento} />
                </div>
              </section>

              <div className="columna">
                <QueTeToca tramite={t} />
                {t.documentos.length > 0 && (
                  <section className="tarjeta eps-documentos" aria-labelledby="titulo-documentos">
                    <TituloIcono id="titulo-documentos" emoji="📎" color="menta">
                      Documentos del trámite
                    </TituloIcono>
                    <ul>
                      {t.documentos.map((d) => (
                        <li key={d.id}>
                          <Fuente>
                            {d.titulo}
                            {d.pagina != null && ` · p. ${d.pagina}`}
                          </Fuente>
                          {d.resumen && <p className="texto-pequeno">{d.resumen}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>

            {t.simulado && <AvisoSimulado texto="Los estados y las fechas de este trámite son simulados." />}
          </>
        )}
      </Contenido>

      <NavegacionEps tramiteId={id} pendientes={tramite?.siguiente_accion ? 1 : 0} />
    </div>
  )
}
