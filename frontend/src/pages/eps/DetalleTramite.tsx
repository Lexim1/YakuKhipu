import { Link, useParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Barra } from '../../components/Barra'
import { Chip, Fuente } from '../../components/Chip'
import { IconoAtras, IconoFlecha } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
import { obtenerTramiteEps } from '../../services/eps'
import { useConsulta } from '../../services/useConsulta'
import type { TramiteEps } from '../../types/eps'
import { NOMBRE_PROCEDIMIENTO } from '../../types/tramite'
import { AvisoEstado, ChipEstadoEps, NavegacionEps, Seguimiento } from './comun'
import { textoFechaLimite, tonoPlazo } from './plazos'

/** Lo que le toca hacer a la EPS ahora, o la confirmación de que no tiene tareas. */
function QueTeToca({ tramite }: { tramite: TramiteEps }) {
  const accion = tramite.siguiente_accion
  if (accion) {
    const listos = accion.requisitos.filter((r) => r.preparado).length
    return (
      <section className="tarjeta eps-tarea" aria-labelledby="titulo-te-toca">
        <p className="antetitulo">Te toca · {accion.etiqueta}</p>
        <h2 id="titulo-te-toca">{accion.titulo}</h2>
        <Chip tono={tonoPlazo(accion.dias_restantes)}>
          {textoFechaLimite(accion.fecha_texto, accion.dias_restantes, accion.fecha_detalle)}
        </Chip>
        {accion.requisitos.length > 0 ? (
          <div className="eps-progreso">
            <p className="texto-pequeno">
              {listos} de {accion.requisitos.length} puntos preparados
            </p>
            <Barra usado={listos} total={accion.requisitos.length} tono="marca" etiqueta="Puntos preparados" />
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
      <section className="tarjeta eps-tarea" aria-labelledby="titulo-respuesta">
        <p className="antetitulo">Tu respuesta</p>
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
    <section className="tarjeta eps-tarea" aria-labelledby="titulo-sin-tareas">
      <p className="antetitulo">Te toca</p>
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
      preguntas: [
        {
          pregunta: '¿En qué va mi trámite?',
          respuesta: `${tramite.estado_texto}. ${tramite.resumen}`,
          fuentes: tramite.documentos.map((d) => d.titulo),
          palabras: ['va', 'estado', 'avance'],
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
            <div className="eps-cabecera">
              <div>
                <p className="antetitulo">
                  {t.id} · {NOMBRE_PROCEDIMIENTO[t.procedimiento]}
                </p>
                <h1>¿En qué va mi trámite?</h1>
                <p className="subtitulo">{t.resumen}</p>
              </div>
              <ChipEstadoEps estado={t.estado} texto={t.estado_texto} />
            </div>

            <div className="eps-dos-columnas">
              <section className="tarjeta" aria-labelledby="titulo-seguimiento">
                <h2 id="titulo-seguimiento" className="solo-lectores">
                  Pasos del trámite {t.titulo}
                </h2>
                <p className="eps-tarjeta__titulo" aria-hidden="true">
                  {t.titulo}
                </p>
                <Seguimiento pasos={t.seguimiento} />
              </section>

              <div className="columna">
                <QueTeToca tramite={t} />
                {t.documentos.length > 0 && (
                  <section className="tarjeta eps-documentos" aria-labelledby="titulo-documentos">
                    <h2 id="titulo-documentos">Documentos del trámite</h2>
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
