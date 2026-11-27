import { useState } from 'react'
import { Link } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip } from '../../components/Chip'
import { Anillo, Burbuja, Saludo, TituloIcono } from '../../components/Graficos'
import { FICHAS_EPS } from '../../mocks/seguimiento'

const EMOJIS = ['💧', '🛠️', '📈', '🏘️']
const COLORES = ['cielo', 'durazno', 'menta', 'lila'] as const

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

      <Saludo
        pose="hola"
        titulo={`🏢 Así va ${ficha.nombre}`}
        texto="Sus indicadores, sus trámites ante Sunass y sus metas, en un solo lugar."
      />

      <ul className="cuatro-columnas resumen-bandeja">
        {ficha.indicadores.map((i, n) => (
          <li key={i.etiqueta} className="tarjeta resumen-bandeja__tarjeta kpi-vivo">
            <Burbuja emoji={EMOJIS[n % EMOJIS.length]} color={COLORES[n % COLORES.length]} />
            <span className="texto-pequeno">{i.etiqueta}</span>
            <strong className="indicador-grande">{i.valor}</strong>
            <span className="texto-pequeno texto-suave">{i.detalle}</span>
          </li>
        ))}
      </ul>

      <div className="dos-columnas">
        <section className="tarjeta" aria-labelledby="titulo-tramites-eps">
          <TituloIcono id="titulo-tramites-eps" emoji="📂" color="cielo">
            Trámites ante Sunass
          </TituloIcono>
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
          <TituloIcono id="titulo-metas" emoji="🎯" color="limon">
            Metas de gestión 2026
          </TituloIcono>
          <ul className="metas-anillos">
            {ficha.metas.map((m) => (
              <li key={m.meta}>
                <Anillo
                  porcentaje={m.porcentaje}
                  tono={m.porcentaje >= 75 ? 'ok' : m.porcentaje >= 40 ? 'marca' : 'aviso'}
                  tamano={84}
                  grosor={9}
                  etiqueta={`Avance de ${m.meta}: ${m.avance}`}
                >
                  <strong>{Math.round(m.porcentaje)}%</strong>
                </Anillo>
                <span>{m.meta}</span>
                <span className="texto-pequeno texto-suave">{m.avance}</span>
              </li>
            ))}
          </ul>
          <p className="texto-pequeno texto-suave">Datos simulados para la demostración.</p>
        </section>
      </div>
    </div>
  )
}
