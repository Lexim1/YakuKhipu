import { useState } from 'react'
import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Barra } from '../../components/Barra'
import { Chip } from '../../components/Chip'
import { FICHAS_EPS } from '../../mocks/seguimiento'

/** Ficha 360 de una EPS: indicadores, trámites ante Sunass y metas de gestión. Datos de demostración. */
export function FichaEps() {
  const [id, setId] = useState(FICHAS_EPS[0].id)
  const ficha = FICHAS_EPS.find((f) => f.id === id) ?? FICHAS_EPS[0]

  useContextoAgente({
    espacio: `Espacio SUNASS · Ficha 360 · ${ficha.nombre}`,
    preguntas: [
      {
        pregunta: '¿Cómo va la ejecución de esta EPS?',
        respuesta: `${ficha.nombre}: ${ficha.calificacion.toLowerCase()}. ${ficha.indicadores
          .map((i) => `${i.etiqueta}: ${i.valor}`)
          .join(' · ')}. Son datos simulados de la demostración.`,
        fuentes: ['Ficha 360 (simulado)'],
        palabras: ['ejecucion', 'como va', 'calificacion'],
      },
    ],
  })

  return (
    <div className="pagina">
      <div className="pagina__cabecera">
        <div>
          <p className="antetitulo">Ficha 360</p>
          <h1>{ficha.nombre}</h1>
          <p className="subtitulo">{ficha.descripcion}</p>
        </div>
        <div className="fila-chips">
          {FICHAS_EPS.length > 1 && (
            <label className="campo">
              EPS
              <select value={id} onChange={(e) => setId(e.target.value)}>
                {FICHAS_EPS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Chip tono="aviso">{ficha.calificacion}</Chip>
        </div>
      </div>

      <AvisoSimulado />

      <ul className="cuatro-columnas resumen-bandeja">
        {ficha.indicadores.map((i) => (
          <li key={i.etiqueta} className="tarjeta resumen-bandeja__tarjeta">
            <span className="texto-pequeno">{i.etiqueta}</span>
            <strong className="indicador-grande">{i.valor}</strong>
            <span className="texto-pequeno texto-suave">{i.detalle}</span>
          </li>
        ))}
      </ul>

      <div className="dos-columnas">
        <section className="tarjeta" aria-labelledby="titulo-tramites-eps">
          <h2 id="titulo-tramites-eps">Trámites ante Sunass</h2>
          <ul className="lista-simple">
            {ficha.tramites.map((t) => (
              <li key={t.id}>
                <div>
                  <Link to={`/sunass/expedientes/${encodeURIComponent(t.id)}`}>
                    <strong>{t.titulo}</strong>
                  </Link>
                  <p className="texto-pequeno texto-suave">{t.detalle}</p>
                </div>
                <Chip tono={t.estado.tono}>{t.estado.texto}</Chip>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta" aria-labelledby="titulo-metas">
          <h2 id="titulo-metas">Metas de gestión 2026</h2>
          <ul className="lista-simple lista-simple--metas">
            {ficha.metas.map((m) => (
              <li key={m.meta}>
                <div className="procesos__fila">
                  <span>{m.meta}</span>
                  <strong>{m.avance}</strong>
                </div>
                <Barra usado={m.porcentaje} total={100} tono="marca" etiqueta={`Avance de ${m.meta}`} />
              </li>
            ))}
          </ul>
          <p className="texto-pequeno texto-suave">Datos simulados para la demostración.</p>
        </section>
      </div>
    </div>
  )
}
