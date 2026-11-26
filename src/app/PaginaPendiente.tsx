import { useLocation } from 'react-router'

/** Marcador de una pantalla que se implementa en otra tarea. */
export function PaginaPendiente({ titulo, responsable }: { titulo: string; responsable: string }) {
  const { pathname } = useLocation()
  return (
    <div className="pagina">
      <h1>{titulo}</h1>
      <div className="mensaje">
        <p>
          Esta pantalla se construye en una tarea aparte ({responsable}). Ruta: <code>{pathname}</code>
        </p>
      </div>
    </div>
  )
}
