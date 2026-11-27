import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Gotita, type PoseGotita } from '../components/Gotita'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { URL_INGRESO_INSTITUCIONAL } from '../services/sesion'
import { Marca } from './Marca'
import { Ingreso } from './Ingreso'
import '../styles/inicio-publico.css'

const PASOS: { titulo: string; texto: string; pose: PoseGotita; color: string }[] = [
  { titulo: 'La EPS pide', texto: 'Solicita usar recursos para una obra.', pose: 'pensando', color: 'naranja' },
  { titulo: 'Sunass evalúa', texto: 'Revisa documentos y si la obra es viable.', pose: 'verificando', color: 'azul' },
  { titulo: 'El Consejo decide', texto: 'Se publica la resolución oficial.', pose: 'atenta', color: 'amarillo' },
  { titulo: 'La obra avanza', texto: 'La EPS reporta el avance para su comunidad.', pose: 'logrado', color: 'verde' },
]

/** Portada pública. Los retornos existentes del login conservan su pantalla de ingreso. */
export function InicioPublico() {
  const [parametros] = useSearchParams()
  return parametros.has('volver') || parametros.has('acceso') ? <Ingreso /> : <PortadaCiudadana />
}

function PortadaCiudadana() {
  const navegar = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  function buscar(e: FormEvent) {
    e.preventDefault()
    navegar(`/ciudadania/decisiones${busqueda.trim() ? `?q=${encodeURIComponent(busqueda.trim())}` : ''}`)
  }
  return <div className="inicio-publico">
    <a className="saltar-contenido" href="#contenido">Saltar al contenido</a>
    <header className="inicio-publico__cabecera">
      <Marca vista="Consulta ciudadana" />
      <nav aria-label="Navegación principal">
        <Link className="inicio-publico__nav-activo" to="/ciudadania/decisiones">Decisiones</Link>
        <a href="#como-funciona">Cómo funciona</a>
        <a className="inicio-publico__login" href={URL_INGRESO_INSTITUCIONAL}>👤 Iniciar sesión</a>
        <Accesibilidad />
      </nav>
    </header>
    <main id="contenido" tabIndex={-1}>
      <section className="inicio-hero inicio-publico__ancho" aria-labelledby="inicio-titulo">
        <div className="inicio-hero__texto">
          <span className="inicio-etiqueta">💧 Sin cuentas ni trámites</span>
          <h1 id="inicio-titulo">¿En qué se invierte el <span>agua de tu ciudad?</span></h1>
          <p>Busca tu empresa de agua y mira qué se aprobó, cuánto avanza y cómo te llega.</p>
          <form className="inicio-buscador" role="search" onSubmit={buscar}>
            <label className="solo-lectores" htmlFor="inicio-busqueda">Buscar por ciudad o empresa de agua</label>
            <span aria-hidden="true">⌕</span>
            <input id="inicio-busqueda" type="search" placeholder="Ej. Tacna, Río Claro, Altiplano" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button type="submit">Buscar</button>
          </form>
          <div className="inicio-lugares">{['Tacna', 'Río Claro', 'Altiplano'].map((lugar) => <Link key={lugar} to={`/ciudadania/decisiones?q=${encodeURIComponent(lugar)}`}>📍 {lugar}</Link>)}</div>
        </div>
        <div className="inicio-hero__yaku">
          <p className="inicio-bocadillo">¡Hola! Soy Yaku 💧<br /><small>Te ayudo a seguir el agua</small></p>
          <Gotita pose="hola" alto={330} />
          <p className="inicio-flotante">✅ <strong>19 935</strong><small>medidores aprobados · ejemplo</small></p>
          <p className="inicio-flotante inicio-flotante--obra">📍 Tacna<small>obra en marcha · ejemplo</small></p>
        </div>
        <svg className="inicio-hero__olas" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35 Q120 0 280 40 T600 30 T1000 45 V80 H0Z" fill="#93d9e9" /><path d="M0 55 Q160 25 350 60 T700 40 T1000 60 V80 H0Z" fill="#6dc4df" /></svg>
      </section>

      <section className="inicio-seccion inicio-publico__ancho" aria-labelledby="inicio-impacto">
        <h2 id="inicio-impacto">¿A quién le llega el agua?</h2><p className="inicio-subtitulo">Por qué estas inversiones importan en los hogares</p>
        <div className="inicio-impacto">
          <article className="inicio-dato inicio-dato--hogares"><span className="inicio-ejemplo">Ejemplo</span><span className="inicio-icono">🏠</span><h3>Hogares con jefatura femenina</h3><div className="inicio-dato__fila"><strong>38 %</strong><span className="inicio-anillo">4 de 10</span></div><p>de los hogares en las zonas priorizadas tienen a una mujer como jefa de hogar.</p><span aria-hidden="true">🏠 🏠 🏠 🏠 ♧ ♧ ♧ ♧ ♧ ♧</span><Gotita pose="hola" alto={75} /></article>
          <article className="inicio-dato inicio-dato--tiempo"><span className="inicio-ejemplo">Ejemplo</span><span className="inicio-icono">🪣</span><h3>Tiempo cargando agua</h3><strong>3 veces más</strong><div className="inicio-barras"><span>mujeres <i /></span><span>hombres <i /></span></div></article>
          <article className="inicio-dato inicio-dato--horas"><span className="inicio-ejemplo">Ejemplo</span><span className="inicio-icono">🚰</span><h3>Horas con servicio</h3><strong>12,4 h <small>de 24</small></strong><div className="inicio-horas" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} className={i < 12 ? 'lleno' : ''} />)}</div></article>
          <article className="inicio-dato inicio-dato--voz"><span className="inicio-ejemplo">Ejemplo</span><span className="inicio-icono">🗣️</span><div><h3>Voz de las mujeres</h3><strong>68 %</strong><p>participan en los comités de agua.</p></div><span aria-hidden="true">👩 👩 👩 👩 👩 👩 👩 ♧ ♧ ♧</span></article>
        </div><p className="inicio-nota">Datos ilustrativos de la demo. No representan indicadores actuales de tu localidad.</p>
      </section>

      <section id="como-funciona" className="inicio-seccion inicio-publico__ancho" aria-labelledby="inicio-como">
        <h2 id="inicio-como">¿Cómo funciona YakuKhipu?</h2><p className="inicio-subtitulo">Como un khipu: cada nudo guarda un paso del trámite</p>
        <div className="inicio-khipu"><div className="inicio-cuerda" aria-hidden="true" /><ol>{PASOS.map((paso, i) => <li key={paso.titulo} className={`inicio-paso inicio-paso--${paso.color}`}><div className="inicio-hilo" aria-hidden="true">●<br />●<br />●</div><Gotita pose={paso.pose} alto={90} /><span className="inicio-numero">{i + 1}</span><h3>{paso.titulo}</h3><p>{paso.texto}</p></li>)}</ol><p className="inicio-nota">💡 En un khipu inca, cada cuerda y cada nudo guardaban un dato. Aquí, cada nudo es un paso del trámite.</p></div>
      </section>

      <section className="inicio-seccion inicio-publico__ancho" aria-labelledby="inicio-comparacion">
        <h2 id="inicio-comparacion">Pedido, decisión y obra</h2><p className="inicio-subtitulo">Lo que se pidió, lo que se aprobó y lo que ya se hizo no siempre es lo mismo</p>
        <div className="inicio-vasos">{[{ numero: '25 000', texto: 'medidores pedidos', etiqueta: '📝 Pedido', nivel: 90, pose: 'pensando' }, { numero: '19 935', texto: 'medidores aprobados', etiqueta: '✅ Decisión', nivel: 70, pose: 'verificando' }, { numero: '4 210', texto: 'medidores instalados', etiqueta: '🔨 Obra · 21 % hecho', nivel: 21, pose: 'avatar-naranja' }].map((dato) => <article key={dato.texto}><Gotita pose={dato.pose as PoseGotita} alto={65} /><div className="inicio-vaso" aria-hidden="true"><div style={{ height: `${dato.nivel}%` }}><span>○ · ○<br />· ○ ·</span></div></div><strong>{dato.numero}</strong><p>{dato.texto}</p><span className="inicio-etiqueta">{dato.etiqueta}</span></article>)}</div><p className="inicio-nota">Ejemplo ilustrativo: el avance de obra debe verificarse con sus documentos de seguimiento.</p>
      </section>

      <section className="inicio-seccion inicio-publico__ancho" aria-labelledby="inicio-procesos"><h2 id="inicio-procesos">Los 3 trámites que seguimos</h2><div className="inicio-procesos">{[{ icono: '🏗️', titulo: 'Cambio del programa de inversiones', texto: 'Cuando la EPS cambia una obra planificada por otra.', pose: 'pensando' }, { icono: '💰', titulo: 'Uso excepcional del fondo', texto: 'Cuando la EPS usa su fondo de reserva para algo urgente.', pose: 'avatar-naranja' }, { icono: '🧾', titulo: 'Revisión periódica de tarifas', texto: 'Cuánto pagas por el agua y por qué.', pose: 'verificando' }].map((p) => <article key={p.titulo}><span className="inicio-icono">{p.icono}</span><h3>{p.titulo}</h3><p>{p.texto}</p><Gotita pose={p.pose as PoseGotita} alto={100} /></article>)}</div></section>

      <section className="inicio-sector" aria-labelledby="inicio-sector"><div className="inicio-publico__ancho"><h2 id="inicio-sector">El agua en el Perú, en números</h2><p className="inicio-subtitulo">Conocer los datos ayuda a seguir las decisiones</p><div className="inicio-sector__tarjetas"><article><span aria-hidden="true">◔</span><strong>41,1 %</strong><p>de ejecución de inversiones en el ejemplo de referencia.</p><span className="inicio-etiqueta">Referencia visual · demo</span></article><article><span aria-hidden="true">⠿</span><strong>16 de 50</strong><p>EPS en nivel crítico de ejecución en el ejemplo.</p><span className="inicio-etiqueta">Referencia visual · demo</span></article><article><span aria-hidden="true">🚰</span><strong>3,3 millones</strong><p>de personas sin acceso al agua por red pública en la referencia.</p><span className="inicio-etiqueta">Referencia visual · demo</span></article></div><p className="inicio-nota">Cifras de la referencia visual; no son indicadores actualizados del portal. Consulta las fuentes vigentes en las decisiones publicadas.</p></div></section>

      <section className="inicio-yaku inicio-publico__ancho" aria-labelledby="inicio-dudas"><Gotita pose="hola" alto={160} /><div><h2 id="inicio-dudas">¿Tienes dudas? Pregúntale a Yaku</h2><p>Consulta una decisión y pregunta con sus fuentes: la resolución, la página y el párrafo.</p><div className="inicio-preguntas">{['¿Qué se decidió en mi localidad?', '¿Cuánto avanzó la obra?', '¿Qué es un fondo de reserva?'].map((q) => <Link key={q} to="/ciudadania/decisiones">{q}</Link>)}</div><Link className="inicio-cta" to="/ciudadania/decisiones">💬 Consultar decisiones y preguntar a Yaku</Link></div></section>
    </main>
    <footer className="inicio-pie"><strong>Proyecto para la hackathon Sunass · Lideresas por el agua</strong><p>Esta plataforma usa datos públicos de agua y saneamiento.</p><Link to="/ciudadania/decisiones">Consulta ciudadana</Link><span> · </span><a href={URL_INGRESO_INSTITUCIONAL}>Acceso institucional</a></footer>
  </div>
}
