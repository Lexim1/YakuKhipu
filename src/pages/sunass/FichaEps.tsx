import { useState } from 'react'
import { Link } from 'react-router'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { Chip } from '../../components/Chip'
import { Saludo, TituloIcono } from '../../components/Graficos'
import { consultarFinanzas, consultarFichaEps } from '../../services/finanzas'
import { useConsulta } from '../../services/useConsulta'

const CAMPOS: Record<string, string[]> = {
  programa_inversion: ['cod_proyecto', 'nombre_proyecto', 'anio', 'monto_programado_vigente', 'poblacion_beneficiaria'],
  ejecucion_inversion: ['cod_proyecto', 'anio_trimestre', 'avance_fisico_acumulado_pct', 'ejecucion_financiera_trimestre', 'ejecucion_financiera_acumulada'],
  fondo_inversion: ['anio_mes', 'tipo_fondo', 'deposito_programado', 'deposito_efectuado', 'saldo_final'],
  estado_financiero: ['anio', 'estado_presentacion', 'resultado_neto', 'liquidez_corriente', 'morosidad_pct'],
  meta_gestion: ['nombre_meta', 'anio', 'valor_meta', 'valor_alcanzado', 'cumplimiento_pct'],
}
const ICONO_TABLA: Record<string, { emoji: string; color: 'cielo' | 'durazno' | 'menta' | 'lila' | 'rosa' | 'limon' }> = { programa_inversion: { emoji: '💧', color: 'cielo' }, ejecucion_inversion: { emoji: '🛠️', color: 'durazno' }, fondo_inversion: { emoji: '🐷', color: 'rosa' }, estado_financiero: { emoji: '📈', color: 'menta' }, meta_gestion: { emoji: '🎯', color: 'limon' } }
const TABLAS: Record<string, string> = { programa_inversion: 'Programa de inversiones', ejecucion_inversion: 'Ejecución de inversiones', fondo_inversion: 'Fondos y reservas', estado_financiero: 'Estados financieros', meta_gestion: 'Metas de gestión' }
const ETIQUETAS: Record<string, string> = { cod_proyecto: 'Código del proyecto', nombre_proyecto: 'Proyecto', anio: 'Año', monto_programado_vigente: 'Programa vigente (S/)', poblacion_beneficiaria: 'Población potencial', anio_trimestre: 'Trimestre', avance_fisico_acumulado_pct: 'Avance físico (%)', ejecucion_financiera_trimestre: 'Ejecución del trimestre (S/)', ejecucion_financiera_acumulada: 'Ejecución acumulada (S/)', anio_mes: 'Mes', tipo_fondo: 'Fondo o reserva', deposito_programado: 'Depósito programado (S/)', deposito_efectuado: 'Depósito efectuado (S/)', saldo_final: 'Saldo final (S/)', estado_presentacion: 'Presentación', resultado_neto: 'Resultado neto (S/)', liquidez_corriente: 'Liquidez corriente', morosidad_pct: 'Morosidad (%)', nombre_meta: 'Meta', valor_meta: 'Valor previsto', valor_alcanzado: 'Valor alcanzado', cumplimiento_pct: 'Cumplimiento (%)' }
function Datos({ filas, campos }: { filas: Record<string, string | number | null>[]; campos: string[] }) {
  const [limite, setLimite] = useState(20)
  if (!filas.length) return <p>No hay registros disponibles.</p>
  return <><p className="nota">Puedes desplazar la tabla horizontalmente para consultar todas las columnas.</p><div className="tabla-contenedor tabla-datos" tabIndex={0} role="region" aria-label="Registros con fuentes"><table><caption>{filas.length} registros con procedencia</caption><thead><tr>{campos.map((k) => <th key={k}>{ETIQUETAS[k] ?? k}</th>)}<th>Fuente</th></tr></thead><tbody>{filas.slice(0, limite).map((r, i) => <tr key={String(r.canonical_id ?? i)}>{campos.map((k) => <td key={k}>{r[k] == null ? 'Sin dato' : String(r[k])}</td>)}<td><details><summary>{r.archivo_actualizacion ?? r.source_file}</summary><p>{r.canonical_id}</p><p className="nota">Huella: {r.source_hash}</p></details></td></tr>)}</tbody></table></div>{limite < filas.length && <button className="boton boton--secundario" onClick={() => setLimite(limite + 30)}>Mostrar 30 registros más</button>}</>
}
export function FichaEps() {
  const [resultado, reintentar] = useConsulta((s) => consultarFinanzas(s), [])
  const [id, setId] = useState('')
  return <div className="pagina"><div><p className="antetitulo">Seguimiento con fuentes</p><h1>Ficha 360 de EPS</h1><p>Inversiones, fondos, estados financieros y metas de los datasets importados.</p></div><Saludo pose="hola" titulo="🏢 Así va cada EPS" texto="Sus inversiones, fondos, estados financieros y metas, en un solo lugar y con la fuente de cada dato." /><Contenido resultado={resultado} reintentar={reintentar} textoCarga="Consultando EPS autorizadas…">{(datos) => datos.eps_disponibles.length ? <><label className="campo">EPS<select value={id || datos.eps_disponibles[0].id} onChange={(e) => setId(e.target.value)}>{datos.eps_disponibles.map((e) => <option value={e.id} key={e.id}>{e.nombre}</option>)}</select></label><Detalle key={id || datos.eps_disponibles[0].id} id={id || datos.eps_disponibles[0].id} /></> : <SinResultados titulo="No hay EPS en tu ámbito"><p>El analista accede a las EPS de sus expedientes asignados.</p></SinResultados>}</Contenido></div>
}
function Detalle({ id }: { id: string }) {
  const [r, retry] = useConsulta((s) => consultarFichaEps(id, s), [id])
  return <Contenido resultado={r} reintentar={retry} textoCarga="Cargando la ficha con sus fuentes…">{(f) => <><Chip tono="info">{f.simulado ? 'Dataset de muestra' : 'Información documental'} · corte {f.corte}</Chip><p className="nota">{f.nota} La población beneficiaria es potencial: no se suma sin verificar solapamientos.</p><section className="tarjeta" aria-labelledby="titulo-tramites-eps"><TituloIcono id="titulo-tramites-eps" emoji="📂" color="cielo">Expedientes visibles de {f.eps.nombre}</TituloIcono><ul className="lista-simple">{f.tramites.map((t) => <li key={t.id}><Link to={`/sunass/expedientes/${encodeURIComponent(t.id)}`}>{t.titulo}</Link><p>{t.procedimiento} · {t.etapa} · {t.estado}</p></li>)}</ul></section>{Object.entries(CAMPOS).map(([tabla, campos]) => <section className="tarjeta" key={tabla} aria-labelledby={`titulo-${tabla}`}><TituloIcono id={`titulo-${tabla}`} emoji={ICONO_TABLA[tabla].emoji} color={ICONO_TABLA[tabla].color}>{TABLAS[tabla]}</TituloIcono><Datos filas={f.datos[tabla] ?? []} campos={campos} /></section>)}</>}</Contenido>
}
