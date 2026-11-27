import { useId, useState, type CSSProperties } from 'react'
import { Gotita } from '../../components/Gotita'
import { Anillo } from '../../components/Graficos'
import { Chip } from '../../components/Chip'
import '../../styles/impacto-social-eps.css'

/** Escenario didáctico independiente de los registros financieros y de las alertas del servidor. */
export function ImpactoSocialEps({ eps }: { eps: string }) {
  const [dias, setDias] = useState(8)
  const id = useId()
  const nivel = dias < 7 ? 'manejable' : dias < 15 ? 'alerta' : 'critico'
  const textoNivel = nivel === 'critico' ? 'Crítico' : nivel === 'alerta' ? 'Alerta' : 'Manejable'
  const hogares = Math.round(7450 * Math.min(dias / 8, 1))
  const horas = Math.min(6, .7 + .35 * dias)
  const higiene = nivel === 'critico' ? 'Déficit crítico' : nivel === 'alerta' ? 'Disponibilidad limitada' : 'Atención preventiva'
  const pose = nivel === 'critico' ? 'plazo-rojo' : nivel === 'alerta' ? 'plazo-naranja' : 'logrado'
  const posicion = (dias - 1) / 29 * 100
  const numero = (n: number) => new Intl.NumberFormat('es-PE').format(n)

  return <section className={`impacto-eps impacto-eps--${nivel}`} aria-labelledby={`${id}-titulo`}>
    <header className="impacto-eps__cabecera">
      <span className="impacto-eps__icono" aria-hidden="true">👪</span>
      <div><div className="impacto-eps__titulo"><h2 id={`${id}-titulo`}>Impacto social y equidad de género</h2><Chip tono="agente">Simulación</Chip></div>
        <p>¿Qué pasa en los hogares más vulnerables si el servicio se corta o un proyecto se retrasa?</p></div>
    </header>
    <div className="impacto-eps__contexto"><p>Escenario de práctica en la ficha de <strong>{eps}</strong>. Los valores ilustrativos no se calculan a partir de sus datasets.</p><span>🌊 Escenario: crisis hídrica</span></div>

    <div className="impacto-eps__control">
      <div className="impacto-eps__deslizador">
        <label htmlFor={`${id}-dias`}>¿Cuántos días sin agua o de retraso?</label>
        <p id={`${id}-ayuda`}>Mueve el control o usa las flechas del teclado para explorar el escenario.</p>
        <div className="impacto-eps__rango" style={{ '--posicion-impacto': `${posicion}%` } as CSSProperties}>
          <output htmlFor={`${id}-dias`} className="impacto-eps__dia">Día {dias}</output>
          <input id={`${id}-dias`} type="range" min={1} max={30} step={1} value={dias}
            aria-describedby={`${id}-ayuda`} aria-valuetext={`${dias} días, nivel ${textoNivel}`}
            onChange={(e) => setDias(Number(e.target.value))} />
        </div>
        <div className="impacto-eps__marcas" aria-hidden="true"><span>1 día</span><span>7 días</span><span>15 días</span><span>30 días o más</span></div>
        <div className="impacto-eps__leyenda"><span>🟢 Manejable: 1–6</span><span>🟡 Alerta: 7–14</span><span>🔴 Crítico: 15–30</span></div>
      </div>
      <div className="impacto-eps__nivel" role="status" aria-live="polite">
        <Gotita pose={pose} alto={115} /><strong>Nivel: {textoNivel}</strong>
        <p>{nivel === 'critico' ? 'El escenario muestra una carga sostenida en el hogar.' : nivel === 'alerta' ? 'Desde el día 7 aumenta la carga del escenario.' : 'Planificar a tiempo ayuda a reducir el impacto.'}</p>
      </div>
    </div>

    <div className="impacto-eps__tarjetas">
      <article className="impacto-eps__hogares"><span className="impacto-eps__icono" aria-hidden="true">🏠</span><Gotita pose={nivel === 'critico' ? 'avatar-rojo' : 'avatar-naranja'} alto={75} />
        <h3>Hogares afectados</h3><strong className="impacto-eps__cifra" data-testid="impacto-hogares">{numero(hogares)}</strong>
        <p>hogares del escenario donde <strong>la mujer asume el abastecimiento</strong>. La interrupción puede aumentar las tareas de acarreo y cuidado.</p>
        <div className="impacto-eps__casas" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <span key={i} className={i >= Math.round(hogares / 7450 * 20) ? 'sin-impacto' : ''}>🏠</span>)}</div>
        <small>Datos ficticios de práctica · sin estimación oficial</small>
      </article>
      <article className="impacto-eps__acarreo"><span className="impacto-eps__icono" aria-hidden="true">🪣</span><h3>Tiempo de acarreo</h3>
        <div className="impacto-eps__tiempo"><Anillo porcentaje={horas / 6 * 100} tono="aviso" tamano={75} etiqueta="Tiempo adicional ilustrativo respecto del máximo de seis horas"><span>⏱️</span></Anillo><div><strong className="impacto-eps__cifra" data-testid="impacto-horas">+{horas.toLocaleString('es-PE', { maximumFractionDigits: 1 })} h</strong><span>más cada día</span></div></div>
        <p>En este escenario, buscar agua añade desplazamientos y carga física a las tareas del hogar.</p><div className="impacto-eps__etiquetas"><span>🚶 a pie</span><span>🚚 cisterna</span><span>⛰️ cuesta arriba</span></div>
      </article>
      <article className="impacto-eps__higiene"><span className="impacto-eps__icono" aria-hidden="true">🧼</span><h3>Higiene y tareas del hogar</h3><strong className="impacto-eps__deficit">{higiene}</strong>
        <p>La falta de agua puede dificultar cocinar, asear y cuidar a niños, personas mayores y otros miembros del hogar.</p>
        <div className="impacto-eps__semaforo" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i > (nivel === 'critico' ? 4 : nivel === 'alerta' ? 2 : 0) ? 'inactivo' : ''} />)}</div><div className="impacto-eps__extremos"><span>Menor impacto</span><span>Crítico</span></div>
        <div className="impacto-eps__etiquetas"><span>🍲 cocinar</span><span>🛁 aseo</span><span>👶 cuidado</span></div>
      </article>
    </div>
    <div className="impacto-eps__prevencion"><Gotita pose="logrado" alto={110} /><div><h3>¡Evitar este impacto es posible! 💪</h3><p>La planificación y el seguimiento oportunos ayudan a reducir el riesgo para las familias más vulnerables.</p></div><div className="impacto-eps__poblacion"><strong>12 500</strong><span>personas del escenario</span></div></div>
    <p className="impacto-eps__nota">Cifras de un escenario simulado para la demo; no son datos reales ni alertas operativas de la EPS.</p>
    <details className="impacto-eps__supuestos"><summary>Ver supuestos de la simulación</summary><p>Ejercicio ilustrativo, sin modelo predictivo validado: hogares = 7 450 × mínimo(días / 8, 1); tiempo adicional diario = mínimo(6, 0,7 + 0,35 × días) horas. Población fija de ejemplo: 12 500 personas. Los niveles cambian en los días 7 y 15. No se atribuyen estas cifras a INEI o Sunass y no se guardan en los expedientes.</p></details>
  </section>
}
