import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAgente, useContextoAgente } from '../../agente/useAgente'
import type { PreguntaAgente } from '../../agente/tipos'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip } from '../../components/Chip'
import { IconoAtras, IconoChispa } from '../../components/Iconos'
import { Gotita, type PoseGotita } from '../../components/Gotita'
import { Anillo, OlaAnimada } from '../../components/Graficos'
import { Contenido } from '../../components/Mensajes'
import { confirmarVinculo, obtenerExpediente, rechazarVinculo } from '../../services/tramites'
import { pedirJson, usarEjemplos } from '../../services/api'
import { useConsulta } from '../../services/useConsulta'
import { useSesion } from '../../sesion/useSesion'
import { AsignarExpediente } from './expediente/AsignarExpediente'
import { PublicarDecision } from './expediente/PublicarDecision'
import { RegistrarActuacion } from './expediente/RegistrarActuacion'
import { DocumentosExpediente } from './expediente/DocumentosExpediente'
import { ContextoDatos } from './expediente/ContextoDatos'
import { NOMBRE_COMPLETO, type Expediente as TipoExpediente } from '../../types/tramite'
import { Comparador } from './expediente/Comparador'
import { Flujograma } from './expediente/Flujograma'
import { LineaTiempo } from './expediente/LineaTiempo'
import { PanelImpacto } from './expediente/PanelImpacto'
import { PanelPlazos } from './expediente/PanelPlazos'
import { PropuestasAgente } from './expediente/PropuestasAgente'
import { RutasDialogo } from './expediente/RutasDialogo'
import { SiguienteAccion } from './expediente/SiguienteAccion'
import { ValidarVinculo } from './expediente/ValidarVinculo'
import { SEMAFORO, textoDias } from './semaforo'

const PESTANAS = [
  { id: 'linea', texto: 'Línea de tiempo' },
  { id: 'comparador', texto: 'Comparador de cifras' },
  { id: 'plazos', texto: 'Plazos' },
  { id: 'impacto', texto: 'Impacto social' },
] as const

type IdPestana = (typeof PESTANAS)[number]['id']

const EMOJI_PESTANA: Record<IdPestana, string> = { linea: '🕒', comparador: '🔢', plazos: '⏳', impacto: '🏘️' }

const GOTA: Record<TipoExpediente['plazo']['situacion'], PoseGotita> = {
  vencido: 'plazo-rojo',
  por_vencer: 'plazo-naranja',
  en_plazo: 'plazo-azul',
  pendiente_de_validacion: 'pensando',
  concluido: 'logrado',
}

/** Preguntas que el agente responde sobre este expediente, con sus fuentes. */
function preguntasDe(e: TipoExpediente): PreguntaAgente[] {
  const base: PreguntaAgente[] = [
    {
      pregunta: '¿En qué etapa está este expediente?',
      respuesta: `${e.id} está en «${e.etapa}». Lo tiene ${e.responsable}. Plazo: ${textoDias(e.plazo)}${e.plazo.dias_usados == null ? '' : ' días hábiles'}.`,
      fuentes: ['Bitácora del expediente'],
      palabras: ['etapa', 'donde esta', 'quien lo tiene'],
    },
  ]
  if (e.id !== 'CPI-2026-0007') return base
  return [
    {
      pregunta: '¿Qué cambió en la solicitud?',
      respuesta:
        '25 000 medidores (solicitud) → 14 902 (Oficio 1628) → 19 935 (correo del 20 ago, no consta en el expediente). Autorizado: 19 935 y S/ 3 817 752.',
      fuentes: ['Informe 031 · num. 10', 'RCD 032 · nota 9'],
      palabras: ['cambio', 'cifra', 'medidores'],
    },
    {
      pregunta: '¿A quién llega la inversión?',
      respuesta:
        'A Tacna, Pachía y Locumba: 12 527 medidores se renuevan y 7 408 son nuevas instalaciones. En la zona, 38 % de los hogares tiene jefatura femenina (dato simulado).',
      fuentes: ['RCD 032 · cuadro 2', 'INEI · simulado'],
      palabras: ['quien llega', 'impacto', 'hogares'],
    },
    {
      pregunta: 'Redacta el pedido a la EPS para formalizar la cifra de 19 935',
      respuesta:
        'Borrador: «Se solicita a EPS Tacna presentar por Mesa de Partes Virtual el documento que sustenta la cantidad de 19 935 medidores (12 527 de renovación y 7 408 de nuevas instalaciones), indicando el número del expediente CPI-2026-0007.» Revísalo antes de enviarlo.',
      fuentes: ['Correo del 20 ago', 'Oficio 1628 · pág. 1'],
      palabras: ['pedido', 'formalizar', 'redacta'],
    },
    ...base,
  ]
}

export function Expediente() {
  const { id = '' } = useParams()
  const { sesion } = useSesion()
  // Con la API real, los permisos vienen de la sesión; sin lista (modo de ejemplos) se permite todo.
  const puede = (permiso: string) => !sesion?.permisos || sesion.permisos.includes(permiso)
  const [parametros, setParametros] = useSearchParams()
  const [resultado, reintentar] = useConsulta((signal) => obtenerExpediente(id, signal), [id])
  const [actualizado, setActualizado] = useState<TipoExpediente | null>(null)
  const [rutasAbiertas, setRutasAbiertas] = useState(false)
  const [asignacionAbierta, setAsignacionAbierta] = useState(false)
  const [publicacionAbierta, setPublicacionAbierta] = useState(false)
  const [actuacionAbierta, setActuacionAbierta] = useState(false)
  const [accionInicial, setAccionInicial] = useState<string | undefined>()
  // «Te toca actuar» abre el expediente con ?accion=validar para mostrar el diálogo directamente.
  const [validarAbierto, setValidarAbierto] = useState(parametros.get('accion') === 'validar')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const { abrir } = useAgente()

  // Después de decidir sobre el vínculo se muestra el expediente que devolvió el servicio.
  const expediente = actualizado?.id === id ? actualizado : resultado.estado === 'listo' ? resultado.datos : null
  const [accionesDisponibles] = useConsulta(
    (signal) => usarEjemplos
      ? Promise.resolve({ items: [] as { tipo: string }[] })
      : pedirJson<{ items: { tipo: string }[] }>(`/api/tramites/${encodeURIComponent(id)}/acciones`, { signal }),
    [id, expediente?.version],
  )
  // Durante despliegues escalonados la API anterior puede enviar proyecciones crudas.
  // Evita romper la ficha hasta que el backend publique el contrato visual completo.
  const comparadorVisible = Array.isArray(expediente?.comparador?.versiones) ? expediente.comparador : null
  const plazosVisibles = Array.isArray(expediente?.plazos?.tarjetas) ? expediente.plazos : null
  const impactoVisible = Array.isArray(expediente?.impacto?.indicadores) ? expediente.impacto : null
  const pestanasDisponibles = PESTANAS.filter((p) => p.id === 'linea' ||
    (p.id === 'comparador' && !!comparadorVisible) ||
    (p.id === 'plazos' && !!plazosVisibles) ||
    (p.id === 'impacto' && !!impactoVisible))
  const pestana: IdPestana = pestanasDisponibles.find((p) => p.id === parametros.get('pestana'))?.id ?? 'linea'

  useContextoAgente(
    expediente
      ? {
          espacio: `Espacio SUNASS · ${expediente.id}`,
          preguntas: preguntasDe(expediente),
          caso: { tipo: 'tramite', id: expediente.id },
        }
      : null,
  )

  function cambiarPestana(nueva: IdPestana) {
    setParametros(nueva === 'linea' ? {} : { pestana: nueva }, { replace: true })
  }

  function cerrarValidar() {
    setValidarAbierto(false)
    if (parametros.has('accion')) {
      const siguientes = new URLSearchParams(parametros)
      siguientes.delete('accion')
      setParametros(siguientes, { replace: true })
    }
  }

  async function confirmar() {
    if (!expediente?.vinculo) return
    const nuevo = await confirmarVinculo(expediente.id, expediente.vinculo.documento, expediente.version)
    setActualizado(nuevo)
    setMensaje(`Vínculo confirmado: ${expediente.vinculo.documento} responde al ${expediente.vinculo.responde_a}.`)
  }

  async function rechazar() {
    if (!expediente?.vinculo) return
    const nuevo = await rechazarVinculo(expediente.id, expediente.vinculo.documento, expediente.version)
    setActualizado(nuevo)
    setMensaje(
      `Vínculo rechazado: el ${expediente.vinculo.documento} queda por asociar en Recepción de documentos.`,
    )
  }

  return (
    <div className="pagina">
      <div>
        <Link to="/sunass/expedientes" className="enlace-atras">
          <IconoAtras tamano={16} />
          Expedientes
        </Link>
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando expediente…">
        {() =>
          expediente && (
            <>
              <div className="expediente__cabecera expediente__cabecera--viva">
                <OlaAnimada />
                <Gotita pose={GOTA[expediente.plazo.situacion]} alto={110} className="expediente__gotita" />
                <div className="expediente__textos">
                  <div className="expediente__titulo">
                    <h1>
                      {expediente.referencia ?? expediente.id} · {expediente.eps}
                    </h1>
                    <Chip tono={SEMAFORO[expediente.plazo.situacion].tono}>{expediente.chip_plazo}</Chip>
                  </div>
                  <p className="subtitulo">
                    {NOMBRE_COMPLETO[expediente.procedimiento]} · {expediente.tema} · Responsable actual:{' '}
                    {expediente.responsable}
                  </p>
                  <button type="button" className="boton boton--secundario" onClick={() => abrir()}>
                    Preguntar a Yaku
                    <IconoChispa tamano={16} />
                  </button>
                </div>
                {expediente.plazo.dias_usados != null && expediente.plazo.dias_totales ? (
                  <Anillo
                    porcentaje={(expediente.plazo.dias_usados / expediente.plazo.dias_totales) * 100}
                    tono={SEMAFORO[expediente.plazo.situacion].barra}
                    tamano={124}
                    grosor={13}
                    etiqueta={`Plazo usado: ${textoDias(expediente.plazo)} días hábiles`}
                  >
                    <span className="expediente__anillo">
                      <strong>{expediente.plazo.dias_usados}</strong>
                      <span>de {expediente.plazo.dias_totales} días</span>
                    </span>
                  </Anillo>
                ) : null}
              </div>

              <div>
                {!usarEjemplos && ['evaluacion.validar', 'acto_externo.registrar', 'requerimiento.registrar', 'respuesta.verificar'].some(puede) && <button className="boton boton--secundario" type="button" onClick={() => { setAccionInicial(undefined); setActuacionAbierta(true) }}>Registrar actuación con sustento</button>}
                {actuacionAbierta && <RegistrarActuacion expediente={expediente} accionInicial={accionInicial} puedeRecepcion={puede('recepcion.gestionar')} alCerrar={() => setActuacionAbierta(false)} alGuardar={() => { setActuacionAbierta(false); setActualizado(null); reintentar() }} />}
                {!usarEjemplos && puede('publicacion.gestionar') && ['concluido', 'autorizado', 'no_autorizado'].includes(expediente.estado ?? '') && (
                  <button className="boton boton--secundario" type="button" onClick={() => setPublicacionAbierta(true)}>Publicar decisión revisada</button>
                )}
                {publicacionAbierta && <PublicarDecision expediente={expediente} alCerrar={() => { setPublicacionAbierta(false); reintentar() }} />}
                {!usarEjemplos && sesion?.permisos?.includes('asignacion.gestionar') && (
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => setAsignacionAbierta(true)}
                    aria-haspopup="dialog"
                  >
                    Asignar expediente
                  </button>
                )}
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setRutasAbiertas(true)}
                  aria-haspopup="dialog"
                >
                  Consultar rutas del procedimiento
                </button>
              </div>

              {expediente.simulado && <AvisoSimulado />}

              {asignacionAbierta && (
                <AsignarExpediente
                  key={expediente.id}
                  expediente={expediente}
                  alCerrar={() => setAsignacionAbierta(false)}
                  alRecargar={() => {
                    setAsignacionAbierta(false)
                    setActualizado(null)
                    reintentar()
                  }}
                  alAsignar={(nombre) => {
                    setAsignacionAbierta(false)
                    setActualizado(null)
                    setMensaje(`Expediente asignado a ${nombre}.`)
                    reintentar()
                  }}
                />
              )}

              {mensaje && (
                <p className="mensaje mensaje--exito" role="status">
                  {mensaje}
                </p>
              )}

              <Flujograma
                flujo={expediente.flujo}
                situacion={expediente.plazo.situacion}
                usado={expediente.plazo.dias_usados}
                total={expediente.plazo.dias_totales}
                alRegistrarPaso={accionesDisponibles.estado === 'listo' && accionesDisponibles.datos.items.some((a) => a.tipo === 'avanzar_paso') ? () => { setAccionInicial('avanzar_paso'); setActuacionAbierta(true) } : undefined}
              />

              {expediente.linea_tiempo ? (
                <>
                  <div className="pestanas" role="tablist" aria-label="Información del expediente">
                    {pestanasDisponibles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="tab"
                        id={`pestana-${p.id}`}
                        aria-selected={pestana === p.id}
                        aria-controls="panel-expediente"
                        className="pestana"
                        onClick={() => cambiarPestana(p.id)}
                      >
                        <span aria-hidden="true">{EMOJI_PESTANA[p.id]} </span>
                        {p.texto}
                      </button>
                    ))}
                  </div>
                  <div id="panel-expediente" role="tabpanel" aria-labelledby={`pestana-${pestana}`} className="columna">
                    {pestana === 'linea' && (
                      <LineaTiempo expediente={expediente} alValidar={() => setValidarAbierto(true)} alRegistrar={() => { setAccionInicial(expediente.siguiente.accion === 'verificar_respuesta' ? 'verificar_respuesta' : undefined); setActuacionAbierta(true) }} />
                    )}
                    {pestana === 'comparador' && comparadorVisible && (
                      <Comparador datos={comparadorVisible} verImpacto={impactoVisible ? () => cambiarPestana('impacto') : undefined} />
                    )}
                    {pestana === 'plazos' && plazosVisibles && <PanelPlazos datos={plazosVisibles} />}
                    {pestana === 'impacto' && impactoVisible && <PanelImpacto datos={impactoVisible} />}
                  </div>
                </>
              ) : (
                <div className="dos-columnas">
                  <section className="tarjeta" aria-labelledby="titulo-historial">
                    <div className="fila-chips" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <h2 id="titulo-historial" className="titulo-icono">
                        <span className="burbuja burbuja--cielo burbuja--sm" aria-hidden="true">🕒</span>
                        <span>Historial del trámite</span>
                      </h2>
                      {expediente.simulado && <Chip tono="agente">Simulado</Chip>}
                    </div>
                    {expediente.historial && expediente.historial.length > 0 ? (
                      <ol className="historial">
                        {expediente.historial.map((h, i) => (
                          <li
                            key={i}
                            className={h.actual ? 'historial__actual' : undefined}
                            aria-current={h.actual ? 'step' : undefined}
                          >
                            <span className="historial__fecha">{h.fecha_texto}</span>
                            <div>
                              <p className="historial__titulo">{h.titulo}</p>
                              <p className="nota">{h.detalle}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="texto-suave">
                        {expediente.simulado
                          ? 'Este caso simulado todavía no tiene documentos cargados.'
                          : 'Todavía no hay actuaciones registradas en este expediente.'}
                      </p>
                    )}
                  </section>
                  <SiguienteAccion accion={expediente.siguiente} alValidar={() => setValidarAbierto(true)} alRegistrar={() => { setAccionInicial(expediente.siguiente.accion === 'verificar_respuesta' ? 'verificar_respuesta' : undefined); setActuacionAbierta(true) }} />
                </div>
              )}

              {!usarEjemplos && <DocumentosExpediente expediente={expediente} />}
              {!usarEjemplos && <ContextoDatos id={expediente.id} />}
              {!usarEjemplos && puede('agente.consultar') && (
                <PropuestasAgente tramiteId={expediente.id} puedeRevisar={puede('evaluacion.validar')} />
              )}

              <RutasDialogo
                key={expediente.id}
                procedimiento={expediente.procedimiento}
                abierto={rutasAbiertas}
                alCerrar={() => setRutasAbiertas(false)}
              />
              {expediente.vinculo && (
                <ValidarVinculo
                  vinculo={expediente.vinculo}
                  abierto={validarAbierto}
                  alCerrar={cerrarValidar}
                  alConfirmar={confirmar}
                  alRechazar={rechazar}
                />
              )}
            </>
          )
        }
      </Contenido>
    </div>
  )
}
