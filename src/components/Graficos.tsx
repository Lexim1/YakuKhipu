import { useEffect, useState, type MouseEvent as EventoMouse, type ReactNode } from 'react'
import { Gotita, type PoseGotita } from './Gotita'

// Gráficos ligeros en SVG, sin librerías. Cada uno lleva su descripción en texto (role="img" + aria-label)
// para lectores de pantalla, y las animaciones se apagan si la persona pidió reducir el movimiento.

function prefiereMenosMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Número que sube desde 0 al aparecer. Respeta «reducir movimiento». */
export function ContadorAnimado({ valor, duracion = 900 }: { valor: number; duracion?: number }) {
  const [quieto] = useState(prefiereMenosMovimiento)
  const [actual, setActual] = useState(0)
  useEffect(() => {
    if (quieto) return
    let cuadro = 0
    const inicio = performance.now()
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion)
      setActual(Math.round(valor * (1 - Math.pow(1 - t, 3))))
      if (t < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracion, quieto])
  return <>{(quieto ? valor : actual).toLocaleString('es-PE')}</>
}

type TonoGrafico = 'ok' | 'aviso' | 'peligro' | 'marca' | 'info'

/** Anillo de avance (0–100 %). El texto del centro lo da quien lo usa. */
export function Anillo({
  porcentaje,
  tono = 'marca',
  tamano = 96,
  grosor = 10,
  etiqueta,
  children,
}: {
  porcentaje: number
  tono?: TonoGrafico
  tamano?: number
  grosor?: number
  etiqueta: string
  children?: ReactNode
}) {
  const r = (tamano - grosor) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, porcentaje))
  return (
    <div className="anillo" style={{ width: tamano, height: tamano }} role="img" aria-label={etiqueta}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true">
        <circle className="anillo__pista" cx={tamano / 2} cy={tamano / 2} r={r} strokeWidth={grosor} />
        <circle
          className={`anillo__avance anillo__avance--${tono}`}
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          strokeWidth={grosor}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
      </svg>
      <div className="anillo__centro" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}

/** Área con línea para una serie en el tiempo. */
export function LineaArea({
  puntos,
  etiqueta,
  formato,
  alto = 170,
}: {
  puntos: { x: string; y: number }[]
  etiqueta: string
  formato: (n: number) => string
  alto?: number
}) {
  const ancho = 520
  const margen = { arriba: 28, abajo: 26, izq: 26, der: 26 }
  const maximo = Math.max(...puntos.map((p) => p.y)) * 1.15
  const paso = (ancho - margen.izq - margen.der) / Math.max(1, puntos.length - 1)
  const xy = puntos.map((p, i) => ({
    ...p,
    cx: margen.izq + i * paso,
    cy: margen.arriba + (1 - p.y / maximo) * (alto - margen.arriba - margen.abajo),
  }))
  const linea = xy.map((p, i) => `${i ? 'L' : 'M'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ')
  const area = `${linea} L${xy.at(-1)!.cx.toFixed(1)},${alto - margen.abajo} L${xy[0].cx.toFixed(1)},${alto - margen.abajo} Z`
  const ultimo = xy.at(-1)!
  return (
    <svg className="linea-area" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={etiqueta}>
      <defs>
        <linearGradient id="degradado-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primario)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primario)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#degradado-area)" className="linea-area__relleno" />
      <path d={linea} className="linea-area__linea" pathLength={1} />
      {xy.map((p) => (
        <g key={p.x}>
          <circle cx={p.cx} cy={p.cy} r={p === ultimo ? 5 : 3.2} className="linea-area__punto">
            <title>{`${p.x}: ${formato(p.y)}`}</title>
          </circle>
          <text x={p.cx} y={alto - 8} textAnchor="middle" className="linea-area__eje">
            {p.x}
          </text>
        </g>
      ))}
      <text x={ultimo.cx - 6} y={ultimo.cy - 10} textAnchor="end" className="linea-area__valor">
        {formato(ultimo.y)}
      </text>
    </svg>
  )
}

/** Cuadrícula de puntos: «16 de 50» se ve como 16 puntos marcados de 50. */
export function Puntos({ marcados, total, etiqueta }: { marcados: number; total: number; etiqueta: string }) {
  return (
    <span className="puntos" role="img" aria-label={etiqueta}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`puntos__punto${i < marcados ? ' puntos__punto--marcado' : ''}`} />
      ))}
    </span>
  )
}

type ColorBurbuja = 'menta' | 'cielo' | 'durazno' | 'rosa' | 'lila' | 'limon'

/** Ícono decorativo en burbuja de color. El texto de al lado da el significado. */
export function Burbuja({ emoji, color = 'menta', tamano = 'md' }: { emoji: string; color?: ColorBurbuja; tamano?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`burbuja burbuja--${color} burbuja--${tamano}`} aria-hidden="true">
      {emoji}
    </span>
  )
}

/** Título de sección con su ícono en burbuja. */
export function TituloIcono({
  id,
  emoji,
  color,
  nivel = 2,
  children,
}: {
  id: string
  emoji: string
  color?: ColorBurbuja
  nivel?: 2 | 3
  children: ReactNode
}) {
  const Etiqueta = nivel === 2 ? 'h2' : 'h3'
  return (
    <Etiqueta id={id} className="titulo-icono">
      <Burbuja emoji={emoji} color={color} tamano="sm" />
      <span>{children}</span>
    </Etiqueta>
  )
}

/** Saludo amable de cada espacio, con una gota que flota. */
export function Saludo({
  titulo,
  texto,
  pose = 'hola',
  children,
}: {
  titulo: string
  texto: string
  pose?: PoseGotita
  children?: ReactNode
}) {
  // Yaku mira hacia donde está el mouse: mueve un poco su posición según el cursor.
  function seguir(e: EventoMouse<HTMLElement>) {
    const caja = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', String((e.clientX - caja.left) / caja.width - 0.5))
    e.currentTarget.style.setProperty('--my', String((e.clientY - caja.top) / caja.height - 0.5))
  }
  return (
    <section className="saludo" aria-label="Bienvenida" onMouseMove={seguir}>
      <OlaAnimada />
      <div className="saludo__texto">
        <p className="saludo__titulo">{titulo}</p>
        <p>{texto}</p>
        {children}
      </div>
      <Gotita pose={pose} alto={150} className="saludo__gotita" />
      <span className="saludo__burbujas" aria-hidden="true">
        <i /> <i /> <i />
      </span>
    </section>
  )
}

/** Barras tipo píldora con el porcentaje arriba. */
export function PildorasBarras({
  datos,
  etiqueta,
  bajo,
}: {
  datos: { x: string; pct: number; destacado?: boolean }[]
  etiqueta: string
  /** Por debajo de este porcentaje la barra se pinta en naranja. */
  bajo: number
}) {
  return (
    <ul className="pildoras-barras" role="img" aria-label={etiqueta}>
      {datos.map((d, i) => {
        const clase = d.destacado ? 'destacado' : d.pct < bajo ? 'bajo' : ''
        return (
          <li key={d.x}>
            <span className={`pildoras-barras__pct${d.destacado ? ' pildoras-barras__pct--destacado' : ''}`}>
              {Math.round(d.pct)}%
            </span>
            <span className="pildoras-barras__pista">
              <span
                className={`pildoras-barras__valor${clase ? ` pildoras-barras__valor--${clase}` : ''}`}
                style={{ height: `${Math.min(100, d.pct)}%`, animationDelay: `${i * 60}ms` }}
              />
            </span>
            <span>{d.x}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Dos olas que se desplazan sin fin al pie de un bloque. */
export function OlaAnimada() {
  return (
    <span className="ola-animada" aria-hidden="true">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 C150 0 300 60 450 30 S750 0 900 30 S1200 60 1200 30 V60 H0 Z" />
      </svg>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 C150 60 300 0 450 30 S750 60 900 30 S1200 0 1200 30 V60 H0 Z" />
      </svg>
    </span>
  )
}
