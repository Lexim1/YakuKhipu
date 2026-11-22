import { useId, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Barra } from '../../components/Barra'
import { Chip, Fuente } from '../../components/Chip'
import { Dialogo } from '../../components/Dialogo'
import { IconoAtras, IconoCheck, IconoDocumento } from '../../components/Iconos'
import { Contenido, MensajeError, SinResultados } from '../../components/Mensajes'
import { informarRespuesta, obtenerTramiteEps } from '../../services/eps'
import { useConsulta } from '../../services/useConsulta'
import type { RespuestaInformada, SiguienteAccionEps, TramiteEps } from '../../types/eps'
import { NOMBRE_PROCEDIMIENTO } from '../../types/tramite'
import { textoFechaLimite, tonoPlazo, valorPlazo } from './plazos'
import { NavegacionEps } from './comun'

function hoyIso() {
  const hoy = new Date()
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`
}

function nuevaClave() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Lista de puntos que pide Sunass. Marcarlos ayuda a ordenarse; no se envía a Sunass. */
function ListaRequisitos({
  accion,
  listos,
  alternar,
}: {
  accion: SiguienteAccionEps
  listos: Set<string>
  alternar: (id: string) => void
}) {
  const total = accion.requisitos.length
  return (
    <section className="tarjeta eps-requisitos" aria-labelledby="titulo-requisitos">
      <div className="eps-requisitos__cabecera">
        <h2 id="titulo-requisitos" aria-live="polite">
          {listos.size} de {total} preparados
        </h2>
        <div className="eps-requisitos__barra">
          <Barra usado={listos.size} total={total} tono="marca" etiqueta="Puntos preparados" />
        </div>
      </div>
      <ul className="eps-requisitos__lista">
        {accion.requisitos.map((r) => {
          const listo = listos.has(r.id)
          return (
            <li key={r.id}>
              <label className={`eps-requisito${listo ? ' eps-requisito--listo' : ''}`}>
                <input type="checkbox" checked={listo} onChange={() => alternar(r.id)} />
                <span className="eps-requisito__texto">{r.texto}</span>
                {!listo && <span className="eps-requisito__estado">Pendiente</span>}
              </label>
            </li>
          )
        })}
      </ul>
      <p className="nota">
        Marca los puntos que ya tienes listos para ordenarte. Sunass revisará lo que presentes por Mesa de Partes.
      </p>
    </section>
  )
}

interface FormularioProps {
  tramite: TramiteEps
  accion: SiguienteAccionEps
  faltan: number
  alInformar: (actualizado: TramiteEps) => void
  alCancelar: () => void
}

/** Formulario para informar que la respuesta ya se presentó por el canal oficial. */
function FormularioInformar({ tramite, accion, faltan, alInformar, alCancelar }: FormularioProps) {
  const ids = useId()
  const clave = useRef(nuevaClave())
  const [documento, setDocumento] = useState('')
  const [fecha, setFecha] = useState(hoyIso())
  const [cargo, setCargo] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    if (!documento.trim()) return setError('Escribe el número del documento con que respondiste.')
    if (!fecha || fecha > hoyIso()) return setError('La fecha de presentación no puede ser posterior a hoy.')
    if (!confirmado) return setError(`Confirma que ya presentaste la ${accion.etiqueta.toLowerCase()} por ${accion.canal}.`)
    setError(null)
    setEnviando(true)
    try {
      const actualizado = await informarRespuesta(
        tramite.id,
        { documento: documento.trim(), fecha_presentacion: fecha, cargo: cargo.trim() || null, canal: accion.canal },
        clave.current,
      )
      alInformar(actualizado)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tu respuesta. Inténtalo otra vez.')
      setEnviando(false)
    }
  }

  return (
    <form
      className="dialogo__cuerpo"
      onSubmit={enviar}
      // Al corregir un campo, el mensaje de error anterior deja de aplicar.
      onChange={() => error && setError(null)}
      noValidate
    >
      <p className="texto-suave">
        Registra el documento que presentaste por {accion.canal}. Sunass verificará que esté en el expediente.
      </p>
      {faltan > 0 && (
        <p className="eps-alerta-suave" role="note">
          Aún tienes {faltan} {faltan === 1 ? 'punto' : 'puntos'} sin marcar en tu lista. Si ya los incluiste, puedes
          continuar.
        </p>
      )}
      <label className="campo" htmlFor={`${ids}-documento`}>
        Documento con que respondiste
        <input
          id={`${ids}-documento`}
          type="text"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="Ej. Oficio 1628"
          required
          autoComplete="off"
        />
      </label>
      <label className="campo" htmlFor={`${ids}-fecha`}>
        Fecha de presentación
        <input
          id={`${ids}-fecha`}
          type="date"
          value={fecha}
          max={hoyIso()}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </label>
      <label className="campo" htmlFor={`${ids}-cargo`}>
        N.° de cargo de Mesa de Partes (opcional)
        <input
          id={`${ids}-cargo`}
          type="text"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className="casilla">
        <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
        Ya presenté la {accion.etiqueta.toLowerCase()} por {accion.canal}.
      </label>
      {error && <MensajeError mensaje={error} />}
      <div className="dialogo__acciones">
        <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? 'Registrando…' : 'Informar presentación'}
        </button>
      </div>
    </form>
  )
}

/** Confirmación: la respuesta queda informada y pendiente de verificación. */
function RespuestaRegistrada({ id, respuesta }: { id: string; respuesta: RespuestaInformada }) {
  const navegar = useNavigate()
  return (
    <div className="dialogo__cuerpo eps-registrada" role="status">
      <span className="eps-registrada__icono" aria-hidden="true">
        <IconoCheck tamano={28} />
      </span>
      <h2>Respuesta informada</h2>
      <p className="texto-suave">
        {respuesta.documento} · {respuesta.fecha_texto}. Informaste que lo presentaste por {respuesta.canal}. Sunass
        debe verificar su incorporación.
      </p>
      <button
        type="button"
        className="boton boton--primario boton--bloque"
        onClick={() => navegar(`/eps/tramites/${encodeURIComponent(id)}`)}
      >
        Ver seguimiento
      </button>
      <button type="button" className="boton boton--secundario boton--bloque" onClick={() => navegar('/eps/tramites')}>
        Volver a mis trámites
      </button>
    </div>
  )
}

function PrepararRespuesta({ tramite, accion }: { tramite: TramiteEps; accion: SiguienteAccionEps }) {
  const navegar = useNavigate()
  const [listos, setListos] = useState(() => new Set(accion.requisitos.filter((r) => r.preparado).map((r) => r.id)))
  const [dialogo, setDialogo] = useState<'resumen' | 'informar' | null>(null)
  const [informada, setInformada] = useState<RespuestaInformada | null>(null)

  function alternar(id: string) {
    setListos((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const fuentes = tramite.documentos.map((d) => d.titulo).join(' · ')
  const rutaSeguimiento = `/eps/tramites/${encodeURIComponent(tramite.id)}`

  return (
    <>
      <div>
        <p className="antetitulo">
          {tramite.id} · {NOMBRE_PROCEDIMIENTO[tramite.procedimiento]}
        </p>
        <h1>{accion.titulo}</h1>
        <p className="subtitulo">{tramite.resumen}</p>
        <p className="eps-solo-movil">
          <Chip tono={tonoPlazo(accion.dias_restantes)}>
            {textoFechaLimite(accion.fecha_texto, accion.dias_restantes, accion.fecha_detalle)}
          </Chip>
        </p>
      </div>

      <div className="eps-dos-columnas">
        {accion.requisitos.length > 0 ? (
          <ListaRequisitos accion={accion} listos={listos} alternar={alternar} />
        ) : (
          <section className="tarjeta eps-tarea" aria-labelledby="titulo-que-hacer">
            <p className="antetitulo">{accion.etiqueta}</p>
            <h2 id="titulo-que-hacer">Qué hacer</h2>
            <p>{accion.instrucciones ?? 'Revisa el oficio que recibiste y presenta lo que pide Sunass.'}</p>
          </section>
        )}

        <div className="columna">
          <section className="tarjeta eps-plazo" aria-labelledby="titulo-plazo">
            <h2 id="titulo-plazo">Tu plazo</h2>
            <p className={`eps-plazo__valor eps-plazo__valor--${tonoPlazo(accion.dias_restantes)}`}>
              {valorPlazo(accion.dias_restantes)}
            </p>
            <p className="texto-pequeno texto-suave">
              {[
                accion.fecha_detalle,
                accion.fecha_texto && accion.dias_restantes != null
                  ? `${accion.dias_restantes >= 0 ? 'vence' : 'venció'} el ${accion.fecha_texto}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {fuentes && <Fuente>{fuentes}</Fuente>}
          </section>

          <section className="eps-presentar" aria-labelledby="titulo-presentar">
            <h2 id="titulo-presentar">Cómo presentar</h2>
            <p>Por {accion.canal}. Conserva el cargo de presentación.</p>
            <button type="button" className="boton boton--primario boton--bloque" onClick={() => setDialogo('informar')}>
              Ya presenté mi {accion.etiqueta.toLowerCase()}
              <IconoCheck tamano={16} />
            </button>
            {tramite.documentos.length > 0 && (
              <button
                type="button"
                className="boton boton--secundario boton--bloque"
                onClick={() => setDialogo('resumen')}
              >
                Resumen del oficio
                <IconoDocumento tamano={16} />
              </button>
            )}
          </section>
        </div>
      </div>

      {tramite.simulado && <AvisoSimulado texto="Los plazos y documentos de este trámite son simulados." />}

      <Dialogo abierto={dialogo === 'resumen'} titulo="Resumen del oficio" alCerrar={() => setDialogo(null)}>
        <div className="dialogo__cuerpo">
          {tramite.documentos.map((d) => (
            <div key={d.id} className="eps-resumen-doc">
              <Fuente>
                {d.titulo}
                {d.pagina != null && ` · p. ${d.pagina}`}
              </Fuente>
              {d.resumen && <p>{d.resumen}</p>}
            </div>
          ))}
          <div>
            <h3>Lo que pide Sunass</h3>
            {accion.requisitos.length > 0 ? (
              <ol className="eps-resumen-lista">
                {accion.requisitos.map((r) => (
                  <li key={r.id}>{r.texto}</li>
                ))}
              </ol>
            ) : (
              <p>{accion.instrucciones}</p>
            )}
          </div>
          <p className="nota">Este resumen no reemplaza el oficio. Ante cualquier duda, revisa el documento original.</p>
        </div>
      </Dialogo>

      <Dialogo
        abierto={dialogo === 'informar'}
        titulo={informada ? 'Respuesta informada' : `Informar que ya presentaste tu ${accion.etiqueta.toLowerCase()}`}
        sinCabecera={informada != null}
        alCerrar={() => {
          setDialogo(null)
          // Con la respuesta registrada, esta pantalla ya no tiene tarea: se continúa en el seguimiento.
          if (informada) navegar(rutaSeguimiento)
        }}
      >
        {informada ? (
          <RespuestaRegistrada id={tramite.id} respuesta={informada} />
        ) : (
          <FormularioInformar
            tramite={tramite}
            accion={accion}
            faltan={accion.requisitos.length - listos.size}
            alInformar={(t) => setInformada(t.respuesta_informada)}
            alCancelar={() => setDialogo(null)}
          />
        )}
      </Dialogo>
    </>
  )
}

export function Respuesta() {
  const { id = '' } = useParams()
  const [resultado, reintentar] = useConsulta((signal) => obtenerTramiteEps(id, signal), [id])
  const tramite = resultado.estado === 'listo' ? resultado.datos : null
  const accion = tramite?.siguiente_accion

  useContextoAgente(
    tramite && accion
      ? {
        espacio: `Espacio EPS · ${tramite.id}`,
        preguntas: [
          {
            pregunta: '¿Qué me falta presentar?',
            respuesta:
              accion.requisitos.length > 0
                ? `Sunass pide ${accion.requisitos.length} puntos: ${accion.requisitos.map((r) => r.texto).join('; ')}. Se presentan por ${accion.canal}.`
                : `${accion.instrucciones ?? 'Revisa el oficio que recibiste.'} Se presenta por ${accion.canal}.`,
            fuentes: tramite.documentos.map((d) => d.titulo),
            palabras: ['falta', 'presentar', 'puntos', 'pide'],
          },
          {
            pregunta: '¿Hasta cuándo tengo plazo?',
            respuesta: `${textoFechaLimite(accion.fecha_texto, accion.dias_restantes, accion.fecha_detalle)}.`,
            fuentes: tramite.documentos.map((d) => d.titulo),
            palabras: ['plazo', 'cuando', 'vence', 'fecha'],
          },
        ],
        }
      : null,
  )

  return (
    <div className="pagina eps">
      <div>
        <Link to={`/eps/tramites/${encodeURIComponent(id)}`} className="volver">
          <IconoAtras tamano={16} />
          Seguimiento del trámite
        </Link>
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando tu trámite…">
        {(t) =>
          t.siguiente_accion ? (
            <PrepararRespuesta tramite={t} accion={t.siguiente_accion} />
          ) : (
            <SinResultados titulo="No tienes una respuesta pendiente en este trámite">
              {t.respuesta_informada ? (
                <p className="texto-suave">
                  Informaste el {t.respuesta_informada.documento} el {t.respuesta_informada.fecha_texto}.{' '}
                  <Chip tono="info">Pendiente de verificación por Sunass</Chip>
                </p>
              ) : (
                <p className="texto-suave">{t.resumen}</p>
              )}
              <Link className="boton boton--secundario" to={`/eps/tramites/${encodeURIComponent(t.id)}`}>
                Ver seguimiento
              </Link>
            </SinResultados>
          )
        }
      </Contenido>

      <NavegacionEps tramiteId={id} pendientes={accion ? 1 : 0} />
    </div>
  )
}
