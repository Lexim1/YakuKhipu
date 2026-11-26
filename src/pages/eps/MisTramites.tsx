import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Anillo, Burbuja, ContadorAnimado, Saludo, TituloIcono } from '../../components/Graficos'
import { Gotita } from '../../components/Gotita'
import { IconoCheck, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { listarMisTramites } from '../../services/eps'
import { useConsulta } from '../../services/useConsulta'
import type { EstadoEps, TramiteEpsResumen } from '../../types/eps'
import { ChipEstadoEps, NavegacionEps } from './comun'
import { textoPlazo, tonoPlazo } from './plazos'

/** En qué paso está cada trámite: presentado → evaluación → respuesta → decisión. */
const PASO: Record<EstadoEps, number> = {
  en_evaluacion: 1,
  en_consulta: 1,
  requiere_respuesta: 2,
  requiere_subsanacion: 2,
  autorizado: 3,
  no_autorizado: 3,
  concluido: 3,
}
const NOMBRE_PASO = ['Presentado', 'En evaluación', 'Te toca responder', 'Decisión tomada']

function PasosMini({ estado }: { estado: EstadoEps }) {
  const paso = PASO[estado] ?? 0
  return (
    <span className="pasos-mini" role="img" aria-label={`Paso ${paso + 1} de ${NOMBRE_PASO.length}: ${NOMBRE_PASO[paso]}`}>
      {NOMBRE_PASO.map((n, i) => (
        <span key={n} className={i < paso || paso === 3 ? 'hecho' : i === paso ? 'actual' : ''} />
      ))}
    </span>
  )
}

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
      {p.total > 0 ? (
        <Anillo
          porcentaje={(p.listos / p.total) * 100}
          tono="aviso"
          tamano={68}
          grosor={8}
          etiqueta={`Llevas ${p.listos} de ${p.total} puntos`}
        >
          <strong>
            {p.listos}/{p.total}
          </strong>
        </Anillo>
      ) : null}
      <div className="eps-franja__texto">
        <h2>{p.titulo} ✍️</h2>
        <p>{partes.join(' · ')}</p>
        {p.total > 0 && p.listos < p.total && (
          <p className="texto-pequeno">💪 ¡Vas bien! Te faltan {p.total - p.listos} puntos.</p>
        )}
        <p className="solo-lectores">Trámite {tramite.id}</p>
      </div>
      <Gotita
        pose={tonoPlazo(p.dias_restantes) === 'peligro' ? 'plazo-rojo' : 'plazo-naranja'}
        alto={96}
        className="eps-franja__gotita"
      />
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
      </div>
      {datos && (
        <Saludo
          pose={pendientes.length === 0 ? 'al-dia' : 'hola'}
          titulo={`¡Hola${datos.items[0] ? `, ${datos.items[0].eps}` : ''}! 👋`}
          texto={
            pendientes.length === 0
              ? '🌤️ ¡Estás al día! No tienes respuestas pendientes con Sunass.'
              : `Tienes ${pendientes.length} ${pendientes.length === 1 ? 'respuesta pendiente' : 'respuestas pendientes'} con Sunass. ¡Tú puedes!`
          }
        />
      )}

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
              <ul className="tres-columnas resumen-bandeja">
                {[
                  { n: pendientes.length, t: 'Por responder', d: 'Sunass espera tu respuesta', tono: 'aviso', e: '✍️', c: 'durazno' },
                  {
                    n: items.filter((t) => PASO[t.estado] === 1 || (t.respuesta && !t.pendiente)).length,
                    t: 'En evaluación',
                    d: 'Sunass los está revisando',
                    tono: '',
                    e: '🔍',
                    c: 'cielo',
                  },
                  {
                    n: items.filter((t) => PASO[t.estado] === 3).length,
                    t: 'Resueltos',
                    d: 'Con decisión de Sunass',
                    tono: 'ok',
                    e: '🎉',
                    c: 'menta',
                  },
                ].map((k) => (
                  <li key={k.t} className={`tarjeta resumen-bandeja__tarjeta indicador-vivo${k.tono ? ` indicador-vivo--${k.tono}` : ''}`}>
                    <Burbuja emoji={k.e} color={k.c as 'menta'} />
                    <span className="texto-pequeno">{k.t}</span>
                    <strong className={`indicador-grande${k.tono ? ` indicador-grande--${k.tono}` : ''}`}>
                      <ContadorAnimado valor={k.n} />
                    </strong>
                    <span className="texto-pequeno texto-suave">{k.d}</span>
                  </li>
                ))}
              </ul>
              {pendientes.map((t) => (
                <AvisoPendiente key={t.id} tramite={t} />
              ))}
              {presentadas.map((t) => (
                <AvisoPresentada key={t.id} tramite={t} />
              ))}

              <section className="columna" aria-labelledby="titulo-mis-tramites">
                <TituloIcono id="titulo-mis-tramites" emoji="📋" color="cielo">Mis trámites ante Sunass</TituloIcono>
                <ul className="eps-lista">
                  {items.map((t) => (
                    <li key={t.id}>
                      <Link className="tarjeta eps-fila" to={rutaTramite(t.id)}>
                        <Burbuja
                          emoji={t.id.startsWith('UFI') ? '🛟' : t.id.startsWith('RP') ? '🧾' : '🛠️'}
                          color={t.id.startsWith('UFI') ? 'rosa' : t.id.startsWith('RP') ? 'limon' : 'cielo'}
                        />
                        <span className="eps-fila__texto">
                          <span className="eps-fila__titulo">{t.titulo}</span>
                          <span className="eps-fila__detalle">
                            {t.id} · {t.detalle}
                          </span>
                          <PasosMini estado={t.estado} />
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
