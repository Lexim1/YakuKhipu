import { Link, useParams } from 'react-router'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { pedirJson } from '../../services/api'
import { useConsulta } from '../../services/useConsulta'

interface Registro { id: number | string; tramite_id: string; titulo: string; detalle: string | null; actor: string | null; fecha_acreditada: string | null; fuente: string | null; verificada?: boolean }
export function ActosDatos({ detalle = false }: { detalle?: boolean }) {
  const { id } = useParams()
  const [r, retry] = useConsulta((s) => pedirJson<{ items: Registro[]; nota: string }>('/api/seguimiento/actuaciones', { signal: s }), [])
  return <div className="pagina"><h1>{detalle ? 'Actuación registrada' : 'Actos y actuaciones registrados'}</h1><p>La evidencia se incorpora y revisa desde cada expediente; el portal no emite resoluciones.</p><Contenido resultado={r} reintentar={retry} textoCarga="Consultando trazabilidad…">{(d) => <><p className="nota">{d.nota}</p>{d.items.length ? <ul className="lista-simple lista-actuaciones">{d.items.filter((a) => !detalle || String(a.id) === id).map((a) => <li className="tarjeta" key={a.id}><h2>{a.titulo}</h2><p>{a.detalle}</p><p>{a.actor ?? 'Responsable por validar'} · {a.fecha_acreditada ?? 'Fecha por validar'}</p><p className="nota">{a.verificada ? 'Registro revisado' : 'Pendiente de verificación'} · Fuente: {a.fuente ?? 'Actuación del portal'}</p><Link className="boton boton--secundario" to={`/sunass/expedientes/${encodeURIComponent(a.tramite_id)}`}>Abrir expediente y registrar evidencia</Link></li>)}</ul> : <SinResultados titulo="No hay actuaciones registradas para tu ámbito" />}</>}</Contenido></div>
}
export function EncargosDatos() {
  const [r, retry] = useConsulta((s) => pedirJson<{ items: Registro[]; nota: string }>('/api/seguimiento/encargos', { signal: s }), [])
  return <div className="pagina"><h1>Encargos posteriores</h1><Contenido resultado={r} reintentar={retry} textoCarga="Consultando encargos documentados…">{(d) => <><p>{d.nota}</p>{d.items.length ? <ul>{d.items.map((a) => <li key={a.id}><Link to={`/sunass/expedientes/${encodeURIComponent(a.tramite_id)}`}>{a.titulo}</Link><p>{a.detalle}</p></li>)}</ul> : <SinResultados titulo="No hay encargos posteriores estructurados en los datos disponibles"><p>No se crean tareas ni fechas ficticias para completar esta vista.</p></SinResultados>}</>}</Contenido></div>
}
export function ConfiguracionDatos() {
  const [r, retry] = useConsulta((s) => pedirJson<{ reglas: { id: string; procedimiento: string; etapa: string | null; dias: number; fuente: string; validada: boolean; motivo_pendiente: string | null }[]; roles: { rol_id: string; permisos: string[] }[]; calendario_validado: number; ia_habilitada: boolean; corte: string; nota: string }>('/api/seguimiento/configuracion', { signal: s }), [])
  return <div className="pagina"><h1>Configuración efectiva</h1><Contenido resultado={r} reintentar={retry} textoCarga="Consultando configuración…">{(d) => <><p>{d.nota}</p><p>Corte: {d.corte} · IA {d.ia_habilitada ? 'habilitada' : 'deshabilitada'} · {d.calendario_validado} días de calendario validados</p><section className="tarjeta"><h2>Reglas de plazo</h2>{d.reglas.map((p) => <p key={p.id}><strong>{p.procedimiento} · {p.etapa ?? 'General'}: {p.dias} días</strong> · {p.validada ? 'Validada' : 'Pendiente de validación'}<br />{p.fuente}<br />{p.motivo_pendiente}</p>)}</section><section className="tarjeta"><h2>Permisos efectivos por rol</h2>{d.roles.map((r) => <details key={r.rol_id}><summary>{r.rol_id}</summary><ul>{r.permisos.map((p) => <li key={p}>{p}</li>)}</ul></details>)}</section></>}</Contenido></div>
}
