import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, type Tono } from '../../components/Chip'
import { Burbuja, ContadorAnimado, Saludo, TituloIcono } from '../../components/Graficos'
import { IconoArchivo, IconoFlecha } from '../../components/Iconos'
import { Contenido } from '../../components/Mensajes'
import { Gotita } from '../../components/Gotita'
import { consultarFinanzas, soles, type ResumenFinanzas } from '../../services/finanzas'
import { FinanzasPanel } from './FinanzasPanel'
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
      <p className="boleto__antetitulo" id="titulo-urgente">{['vencido', 'por_vencer'].includes(tramite.plazo.situacion) ? '🔥 Prioridad por plazo' : '📂 Expediente por revisar'}</p>
      <p className="boleto__id">{tramite.referencia ?? tramite.id}</p>
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
  const [corte, setCorte] = useState('')
  const perfil = ROLES_SUNASS[rolSunass(sesion)]
  const [resultado, reintentar] = useConsulta(
    async (signal) => {
      const [expedientes, alertas, finanzas] = await Promise.all([listarExpedientes(signal), listarAlertas(signal), consultarFinanzas(signal, corte)])
      return { expedientes: expedientes.items, alertas: alertas.items, finanzas }
    },
    [corte],
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
        {({ expedientes, alertas, finanzas }) => {
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
                  etiqueta={`Resueltos en ${finanzas.corte.slice(0, 4)}`}
                  valor={finanzas.resueltos}
                  detalle={`Con fecha de conclusión hasta ${finanzas.corte}`}
                  tono="ok"
                  icono={<Gotita pose="logrado" alto={52} className="indicador-vivo__gotita" />}
                />
                <Indicador
                  etiqueta="Monto en evaluación"
                  valor={soles(finanzas.monto_solicitado_en_evaluacion)}
                  detalle="Monto solicitado; no equivale a autorizado ni ejecutado"
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

              <label className="campo">Corte de los datos financieros<input aria-label="Corte financiero" type="date" value={corte} onChange={(e) => setCorte(e.target.value)} /><span className="nota">Corte efectivo: {finanzas.corte}</span></label>
              <FinanzasPanel datos={finanzas} />

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
                    <Chip tono="info">Datos D3 importados</Chip>
                  </div>
                  <p className="texto-pequeno texto-suave">Promedio de días calendario entre hitos con fechas registradas; no es plazo legal</p>
                  <DemoraPorEtapa etapas={finanzas.demora_por_etapa} />
                </section>

                <section className="tarjeta" aria-labelledby="titulo-mes">
                  <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
                    <TituloIcono id="titulo-mes" emoji="📅" color="lila">Trámites resueltos por mes</TituloIcono>
                    <Chip tono="info">Datos D3 importados</Chip>
                  </div>
                  <ResueltosPorMes meses={finanzas.resueltos_por_mes} />
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
                {[{ etiqueta: 'EPS visibles', valor: finanzas.cobertura.eps, detalle: 'Ámbito de tu cartera' }, { etiqueta: 'Proyectos programados', valor: finanzas.cobertura.proyectos_programados, detalle: 'Programa vigente hasta el año de corte' }, { etiqueta: 'Proyectos con ejecución', valor: finanzas.cobertura.proyectos_con_ejecucion, detalle: 'Último reporte disponible por proyecto' }].map((i, n) => (
                  <li key={i.etiqueta} className="tarjeta tarjeta--menta resumen-bandeja__tarjeta impacto-amable">
                    <Burbuja emoji={EMOJI_IMPACTO[n] ?? '🌱'} color="menta" tamano="lg" />
                    <span className="texto-pequeno">{i.etiqueta}</span>
                    <strong className="indicador-grande">{i.valor}</strong>
                    <span className="texto-pequeno texto-suave">{i.detalle}</span>
                  </li>
                ))}
              </ul>
              <AvisoSimulado texto=" Datos del sprint y su actualización importados en PostgreSQL; los registros ficticios siguen identificados como muestra. No acreditan beneficios ejecutados." />
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

function DemoraPorEtapa({ etapas }: { etapas: ResumenFinanzas['demora_por_etapa'] }) {
  if (!etapas.length) return <p>No hay hitos con ambas fechas para calcular duración.</p>
  const maximo = Math.max(1, ...etapas.map((e) => e.dias))
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
        La {mayor.etapa.toLowerCase()} concentra el {Math.round(total ? (mayor.dias / total) * 100 : 0)} % del tiempo.
      </p>
    </>
  )
}

function ResueltosPorMes({ meses }: { meses: ResumenFinanzas['resueltos_por_mes'] }) {
  if (!meses.length) return <p>No hay conclusiones registradas en este periodo.</p>
  const maximo = Math.max(...meses.map((m) => m.total))
  return (
    <>
      <ul className="columnas-mes">
        {meses.map((m) => (
          <li key={m.mes} aria-label={`${m.mes}: ${m.total} concluidos`}>
            <strong>{m.total}</strong>
            <span className="columnas-mes__pila" style={{ height: `${((m.total) / maximo) * 120}px` }}>
              <span className="columnas-mes__dentro" style={{ flexGrow: m.total }} />
            </span>
            <span className="texto-pequeno">{m.mes}</span>
          </li>
        ))}
      </ul>
      <ul className="leyenda">
        <li>
          <span className="leyenda__punto leyenda__punto--marca" aria-hidden="true" />
          Conclusiones registradas
        </li>
        <li>
          <span className="leyenda__punto leyenda__punto--aviso" aria-hidden="true" />
          No se determina cumplimiento normativo
        </li>
      </ul>
    </>
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
