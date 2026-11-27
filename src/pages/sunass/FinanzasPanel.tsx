import { useState } from 'react'
import { Link } from 'react-router'
import { Anillo, LineaArea, TituloIcono } from '../../components/Graficos'
import { Gotita } from '../../components/Gotita'
import { Chip } from '../../components/Chip'
import { soles, type ResumenFinanzas } from '../../services/finanzas'

export function FinanzasPanel({ datos }: { datos: ResumenFinanzas }) {
  const [todosLosMeses, setTodosLosMeses] = useState(false)
  const meses = todosLosMeses ? datos.fondos : datos.fondos.slice(-6)
  const series = datos.ejecucion_trimestral.filter((p): p is typeof p & { y: number } => p.y != null)
  const conocidos = datos.menor_avance.filter((r) => r.avance_pct != null)
  return (
    <section className="columna" aria-labelledby="titulo-financiero">
      <div className="panel-financiero__cabecera">
        <TituloIcono id="titulo-financiero" emoji="💰" color="limon">¿Cómo van las inversiones de las EPS?</TituloIcono>
        <Chip tono="info">D3 importado · corte {datos.corte}</Chip>
      </div>
      <p className="nota">{datos.fuente} · {datos.cobertura.eps} EPS visibles para tu perfil. Montos en soles; datos de muestra, sin conexión al SIA.</p>
      <div className="panel-financiero">
        <section className="tarjeta" aria-labelledby="titulo-ejecucion">
          <div className="panel-financiero__resumen">
            {datos.total.avance_pct != null && <Anillo porcentaje={datos.total.avance_pct} tono="marca" tamano={100} etiqueta={`Avance financiero reportado: ${datos.total.avance_pct} %`}><strong>{Math.round(datos.total.avance_pct)} %</strong></Anillo>}
            <div>
              <h3 id="titulo-ejecucion">Ejecución acumulada reportada</h3>
              <p className="panel-financiero__cifra">{soles(datos.total.ejecutado)}</p>
              <p>Programa vigente hasta el año de corte: {soles(datos.total.programado)}</p>
            </div>
          </div>
          {series.length > 0 ? <LineaArea puntos={series} formato={soles} etiqueta="Ejecución financiera reportada por trimestre, en soles" /> : <p>No hay reportes de ejecución en este ámbito.</p>}
          <p className="nota">{datos.variacion_trimestral_pct == null ? 'La cobertura puede variar entre trimestres; no se calcula una variación comparable.' : `Variación entre trimestres con la misma cobertura: ${datos.variacion_trimestral_pct} %.`}</p>
          <details><summary>Cobertura de los reportes</summary><ul>{datos.ejecucion_trimestral.map((q) => <li key={q.x}>{q.x}: {q.proyectos_reportantes} proyectos de {q.eps_reportantes} EPS</li>)}</ul></details>
        </section>
        <section className="tarjeta" aria-labelledby="titulo-fondo">
          <TituloIcono id="titulo-fondo" emoji="🐷" color="rosa" nivel={3}>Depósitos de fondos y reservas</TituloIcono>
          {datos.fondos.length === 0 ? <p>No hay depósitos reportados para el corte seleccionado.</p> : <div className="tabla-contenedor tabla-fondos"><table><caption>{todosLosMeses ? 'Todos los meses' : 'Últimos seis meses disponibles'}. Depósitos reportados; no determina por sí solo incumplimiento.</caption><thead><tr><th>Mes</th><th>Programado</th><th>Efectuado</th><th>Relación</th></tr></thead><tbody>{meses.map((m) => <tr key={m.x}><th scope="row">{m.x}</th><td>{soles(m.programado)}</td><td>{soles(m.efectuado)}</td><td>{m.cumplimiento_pct == null ? 'Sin dato' : `${m.cumplimiento_pct} %`}</td></tr>)}</tbody></table></div>}
          {datos.fondos.length > 6 && <button type="button" className="boton boton--secundario" onClick={() => setTodosLosMeses(!todosLosMeses)}>{todosLosMeses ? 'Mostrar seis meses' : 'Ver todos los meses'}</button>}
          <Link className="boton boton--secundario" to="/sunass/alertas">Revisar alertas con fuente</Link>
        </section>
      </div>
      <div className="bento-dos">
        <section className="tarjeta" aria-labelledby="titulo-ranking">
          <TituloIcono id="titulo-ranking" emoji="🐌" color="durazno" nivel={3}>Menor avance reportado</TituloIcono>
          <ul className="ranking">{datos.menor_avance.map((e) => <li key={e.eps_id} className="ranking__fila"><span>{e.eps}</span><span className="ranking__pista" role="img" aria-label={`${e.eps}: ${e.avance_pct ?? 'sin dato'} %`}><span className="ranking__barra ranking__barra--aviso" style={{ width: `${Math.min(e.avance_pct ?? 0, 100)}%` }} /></span><strong>{e.avance_pct == null ? 'Sin dato' : `${Math.round(e.avance_pct)} %`}</strong></li>)}</ul>
          <div className="consejo-yaku"><Gotita pose="pensando" alto={70} /><p>{conocidos.length ? `Revisa la cobertura y las fuentes de ${conocidos[0].eps} antes de priorizar. Un reporte faltante puede cambiar la comparación.` : 'No hay información suficiente para ordenar las EPS por avance.'}</p></div>
        </section>
        <section className="tarjeta" aria-labelledby="titulo-movimientos">
          <TituloIcono id="titulo-movimientos" emoji="📝" color="lila" nivel={3}>Actuaciones registradas</TituloIcono>
          {datos.movimientos.length ? <ul className="lista-simple">{datos.movimientos.slice(0, 4).map((m, i) => <li key={`${m.tramite_id}-${i}`}><Link to={`/sunass/expedientes/${encodeURIComponent(m.tramite_id)}`}>{m.titulo}</Link><p className="nota">{m.actor ?? 'Responsable no informado'} · {m.fecha_acreditada ?? 'Fecha por validar'} · {m.expediente}</p></li>)}</ul> : <p>No hay actuaciones registradas en este ámbito y corte.</p>}
          <Link className="boton boton--secundario" to="/sunass/actos">Ver actuaciones con fuente</Link>
        </section>
      </div>
      <details><summary>Fuentes y límites de lectura</summary><ul>{datos.advertencias.map((a) => <li key={a}>{a}</li>)}</ul><p>{datos.archivos_fuente.join(' · ') || 'Sin archivos en este ámbito.'}</p></details>
    </section>
  )
}
