import { useAgente } from '../../../agente/useAgente'
import { Chip, Fuente } from '../../../components/Chip'
import { IconoChispa, IconoFlecha } from '../../../components/Iconos'
import type { Comparador as Tipo } from '../../../types/tramite'

/** Pestaña «Comparador de cifras»: cada versión con su fuente; la que no tiene documento se marca. */
export function Comparador({ datos, verImpacto }: { datos: Tipo; verImpacto?: () => void }) {
  const { abrir } = useAgente()
  return (
    <div className="dos-columnas">
      <section className="tarjeta columna" aria-labelledby="titulo-versiones">
        <h2 id="titulo-versiones">{datos.titulo}</h2>
        {datos.versiones.map((v) => (
          <div key={v.titulo} className={`version${v.sin_documento ? ' version--sin-documento' : ''}`}>
            <span className="version__valor">{v.valor}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <div className="fila-chips">
                <h3>{v.titulo}</h3>
                {v.sin_documento && <Chip tono="aviso">No consta en el expediente</Chip>}
              </div>
              <p className="texto-suave">{v.detalle}</p>
              <Fuente>{v.fuente}</Fuente>
            </div>
          </div>
        ))}
        {datos.aviso && (
          <div className="fila-chips" style={{ justifyContent: 'space-between' }}>
            <p className="texto-suave">{datos.aviso}</p>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => abrir('Redacta el pedido a la EPS para formalizar la cifra de 19 935')}
            >
              Pedir a la EPS
              <IconoChispa tamano={16} />
            </button>
          </div>
        )}
      </section>
      <section className="evaluacion" aria-labelledby="titulo-evaluacion">
        <p id="titulo-evaluacion" className="siguiente__antetitulo">
          Lo que se evalúa
        </p>
        <p className="evaluacion__cifra">{datos.evaluacion.cantidad}</p>
        <p style={{ color: 'var(--color-primario-texto)', fontWeight: 500 }}>{datos.evaluacion.unidad}</p>
        <p className="evaluacion__monto">{datos.evaluacion.monto}</p>
        <dl className="lista-datos">
          {datos.evaluacion.filas.map((f) => (
            <div key={f.etiqueta} style={{ borderBottom: 0, padding: '4px 0' }}>
              <dt style={{ color: 'var(--color-primario-texto)' }}>{f.etiqueta}</dt>
              <dd>{f.valor}</dd>
            </div>
          ))}
        </dl>
        {verImpacto && <button type="button" className="boton boton--secundario boton--bloque" onClick={verImpacto}>
          Ver impacto social
          <IconoFlecha tamano={16} />
        </button>}
      </section>
    </div>
  )
}
