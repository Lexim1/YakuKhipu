import { useState } from 'react'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip } from '../../components/Chip'
import { Burbuja, Saludo } from '../../components/Graficos'
import { REPORTES } from '../../mocks/seguimiento'

/** Reportes con las mismas cifras del dashboard y sus fuentes. La generación todavía es una demostración. */
export function Reportes() {
  const [mensaje, setMensaje] = useState<string | null>(null)

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Seguimiento</p>
        <h1>Reportes</h1>
        <p className="subtitulo">Genera reportes con las mismas cifras del dashboard y sus fuentes.</p>
      </div>

      <AvisoSimulado texto=" La generación de archivos todavía no está conectada al servidor." />

      <Saludo
        pose="verificando"
        titulo="🖨️ Tus reportes, listos para compartir"
        texto="Usan las mismas cifras del dashboard y dicen de qué documento sale cada una."
      />

      {mensaje && (
        <p className="mensaje mensaje--exito" role="status">
          {mensaje}
        </p>
      )}

      <ul className="tres-columnas resumen-bandeja">
        {REPORTES.map((r, i) => (
          <li key={r.titulo} className="tarjeta reporte reporte--vivo">
            <Burbuja emoji={['📊', '📑', '🗂️', '📈', '🧾', '📋'][i % 6]} color={(['cielo', 'durazno', 'menta', 'lila', 'rosa', 'limon'] as const)[i % 6]} tamano="lg" />
            <h2 className="reporte__titulo">{r.titulo}</h2>
            <p className="texto-pequeno texto-suave">{r.detalle}</p>
            <div className="fila-chips">
              <Chip tono="neutro">{r.formato}</Chip>
              <span className="texto-pequeno texto-suave">Actualizado: {r.actualizado}</span>
            </div>
            <button
              type="button"
              className="boton boton--secundario boton--bloque"
              onClick={() =>
                setMensaje(
                  `«${r.titulo}» en ${r.formato}: en esta demostración no se genera el archivo. Usará las cifras de la cartera y sus fuentes.`,
                )
              }
            >
              Generar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
