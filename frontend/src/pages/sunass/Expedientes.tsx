import { Link, useSearchParams } from 'react-router'
import { pedirJson } from '../../services/api'
import { useConsulta } from '../../services/useConsulta'

export function Expedientes() {
  const [parametros] = useSearchParams()
  const filtro = parametros.get('q')?.toLowerCase() || ''
  const [resultado, reintentar] = useConsulta((signal) => pedirJson<{
    items: { id: string; eps: string; procedimiento: string; etapa: string }[]
  }>('/api/tramites', { signal }), [])
  if (resultado.estado === 'cargando') return <p role="status">Cargando expedientes…</p>
  if (resultado.estado === 'error') return <p role="alert">No se pudo cargar la cartera. <button onClick={reintentar}>Reintentar</button></p>
  const lista = resultado.datos.items.filter((t) => [t.id, t.eps, t.procedimiento, t.etapa]
    .some((valor) => valor.toLowerCase().includes(filtro)))
  return <section>
    <h1>Expedientes</h1>
    {lista.length ? <ul>{lista.map((t) => <li key={t.id}>
      <Link to={encodeURIComponent(t.id)}>{t.eps} · {t.procedimiento}</Link> — {t.etapa}
    </li>)}</ul> : <p>No hay expedientes para mostrar.</p>}
  </section>
}
