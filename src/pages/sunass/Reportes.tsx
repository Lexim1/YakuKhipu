import { Saludo, TituloIcono } from '../../components/Graficos'
import { Contenido } from '../../components/Mensajes'
import { consultarFinanzas, soles } from '../../services/finanzas'
import { useConsulta } from '../../services/useConsulta'

function csv(valor: unknown) {
  let s = valor == null ? '' : String(valor)
  if (typeof valor === 'string' && /^[=+@\-\t\r]/.test(s)) s = "'" + s
  return `"${s.replaceAll('"', '""')}"`
}
export function Reportes() {
  const [r, retry] = useConsulta((s) => consultarFinanzas(s), [])
  return <div className="pagina"><h1>Reportes con procedencia</h1><p>Exportación de datos visibles para tu perfil; no genera un diagnóstico ni una decisión oficial.</p><Saludo pose="verificando" titulo="🖨️ Tus reportes, listos para compartir" texto="Usan las mismas cifras del dashboard y dicen de qué archivo sale cada una." /><Contenido resultado={r} reintentar={retry} textoCarga="Preparando el reporte…">{(d) => <section className="tarjeta" aria-labelledby="titulo-reporte-finanzas"><TituloIcono id="titulo-reporte-finanzas" emoji="📊" color="cielo">Programa y ejecución financiera</TituloIcono><p>Corte {d.corte} · {d.cobertura.eps} EPS · {d.fuente}</p><dl><dt>Programa vigente</dt><dd>{soles(d.total.programado)}</dd><dt>Ejecución acumulada reportada</dt><dd>{soles(d.total.ejecutado)}</dd></dl><p className="nota">Los valores ausentes se exportan vacíos; las filas trimestrales pueden tener distinta cobertura.</p><button className="boton boton--primario" onClick={() => {
    const filas: unknown[][] = [['periodo', 'ejecucion_reportada_soles', 'proyectos_reportantes', 'eps_reportantes', 'corte', 'fuentes'], ...d.ejecucion_trimestral.map((q) => [q.x, q.y, q.proyectos_reportantes, q.eps_reportantes, d.corte, d.archivos_fuente.join(' | ')])]
    const blob = new Blob(['\uFEFF' + filas.map((f) => f.map(csv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `yakukhipu-finanzas-${d.corte}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }}>Descargar CSV de mi ámbito</button><details><summary>Archivos de origen</summary><ul>{d.archivos_fuente.map((f) => <li key={f}>{f}</li>)}</ul></details></section>}</Contenido></div>
}
