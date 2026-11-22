import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { IconoAlerta, IconoCheck, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { listarMisTramites } from '../../services/eps'
import { useConsulta } from '../../services/useConsulta'
import type { TramiteEpsResumen } from '../../types/eps'
import { ChipEstadoEps, NavegacionEps } from './comun'
import { textoPlazo, tonoPlazo } from './plazos'

function rutaTramite(id: string) {
  return `/eps/tramites/${encodeURIComponent(id)}`
}

/** Tarea pendiente destacada arriba de la lista. */
function AvisoPendiente({ tramite }: { tramite: TramiteEpsResumen }) {
  const p = tramite.pendiente
  if (!p) return null
  const partes = [
    textoPlazo(p.dias_restantes, p.fecha_detalle),
    p.total > 0 ? `${p.total} puntos · llevas ${p.listos}` : null,
  ].filter(Boolean)
  return (
    <section className={`eps-franja eps-franja--${tonoPlazo(p.dias_restantes)}`} aria-label="Tarea pendiente">
      <span className="eps-franja__icono">
        <IconoAlerta tamano={22} />
      </span>
      <div className="eps-franja__texto">
        <h2>{p.titulo}</h2>
        <p>{partes.join(' · ')}</p>
        <p className="solo-lectores">Trámite {tramite.id}</p>
      </div>
      <Link className="boton boton--primario" to={`${rutaTramite(tramite.id)}/respuesta`}>
        Preparar respuesta
        <span className="solo-lectores"> de {tramite.id}</span>
        <IconoFlecha tamano={16} />
      </Link>
    </section>
  )
}

/** Respuesta ya informada: la EPS está al día mientras Sunass la verifica. */
function AvisoPresentada({ tramite }: { tramite: TramiteEpsResumen }) {
  const r = tramite.respuesta
  if (!r) return null
  return (
    <section className="eps-franja eps-franja--presentada" aria-label="Respuesta presentada">
      <span className="eps-franja__icono">
        <IconoCheck tamano={22} />
      </span>
      <div className="eps-franja__texto">
        <h2>Respuesta presentada</h2>
        <p>
          {r.documento} · informado el {r.fecha_texto}
          <span className="solo-lectores"> · trámite {tramite.id}, pendiente de verificación por Sunass</span>
        </p>
      </div>
      <Link className="boton boton--primario" to={rutaTramite(tramite.id)}>
        Ver seguimiento
        <span className="solo-lectores"> de {tramite.id}</span>
        <IconoFlecha tamano={16} />
      </Link>
    </section>
  )
}

export function MisTramites() {
  const [resultado, reintentar] = useConsulta((signal) => listarMisTramites(signal), [])

  const datos = resultado.estado === 'listo' ? resultado.datos : null
  const pendientes = datos?.items.filter((t) => t.pendiente) ?? []
  const presentadas = datos?.items.filter((t) => t.respuesta && !t.pendiente) ?? []
  const destacado = pendientes[0] ?? presentadas[0] ?? datos?.items[0] ?? null

  // Se registra cuando hay datos: el agente responde con lo que la EPS ve en pantalla.
  useContextoAgente(
    datos && {
      espacio: 'Espacio EPS · Mis trámites',
      preguntas: [
        {
          pregunta: '¿Qué tengo pendiente con Sunass?',
          respuesta:
            pendientes.length > 0
              ? pendientes
                  .map(
                    (t) =>
                      `${t.pendiente?.titulo} (${t.id}): ${textoPlazo(t.pendiente?.dias_restantes ?? null, t.pendiente?.fecha_detalle ?? null).toLowerCase()}.`,
                  )
                  .join(' ')
              : 'Estás al día: no tienes respuestas pendientes con Sunass.',
          fuentes: [],
          palabras: ['pendiente', 'falta', 'tengo', 'debo'],
        },
      ],
    },
  )

  return (
    <div className="pagina eps">
      <div>
        {datos?.items[0] && <p className="antetitulo">{datos.items[0].eps}</p>}
        <h1>Mis trámites</h1>
        {datos && (
          <p className="subtitulo">
            {pendientes.length === 0
              ? 'No tienes respuestas pendientes.'
              : `Tienes ${pendientes.length} ${pendientes.length === 1 ? 'respuesta pendiente' : 'respuestas pendientes'} con Sunass.`}
          </p>
        )}
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando tus trámites…">
        {({ items }) => {
          if (items.length === 0) {
            return (
              <SinResultados titulo="Todavía no tienes trámites ante Sunass">
                <p className="texto-suave">Cuando presentes una solicitud, aparecerá aquí con su estado.</p>
              </SinResultados>
            )
          }
          return (
            <>
              {pendientes.map((t) => (
                <AvisoPendiente key={t.id} tramite={t} />
              ))}
              {presentadas.map((t) => (
                <AvisoPresentada key={t.id} tramite={t} />
              ))}

              <section className="columna" aria-labelledby="titulo-mis-tramites">
                <h2 id="titulo-mis-tramites">Mis trámites ante Sunass</h2>
                <ul className="eps-lista">
                  {items.map((t) => (
                    <li key={t.id}>
                      <Link className="tarjeta eps-fila" to={rutaTramite(t.id)}>
                        <span className="eps-fila__texto">
                          <span className="eps-fila__titulo">{t.titulo}</span>
                          <span className="eps-fila__detalle">
                            {t.id} · {t.detalle}
                          </span>
                        </span>
                        <ChipEstadoEps estado={t.estado} texto={t.estado_texto} />
                        <IconoFlecha tamano={18} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              {items.some((t) => t.simulado) && (
                <AvisoSimulado texto="Los trámites son ejemplos de demostración; el de medidores se basa en el expediente de EPS Tacna." />
              )}
            </>
          )
        }}
      </Contenido>

      <NavegacionEps tramiteId={destacado?.id ?? null} pendientes={pendientes.length} />
    </div>
  )
}
