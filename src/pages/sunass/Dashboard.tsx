import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, type Tono } from '../../components/Chip'
import { IconoArchivo, IconoFlecha } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
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
  vencido: { tono: 'peligro', texto: 'Vencido' },
  por_vencer: { tono: 'aviso', texto: 'Por vencer' },
  cifra_sin_documento: { tono: 'aviso', texto: 'Cifra sin documento' },
  documento_por_asociar: { tono: 'agente', texto: 'Documento por asociar' },
  dos_numeraciones: { tono: 'info', texto: 'Dos numeraciones' },
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
    preguntas: [
      {
        pregunta: '¿Dónde se demora más el trámite?',
        respuesta:
          'En la evaluación técnica: 11 días hábiles en promedio, el 39 % del tiempo total (dato simulado de la demostración).',
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

      <div className="franja-ambito">
        <p className="franja-ambito__titulo">{perfil.ambito} · trazabilidad de CPI, UFI y RP</p>
        <p>{perfil.descripcion}</p>
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando la cartera…">
        {({ expedientes, alertas }) => {
          const enTramite = expedientes.filter((t) => t.plazo.situacion !== 'concluido')
          const eps = new Set(enTramite.map((t) => t.eps)).size
          return (
            <>
              <ul className="cinco-columnas resumen-bandeja">
                <Indicador etiqueta="En trámite" valor={enTramite.length} detalle={`En ${eps} EPS`} />
                <Indicador
                  etiqueta="Vencidos"
                  valor={contar(enTramite, 'vencido')}
                  detalle="Exceden el plazo máximo"
                  tono="peligro"
                />
                <Indicador
                  etiqueta="Por vencer"
                  valor={contar(enTramite, 'por_vencer')}
                  detalle="Desde el 75 % del plazo"
                  tono="aviso"
                />
                <Indicador
                  etiqueta="Resueltos en 2026"
                  valor={DASHBOARD_SIMULADO.resueltos.valor}
                  detalle={`${DASHBOARD_SIMULADO.resueltos.detalle} · simulado`}
                  tono="ok"
                />
                <Indicador
                  etiqueta="Monto en evaluación"
                  valor={DASHBOARD_SIMULADO.monto_evaluacion.valor}
                  detalle={`${DASHBOARD_SIMULADO.monto_evaluacion.detalle} · simulado`}
                  tono="ok"
                />
              </ul>

              <div className="dos-mitades">
                <section className="tarjeta" aria-labelledby="titulo-proceso">
                  <h2 id="titulo-proceso">Expedientes en trámite por proceso</h2>
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
                    <h2 id="titulo-demora">¿Dónde se demora el trámite?</h2>
                    <Chip tono="agente">Simulado</Chip>
                  </div>
                  <p className="texto-pequeno texto-suave">Promedio de días hábiles por etapa · 2026</p>
                  <DemoraPorEtapa />
                </section>

                <section className="tarjeta" aria-labelledby="titulo-mes">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <h2 id="titulo-mes">Trámites resueltos por mes</h2>
                    <Chip tono="agente">Simulado</Chip>
                  </div>
                  <ResueltosPorMes />
                </section>

                <section className="tarjeta" aria-labelledby="titulo-alertas">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <h2 id="titulo-alertas">Alertas recientes</h2>
                    <Link className="boton boton--secundario" to="/sunass/alertas">
                      Ver todas
                      <IconoFlecha tamano={16} />
                    </Link>
                  </div>
                  {alertas.length === 0 ? (
                    <p className="texto-suave">No hay alertas. Los expedientes están en plazo y con sus documentos.</p>
                  ) : (
                    <ul className="alertas-recientes">
                      {alertas.slice(0, 3).map((a) => (
                        <li key={a.id}>
                          <Chip tono={ALERTA[a.tipo].tono}>{ALERTA[a.tipo].texto}</Chip>
                          <p>{a.titulo}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <ul className="tres-columnas resumen-bandeja">
                {DASHBOARD_SIMULADO.impacto.map((i) => (
                  <li key={i.etiqueta} className="tarjeta tarjeta--menta resumen-bandeja__tarjeta">
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
}: {
  etiqueta: string
  valor: number | string
  detalle: string
  tono?: 'ok' | 'aviso' | 'peligro'
}) {
  return (
    <li className="tarjeta resumen-bandeja__tarjeta">
      <span className="texto-pequeno">{etiqueta}</span>
      <strong className={`indicador-grande${tono ? ` indicador-grande--${tono}` : ''}`}>{valor}</strong>
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
