import { useState } from 'react'
import { Contenido } from '../../../components/Mensajes'
import { pedirJson } from '../../../services/api'
import { soles } from '../../../services/finanzas'
import { useConsulta } from '../../../services/useConsulta'
interface Procedimiento { id_expediente: string; monto_solicitado: number | null; monto_aprobado: number | null; resultado: string | null; fecha_conclusion: string | null; source_file: string; source_hash: string; canonical_id: string }
export function ContextoDatos({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false)
  return <section className="tarjeta"><h2>Solicitado, autorizado y contexto financiero</h2><button className="boton boton--secundario" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>{abierto ? 'Ocultar contexto' : 'Consultar datos fuente del expediente'}</button>{abierto && <Datos id={id} />}</section>
}
function Datos({ id }: { id: string }) {
  const [r, retry] = useConsulta((s) => pedirJson<{ procedimiento: Procedimiento | null; nota: string }>(`/api/tramites/${encodeURIComponent(id)}/contexto`, { signal: s }), [id])
  return <Contenido resultado={r} reintentar={retry} textoCarga="Consultando el contexto autorizado…">{(d) => <>{d.procedimiento ? <><p>Referencia original: {d.procedimiento.id_expediente}</p><dl><dt>Monto solicitado según dataset</dt><dd>{soles(d.procedimiento.monto_solicitado)}</dd><dt>Monto autorizado reportado</dt><dd>{soles(d.procedimiento.monto_aprobado)}</dd><dt>Monto ejecutado de esta decisión</dt><dd>No acreditado por la fuente del procedimiento. No se sustituye por la ejecución global de la EPS.</dd></dl><p>Resultado reportado: {d.procedimiento.resultado || 'Sin resultado informado'} · conclusión: {d.procedimiento.fecha_conclusion || 'No registrada'}</p><details><summary>Procedencia</summary><p>{d.procedimiento.source_file} · {d.procedimiento.canonical_id}</p><p className="nota">Huella: {d.procedimiento.source_hash}</p></details></> : <p>Este expediente documental no tiene una fila de importes en DS02. No se completan montos sin una fuente autorizada.</p>}<p className="nota">{d.nota}</p></>}</Contenido>
}
