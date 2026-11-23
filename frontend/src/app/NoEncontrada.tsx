import { Link } from 'react-router'

export function NoEncontrada() {
  return (
    <main id="contenido" className="publico">
      <div className="pagina">
        <h1>No encontramos esta página</h1>
        <p className="subtitulo">Revisa la dirección o vuelve al inicio.</p>
        <div>
          <Link className="boton boton--primario" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
