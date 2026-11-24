import { useState } from 'react'
import { Dialogo } from '../../../components/Dialogo'
import { IconoAtras } from '../../../components/Iconos'
import { INICIO_RUTA, RUTAS } from '../../../data/rutas'
import type { Procedimiento } from '../../../types/tramite'

interface Props {
  procedimiento: Procedimiento
  abierto: boolean
  alCerrar: () => void
}

/**
 * «Consultar rutas del procedimiento»: recorre las situaciones posibles del trámite.
 * Es una guía; no cambia el estado real, que conserva el historial.
 */
export function RutasDialogo({ procedimiento, abierto, alCerrar }: Props) {
  const [pila, setPila] = useState<string[]>([INICIO_RUTA[procedimiento]])
  const actual = RUTAS[pila[pila.length - 1]]

  function cerrar() {
    setPila([INICIO_RUTA[procedimiento]])
    alCerrar()
  }

  return (
    <Dialogo abierto={abierto} titulo={actual.titulo} alCerrar={cerrar} sinCabecera>
      <div className="ruta" aria-live="polite">
        <p className="ruta__antetitulo">{actual.antetitulo}</p>
        <h2>{actual.titulo}</h2>
        {actual.subtitulo && <p className="texto-suave">{actual.subtitulo}</p>}
        <p className="ruta__texto">{actual.texto}</p>
        {actual.opciones.map((o) => (
          <button
            key={o.texto}
            type="button"
            className="ruta__opcion"
            onClick={() => setPila((p) => [...p, o.destino])}
          >
            {o.texto}
          </button>
        ))}
        {pila.length > 1 && (
          <button type="button" className="ruta__opcion" onClick={() => setPila((p) => p.slice(0, -1))}>
            <IconoAtras tamano={14} /> Volver
          </button>
        )}
        <button type="button" className="ruta__opcion" onClick={cerrar}>
          Cerrar
        </button>
      </div>
    </Dialogo>
  )
}
