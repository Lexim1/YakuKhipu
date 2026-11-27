import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, type Tono } from '../../components/Chip'
import { Anillo, Burbuja, ContadorAnimado, LineaArea, PildorasBarras, Saludo, TituloIcono } from '../../components/Graficos'
import { IconoArchivo, IconoFlecha } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
import { Gotita } from '../../components/Gotita'
import { FINANCIERO, MOVIMIENTOS } from '../../mocks/financiero'
import { usarEjemplos } from '../../services/api'
import { DASHBOARD_SIMULADO } from '../../mocks/seguimiento'
import { ROLES_SUNASS, rolSunass } from '../../sesion/roles'
import { useSesion } from '../../sesion/useSesion'
import { listarAlertas, listarExpedientes } from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import type { Alerta, Procedimiento, Situacion, TramiteResumen } from '../../types/tramite'
import { NOMBRE_PROCEDIMIENTO } from '../../types/tramite'

const PROCESOS: Procedimiento[] = ['CPI', 'UFI', 'RP']

/** Tramos de la barra por proceso, en el orden del Figma. */
const TRAMOS: { situacion: Situacion; texto: string; clase: string }[] = [
  { situacion: 'en_plazo', texto: 'En plazo', clase: 'ok' },
  { situacion: 'por_vencer', texto: 'Por vencer', clase: 'aviso' },
  { situacion: 'vencido', texto: 'Vencido', clase: 'peligro' },
  { situacion: 'pendiente_de_validacion', texto: 'Por validar', clase: 'neutro' },
]

const ALERTA: Record<Alerta['tipo'], { tono: Tono; texto: string }> = {
  reporte_faltante: { tono: 'aviso', texto: 'Reporte faltante' },
  avance_inconsistente: { tono: 'aviso', texto: 'Avance por verificar' },
  dato_duplicado: { tono: 'aviso', texto: 'Dato duplicado' },
  saldo_inconsistente: { tono: 'aviso', texto: 'Saldo por conciliar' },
  deposito_insuficiente: { tono: 'aviso', texto: 'Depósito insuficiente' },
  vencido: { tono: 'peligro', texto: 'Vencido' },
  por_vencer: { tono: 'aviso', texto: 'Por vencer' },
  cifra_sin_documento: { tono: 'aviso', texto: 'Cifra sin documento' },
  documento_por_asociar: { tono: 'agente', texto: 'Documento por asociar' },
  dos_numeraciones: { tono: 'info', texto: 'Dos numeraciones' },
}

const EMOJI_IMPACTO = ['🏗️', '🏠', '👩‍👧']

const ORDEN: Record<Situacion, number> = {
  vencido: 0,
  por_vencer: 1,
  pendiente_de_validacion: 2,
  en_plazo: 3,
  concluido: 4,
}

const TEXTO_SITUACION: Record<Situacion, string> = {
  vencido: '⏰ Vencido',
  por_vencer: '⏳ Por vencer',
  pendiente_de_validacion: '🔎 Por validar',
  en_plazo: '✅ En plazo',
  concluido: '🏁 Concluido',
}

function avancePlazo(t: TramiteResumen) {
  return t.plazo.dias_usados != null && t.plazo.dias_totales ? t.plazo.dias_usados / t.plazo.dias_totales : 0
}

/** Boleto azul con el expediente que más urge. */
function BoletoUrgente({ tramite }: { tramite: TramiteResumen }) {
  const { dias_usados, dias_totales } = tramite.plazo
  return (
    <section className="boleto" aria-labelledby="titulo-urgente">
      <Gotita
        pose={
          tramite.plazo.situacion === 'vencido'
            ? 'plazo-rojo'
            : tramite.plazo.situacion === 'por_vencer'
              ? 'plazo-naranja'
              : 'plazo-azul'
        }
        alto={104}
        className="boleto__gotita"
      />
      <p className="boleto__antetitulo" id="titulo-urgente">🔥 Lo más urgente hoy</p>
      <p className="boleto__id">#{tramite.id}</p>
      <div className="boleto__pildoras">
        <span className="boleto__pildora">{TEXTO_SITUACION[tramite.plazo.situacion]}</span>
        <span className="boleto__pildora boleto__pildora--suave">{NOMBRE_PROCEDIMIENTO[tramite.procedimiento]}</span>
      </div>
      <ol className="boleto__ruta">
        <li>
          <span>Empresa</span>
          {tramite.eps}
        </li>
        <li>
          <span>Etapa · responsable</span>
          {tramite.etapa} · {tramite.responsable}
        </li>
        {dias_usados != null && dias_totales != null && (
          <li>
            <span>Plazo</span>
            Día {dias_usados} de {dias_totales}
          </li>
        )}
      </ol>
      <Link to={`/sunass/expedientes/${encodeURIComponent(tramite.id)}`}>
        Abrir expediente
        <IconoFlecha tamano={16} />
      </Link>
    </section>
  )
}

function contar(items: TramiteResumen[], s: Situacion) {
  return items.filter((t) => t.plazo.situacion === s).length
}

/** Panel de la cartera DRE: lo que está en trámite, dónde se demora y qué alertas hay. */
export function Dashboard() {
  const { sesion } = useSesion()
  const perfil = ROLES_SUNASS[rolSunass(sesion)]
  const [resultado, reintentar] = useConsulta(
    async (signal) => {
      const [expedientes, alertas] = await Promise.all([listarExpedientes(signal), listarAlertas(signal)])
      return { expedientes: expedientes.items, alertas: alertas.items }
    },
    [],
  )

  useContextoAgente({
    espacio: 'Espacio SUNASS · Dashboard',
    cartera: true,
    preguntas: [
      {
        pregunta: '¿Qué expedientes están próximos a vencer?',
        respuesta:
          'En esta demostración, RP-2026-0002 y UFI-2026-0001 están por vencer. Consulta sus plazos en el expediente.',
        fuentes: ['Dashboard · tiempos por etapa (simulado)'],
        palabras: ['demora', 'etapa', 'tiempo'],
      },
    ],
  })

  return (
    <div className="pagina">
      <div className="pagina__cabecera">
        <div>
          <p className="antetitulo">SUNASS · Dirección de Regulación Económica</p>
          <h1>Dashboard</h1>
          <p className="subtitulo">Cambio del programa · Uso del fondo · Revisión periódica</p>
        </div>
        <Link className="boton boton--secundario" to="/sunass/reportes">
          Exportar
          <IconoArchivo tamano={16} />
        </Link>
      </div>


      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando la cartera…">
        {({ expedientes, alertas }) => {
          const enTramite = expedientes.filter((t) => t.plazo.situacion !== 'concluido')
          const eps = new Set(enTramite.map((t) => t.eps)).size
          const urgente = [...enTramite].sort(
            (a, b) =>
              ORDEN[a.plazo.situacion] - ORDEN[b.plazo.situacion] ||
              avancePlazo(b) - avancePlazo(a),
          )[0]
          return (
            <>
              <div className="bento-arriba">
                <Saludo
                  titulo={`¡Hola, ${perfil.cargo}! 👋`}
                  texto={`Esto es lo que pasa hoy en tu cartera · ${perfil.ambito}. Empieza por lo más urgente 🔥`}
                />
                {urgente && <BoletoUrgente tramite={urgente} />}
              </div>
              <ul className="cinco-columnas resumen-bandeja">
                <Indicador etiqueta="En trámite" valor={enTramite.length} detalle={`En ${eps} EPS`} icono={<Burbuja tamano="sm" emoji="📂" color="cielo" />} />
                <Indicador
                  etiqueta="Vencidos"
                  valor={contar(enTramite, 'vencido')}
                  detalle="Exceden el plazo máximo"
                  tono="peligro"
                  icono={<Burbuja tamano="sm" emoji="⏰" color="rosa" />}
                />
                <Indicador
                  etiqueta="Por vencer"
                  valor={contar(enTramite, 'por_vencer')}
                  detalle="Desde el 75 % del plazo"
                  tono="aviso"
                  icono={<Burbuja tamano="sm" emoji="⏳" color="durazno" />}
                />
                <Indicador
                  etiqueta="Resueltos en 2026"
                  valor={DASHBOARD_SIMULADO.resueltos.valor}
                  detalle={`${DASHBOARD_SIMULADO.resueltos.detalle} · simulado`}
                  tono="ok"
                  icono={<Gotita pose="logrado" alto={52} className="indicador-vivo__gotita" />}
                />
                <Indicador
                  etiqueta="Monto en evaluación"
                  valor={DASHBOARD_SIMULADO.monto_evaluacion.valor}
                  detalle={`${DASHBOARD_SIMULADO.monto_evaluacion.detalle} · simulado`}
                  tono="ok"
                  icono={<Burbuja tamano="sm" emoji="💰" color="limon" />}
                />
              </ul>

              <Semaforo
                enPlazo={contar(enTramite, 'en_plazo')}
                porValidar={contar(enTramite, 'pendiente_de_validacion')}
                porVencer={contar(enTramite, 'por_vencer')}
                vencidos={contar(enTramite, 'vencido')}
              />

              {/* Sin ruta en el backend todavía: solo se muestra con datos de ejemplo, nunca en producción. */}
              {usarEjemplos && <GestionFinanciera />}

              <div className="dos-mitades">
                <section className="tarjeta" aria-labelledby="titulo-proceso">
                  <TituloIcono id="titulo-proceso" emoji="🗂️" color="cielo">Expedientes en trámite por proceso</TituloIcono>
                  <ul className="procesos">
                    {PROCESOS.map((p) => {
                      const delProceso = enTramite.filter((t) => t.procedimiento === p)
                      return (
                        <li key={p}>
                          <div className="procesos__fila">
                            <span>{NOMBRE_PROCEDIMIENTO[p]}</span>
                            <strong>{delProceso.length}</strong>
                          </div>
                          <div className="barra-apilada" role="img" aria-label={resumenProceso(delProceso)}>
                            {TRAMOS.map((tramo) => {
                              const n = contar(delProceso, tramo.situacion)
                              return n > 0 ? (
                                <span
                                  key={tramo.situacion}
                                  className={`barra-apilada__tramo barra-apilada__tramo--${tramo.clase}`}
                                  style={{ flexGrow: n }}
                                />
                              ) : null
                            })}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <ul className="leyenda">
                    {TRAMOS.map((t) => (
                      <li key={t.situacion}>
                        <span className={`leyenda__punto leyenda__punto--${t.clase}`} aria-hidden="true" />
                        {t.texto}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="tarjeta" aria-labelledby="titulo-demora">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <TituloIcono id="titulo-demora" emoji="🐢" color="durazno">¿Dónde se demora el trámite?</TituloIcono>
                    <Chip tono="agente">Simulado</Chip>
                  </div>
                  <p className="texto-pequeno texto-suave">Promedio de días hábiles por etapa · 2026</p>
                  <DemoraPorEtapa />
                </section>

                <section className="tarjeta" aria-labelledby="titulo-mes">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <TituloIcono id="titulo-mes" emoji="📅" color="lila">Trámites resueltos por mes</TituloIcono>
                    <Chip tono="agente">Simulado</Chip>
                  </div>
                  <ResueltosPorMes />
                </section>

                <section className="tarjeta" aria-labelledby="titulo-alertas">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <TituloIcono id="titulo-alertas" emoji="🔔" color="rosa">Alertas recientes</TituloIcono>
                    <Link className="boton boton--secundario" to="/sunass/alertas">
                      Ver todas
                      <IconoFlecha tamano={16} />
                    </Link>
                  </div>
                  {alertas.length === 0 ? (
                    <div className="vacio-gotita">
                      <Gotita pose="al-dia" alto={90} />
                      <p className="texto-suave">¡Todo tranquilo! Los expedientes están en plazo y con sus documentos.</p>
                    </div>
                  ) : (
                    <ul className="alertas-recientes">
                      {alertas.slice(0, 3).map((a) => (
                        <li key={a.id} className="alerta-con-gotita">
                          <Gotita
                            pose={
                              ALERTA[a.tipo].tono === 'peligro'
                                ? 'avatar-rojo'
                                : ALERTA[a.tipo].tono === 'aviso'
                                  ? 'avatar-naranja'
                                  : 'avatar-alerta'
                            }
                            alto={44}
                            animada={false}
                          />
                          <div>
                            <Chip tono={ALERTA[a.tipo].tono}>{ALERTA[a.tipo].texto}</Chip>
                            <p>{a.titulo}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <ul className="tres-columnas resumen-bandeja">
                {DASHBOARD_SIMULADO.impacto.map((i, n) => (
                  <li key={i.etiqueta} className="tarjeta tarjeta--menta resumen-bandeja__tarjeta impacto-amable">
                    <Burbuja emoji={EMOJI_IMPACTO[n] ?? '🌱'} color="menta" tamano="lg" />
                    <span className="texto-pequeno">{i.etiqueta}</span>
                    <strong className="indicador-grande">{i.valor}</strong>
                    <span className="texto-pequeno texto-suave">{i.detalle}</span>
                  </li>
                ))}
              </ul>
              <AvisoSimulado texto=" Los conteos de expedientes y alertas vienen del portal; los tiempos, montos e impacto son simulados." />
            </>
          )
        }}
      </Contenido>
    </div>
  )
}

function resumenProceso(items: TramiteResumen[]) {
  return TRAMOS.map((t) => `${contar(items, t.situacion)} ${t.texto.toLowerCase()}`).join(', ')
}

function Indicador({
  etiqueta,
  valor,
  detalle,
  tono,
  icono,
}: {
  etiqueta: string
  valor: number | string
  detalle: string
  tono?: 'ok' | 'aviso' | 'peligro'
  icono?: ReactNode
}) {
  return (
    <li className={`tarjeta resumen-bandeja__tarjeta indicador-vivo${tono ? ` indicador-vivo--${tono}` : ''}`}>
      {icono}
      <span className="texto-pequeno">{etiqueta}</span>
      <strong className={`indicador-grande${tono ? ` indicador-grande--${tono}` : ''}`}>
        {typeof valor === 'number' ? <ContadorAnimado valor={valor} /> : valor}
      </strong>
      <span className="texto-pequeno texto-suave">{detalle}</span>
    </li>
  )
}

function DemoraPorEtapa() {
  const etapas = DASHBOARD_SIMULADO.demora_por_etapa
  const maximo = Math.max(...etapas.map((e) => e.dias))
  const total = etapas.reduce((s, e) => s + e.dias, 0)
  const mayor = etapas.find((e) => e.dias === maximo)!
  return (
    <>
      <ul className="demora">
        {etapas.map((e) => (
          <li key={e.etapa} className="demora__fila">
            <span>{e.etapa}</span>
            <span className="demora__pista" aria-hidden="true">
              <span
                className={`demora__barra${e.dias === maximo ? ' demora__barra--mayor' : ''}`}
                style={{ width: `${(e.dias / maximo) * 100}%` }}
              />
            </span>
            <strong>{e.dias} d</strong>
          </li>
        ))}
      </ul>
      <p className="texto-pequeno texto-aviso">
        La {mayor.etapa.toLowerCase()} concentra el {Math.round((mayor.dias / total) * 100)} % del tiempo.
      </p>
    </>
  )
}

function ResueltosPorMes() {
  const meses = DASHBOARD_SIMULADO.resueltos_por_mes
  const maximo = Math.max(...meses.map((m) => m.dentro + m.fuera))
  return (
    <>
      <ul className="columnas-mes">
        {meses.map((m) => (
          <li key={m.mes} aria-label={`${m.mes}: ${m.dentro} dentro del plazo, ${m.fuera} fuera del plazo`}>
            <strong>{m.dentro + m.fuera}</strong>
            <span className="columnas-mes__pila" style={{ height: `${((m.dentro + m.fuera) / maximo) * 120}px` }}>
              {m.fuera > 0 && <span className="columnas-mes__fuera" style={{ flexGrow: m.fuera }} />}
              <span className="columnas-mes__dentro" style={{ flexGrow: m.dentro }} />
            </span>
            <span className="texto-pequeno">{m.mes}</span>
          </li>
        ))}
      </ul>
      <ul className="leyenda">
        <li>
          <span className="leyenda__punto leyenda__punto--marca" aria-hidden="true" />
          Dentro del plazo
        </li>
        <li>
          <span className="leyenda__punto leyenda__punto--aviso" aria-hidden="true" />
          Fuera del plazo
        </li>
      </ul>
    </>
  )
}

/** «S/ 1 145,8 M»: coma decimal y espacio de miles, como el resto del portal. */
const soles = (n: number) => {
  const [entero, decimal] = n.toFixed(1).split('.')
  return `S/ ${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${decimal} M`
}

/** Gestión financiera de las EPS: avance del programa, ejecución por trimestre, fondo y EPS rezagadas. */
function GestionFinanciera() {
  const { total, ejecucion_trimestral, fondo_2026, menor_avance, fuente } = FINANCIERO
  const avance = (total.ejecutado / total.programado) * 100
  const tramo = fondo_2026.slice(3)
  const cumplimiento =
    (tramo.reduce((s, m) => s + m.efectuado, 0) / tramo.reduce((s, m) => s + m.programado, 0)) * 100
  const ultimo = ejecucion_trimestral.at(-1)!.y
  const anterior = ejecucion_trimestral.at(-2)!.y
  const crecimiento = ((ultimo - anterior) / anterior) * 100
  return (
    <section className="columna" aria-labelledby="titulo-financiero">
      <div className="panel-financiero__cabecera">
        <div>
          <TituloIcono id="titulo-financiero" emoji="💰" color="limon">¿Cómo van las inversiones de las EPS?</TituloIcono>
          <p className="texto-pequeno texto-suave">Cuánto planearon invertir, cuánto ya gastaron y cuánto ahorran en su fondo · 20 EPS</p>
        </div>
        <Chip tono="agente">Simulado · dataset de muestra</Chip>
      </div>

      <div className="panel-financiero">
        <section className="tarjeta" aria-labelledby="titulo-ejecucion">
          <div className="panel-financiero__resumen">
            <Anillo
              porcentaje={avance}
              tono="marca"
              tamano={104}
              etiqueta={`Avance financiero del programa: ${Math.round(avance)} %`}
            >
              <span>
                <strong className="panel-financiero__cifra">{Math.round(avance)}%</strong>
                <br />
                <span className="texto-pequeno texto-suave">avance</span>
              </span>
            </Anillo>
            <div>
              <h3 id="titulo-ejecucion" className="titular-dato">Ya se invirtió 🚧</h3>
              <p className="panel-financiero__cifra">{soles(total.ejecutado)}</p>
              <p className="texto-pequeno texto-suave">de {soles(total.programado)} programados</p>
              <p className="titular-dato titular-dato--ok">
                🚀 {Math.round(crecimiento)} % más que el trimestre anterior
              </p>
              <p className="texto-pequeno texto-suave">
                Casi {Math.round(avance / 10)} de cada 10 soles planeados ya se invirtieron
              </p>
            </div>
          </div>
          <LineaArea
            puntos={ejecucion_trimestral}
            formato={soles}
            etiqueta={`Ejecución financiera por trimestre, de ${soles(ejecucion_trimestral[0].y)} a ${soles(ultimo)}`}
          />
          <p className="texto-pequeno texto-suave">📈 Lo invertido en cada trimestre · {fuente}</p>
        </section>

        <section className="tarjeta" aria-labelledby="titulo-fondo">
          <TituloIcono id="titulo-fondo" emoji="🐷" color="rosa" nivel={3}>¿Están ahorrando en su fondo?</TituloIcono>
          <p className={`titular-dato titular-dato--${cumplimiento < 75 ? 'aviso' : 'ok'}`}>
            ⚠️ Desde abril guardan solo {Math.round(cumplimiento)} de cada 100 soles que deberían
          </p>
          <p className="texto-pequeno texto-suave">Cuánto depositaron de lo que debían, mes a mes</p>
          <PildorasBarras
            datos={fondo_2026.map((m) => {
              const pct = (m.efectuado / m.programado) * 100
              return { x: m.x, pct, destacado: pct >= 75 }
            })}
            bajo={75}
            etiqueta={`Depósitos mensuales 2026. De abril a agosto se depositó el ${Math.round(cumplimiento)} % de lo programado.`}
          />
          <ul className="leyenda">
            <li>
              <span className="leyenda__punto" style={{ background: 'var(--azul-vivo)' }} aria-hidden="true" />
              👍 Al día (75 % o más)
            </li>
            <li>
              <span className="leyenda__punto" style={{ background: '#f4a259' }} aria-hidden="true" />
              👀 Se quedaron cortos
            </li>
          </ul>
          <Link className="boton boton--secundario" to="/sunass/alertas">
            Ver alertas de depósito
            <IconoFlecha tamano={16} />
          </Link>
        </section>
      </div>

      <div className="bento-dos">
      <section className="tarjeta" aria-labelledby="titulo-ranking">
        <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
          <TituloIcono id="titulo-ranking" emoji="🐌" color="durazno" nivel={3}>Las EPS que van más lento</TituloIcono>
          <span className="texto-pequeno texto-suave">🏁 La línea negra es la meta (100 %)</span>
        </div>
        <ul className="ranking">
          {menor_avance.map((e, i) => {
            const pct = (e.ejecutado / e.programado) * 100
            const tono = pct < 55 ? 'peligro' : pct < 75 ? 'aviso' : 'ok'
            return (
              <li key={e.eps} className="ranking__fila">
                <span>{e.eps}</span>
                <span
                  className="ranking__pista"
                  role="img"
                  aria-label={`${e.eps}: ${Math.round(pct)} % ejecutado, ${soles(e.ejecutado)} de ${soles(e.programado)}`}
                >
                  <span
                    className={`ranking__barra ranking__barra--${tono}`}
                    style={{ width: `${Math.min(pct, 100) * 0.8}%`, animationDelay: `${i * 80}ms` }}
                  />
                  <span className="ranking__meta" style={{ left: '80%' }} />
                </span>
                <strong>{Math.round(pct)} %</strong>
              </li>
            )
          })}
        </ul>
        <div className="consejo-yaku">
          <Gotita pose="pensando" alto={92} />
          <p>
            <strong>Yaku sugiere:</strong> empieza por {menor_avance[0].eps} y {menor_avance[1].eps}, que todavía
            no llegan a la mitad de lo que planearon invertir.
          </p>
        </div>
      </section>
      <section className="tarjeta" aria-labelledby="titulo-movimientos">
        <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
          <TituloIcono id="titulo-movimientos" emoji="📝" color="lila" nivel={3}>Lo último que pasó</TituloIcono>
          <Gotita pose="verificando" alto={64} />
        </div>
        <ul className="movimientos">
          {MOVIMIENTOS.map((m) => (
            <li key={`${m.exp}-${m.que}`} style={{ ['--color-dot' as string]: m.punto }}>
              <span className="movimientos__avatar" style={{ background: m.color }} aria-hidden="true">
                {m.avatar}
              </span>
              <span>
                <span className="movimientos__quien">{m.quien}</span>
                <span className="movimientos__que">
                  {m.que} · {m.exp}
                </span>
              </span>
              <span className="movimientos__fecha">{m.fecha}</span>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </section>
  )
}

/** Semáforo de plazos con Yaku: azul en plazo, naranja por vencer y rojo vencido. */
function Semaforo({
  enPlazo,
  porVencer,
  vencidos,
  porValidar,
}: {
  enPlazo: number
  porVencer: number
  vencidos: number
  porValidar: number
}) {
  const total = enPlazo + porVencer + vencidos + porValidar
  const columnas = [
    { pose: 'plazo-azul' as const, n: enPlazo, titulo: 'En plazo', frase: 'Tiempo a favor', clase: 'azul', ruta: '/sunass/expedientes' },
    { pose: 'plazo-naranja' as const, n: porVencer, titulo: 'Por vencer', frase: '¡Atención! Ya usaron el 75 %', clase: 'naranja', ruta: '/sunass/alertas' },
    { pose: 'plazo-rojo' as const, n: vencidos, titulo: 'Vencidos', frase: 'Alerta máxima', clase: 'rojo', ruta: '/sunass/alertas' },
  ]
  return (
    <section className="tarjeta semaforo" aria-labelledby="titulo-semaforo">
      <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
        <TituloIcono id="titulo-semaforo" emoji="🚦" color="cielo">Semáforo de plazos</TituloIcono>
        <span className="texto-pequeno texto-suave">
          Así está el tiempo de tus {total} expedientes en trámite
          {porValidar > 0 && ` · ${porValidar} con plazo por validar`}
        </span>
      </div>
      <div className="semaforo__barra" role="img" aria-label={`${enPlazo} en plazo, ${porVencer} por vencer, ${vencidos} vencidos`}>
        {columnas.map((c) =>
          c.n > 0 ? <span key={c.clase} className={`semaforo__tramo semaforo__tramo--${c.clase}`} style={{ flexGrow: c.n }} /> : null,
        )}
      </div>
      <ul className="semaforo__columnas">
        {columnas.map((c) => (
          <li key={c.clase} className={`semaforo__columna semaforo__columna--${c.clase}`}>
            <Link to={c.ruta} className="semaforo__enlace">
              <Gotita pose={c.pose} alto={150} className={`semaforo__gota semaforo__gota--${c.clase}`} />
              <span className="semaforo__numero">
                <ContadorAnimado valor={c.n} />
              </span>
              <span className="semaforo__titulo">{c.titulo}</span>
              <span className="semaforo__frase">{c.frase}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
