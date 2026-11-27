import { Link, Navigate, useSearchParams } from 'react-router'
import { IconoEdificio, IconoFlecha, IconoOjo, IconoPersonas } from '../components/Iconos'
import { MensajeError } from '../components/Mensajes'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { usarEjemplos } from '../services/api'
import { URL_INGRESO_INSTITUCIONAL, entrarConEjemplo } from '../services/sesion'
import { useSesion } from '../sesion/useSesion'
import { INICIO_PERFIL, type Sesion } from '../types/sesion'
import { Gotita } from '../components/Gotita'
import '../styles/entrada.css'

const VISTAS = [
  { icono: <IconoPersonas tamano={18} />, titulo: 'SUNASS da seguimiento', texto: 'Organiza, asigna y evalúa cada expediente' },
  { icono: <IconoEdificio tamano={18} />, titulo: 'La EPS responde', texto: 'Sabe qué le falta y hasta cuándo' },
  { icono: <IconoOjo tamano={18} />, titulo: 'La ciudadanía consulta', texto: 'Ve qué se aprobó y a quién llega' },
]

/** A dónde ir después de ingresar: la página pedida si es de su vista, o su pantalla inicial. */
function destino(sesion: Sesion, volver: string | null) {
  const propia = `/${sesion.perfil}/`
  if (volver && volver.startsWith(propia) && !volver.startsWith('//')) return volver
  return INICIO_PERFIL[sesion.perfil]
}

/** Ondas decorativas del panel de la marca. */
function Ondas() {
  return (
    <svg className="acceso__ondas" viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 120 C120 80 240 160 360 120 S600 80 720 120 V220 H0 Z" fill="rgba(255,255,255,0.05)" />
      <path d="M0 150 C140 110 260 190 380 150 S620 110 720 150 V220 H0 Z" fill="rgba(93,202,165,0.10)" />
      <path d="M0 185 C150 155 270 215 400 185 S630 160 720 185 V220 H0 Z" fill="rgba(93,202,165,0.16)" />
    </svg>
  )
}

/** Ingreso al portal: cada cuenta abre la vista de su perfil (SUNASS o EPS). Ciudadanía no necesita cuenta. */
export function Ingreso() {
  const { estado, sesion } = useSesion()
  const [parametros] = useSearchParams()
  const volver = parametros.get('volver')
  const accesoFallido = parametros.get('acceso') === 'fallido'
  if (estado === 'listo' && sesion) return <Navigate to={destino(sesion, volver)} replace />

  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <div className="entrada">
        <header className="entrada__cabecera">
          <a className="entrada__marca" href="/" aria-label="YakuKhipu, inicio">
            <img src="/logo.png" alt="" width={40} height={40} />
            <span><strong>YakuKhipu</strong><small>Seguimiento de decisiones e inversiones</small></span>
          </a>
          <nav className="entrada__nav" aria-label="Acceso al portal">
            <a href="#como-funciona">Cómo funciona</a>
            <Link to="/ciudadania/decisiones">Consulta pública</Link>
            <a className="entrada__acceso-movil" href={URL_INGRESO_INSTITUCIONAL}>Ingresar <span aria-hidden="true">↗</span></a>
            <Accesibilidad />
          </nav>
        </header>
      <div className="acceso entrada__hero">
        <aside className="acceso__marca" aria-label="Sobre YakuKhipu">
          <div className="entrada__etiqueta"><span aria-hidden="true" /> Información conectada. Decisiones con sustento.</div>
          <div className="acceso__logo entrada__firma">
            <span className="acceso__logo-caja">
              <img src="/logo.png" alt="" width={36} height={36} />
            </span>
            <span>
              <span className="acceso__nombre">YakuKhipu</span>
              <span className="acceso__lema">Seguimiento de decisiones e inversiones</span>
            </span>
          </div>

          <div className="acceso__mensaje">
            <h1 className="acceso__titular">
              Cada decisión sobre el agua, <span>con un camino claro.</span>
            </h1>
            <p className="acceso__texto">Expedientes, documentos y plazos en un solo lugar. Acompaña cada procedimiento y consulta las fuentes que sustentan su seguimiento.</p>

            <div className="entrada__pistas" aria-label="Propósito del portal">
              <span>Documentos con fuentes</span><span>Plazos a la vista</span><span>Historia de cada trámite</span>
            </div>

            <ul className="acceso__vistas">
              {VISTAS.map((v) => (
                <li key={v.titulo}>
                  <span className="acceso__vista-icono" aria-hidden="true">
                    {v.icono}
                  </span>
                  <span>
                    <strong>{v.titulo}</strong>
                    <span>{v.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="entrada__guia">
            <Gotita pose="hola" alto={112} animada={false} />
            <p><strong>Un mismo expediente, una historia completa.</strong><span>La información simulada se identifica como «Simulado».</span></p>
          </div>
          <Ondas />
        </aside>

        <main id="contenido" className="acceso__panel" tabIndex={-1}>
          <div className="acceso__centro">
            <section className="acceso__tarjeta" aria-labelledby="titulo-ingreso">
              <span className="entrada__icono"><IconoPersonas tamano={26} /></span>
              <div>
                <p className="entrada__sobretitulo">TU ESPACIO DE TRABAJO</p>
                <h2 id="titulo-ingreso">Bienvenida, bienvenido</h2>
                <p className="acceso__subtitulo">Continúa con tu cuenta de SUNASS o de tu EPS. Tu perfil te llevará a las tareas que te corresponden.</p>
              </div>

              {volver && !sesion && (
                <p className="mensaje" role="status">
                  Inicia sesión para continuar.
                </p>
              )}

              {accesoFallido && (
                <MensajeError mensaje="No se completó el ingreso. Si tu cuenta ya fue habilitada en YakuKhipu, vuelve a intentarlo." />
              )}

              <div className="acceso__formulario">
                <a className="boton boton--primario acceso__entrar" href={URL_INGRESO_INSTITUCIONAL}>
                  Ingresar al Portal
                  <IconoFlecha tamano={16} />
                </a>
                <p className="entrada__nota">Acceso con tu cuenta habilitada.<br />Tus permisos acompañan cada paso.</p>
              </div>

              {usarEjemplos && (
                <div className="acceso__ejemplo">
                  <p className="texto-pequeno texto-suave">
                    Modo de ejemplos (solo en tu computadora): entra sin cuenta para probar las vistas.
                  </p>
                  <div className="fila-chips">
                    {(['sunass', 'eps'] as const).map((perfil) => (
                      <button
                        key={perfil}
                        type="button"
                        className="boton boton--secundario"
                        onClick={() => {
                          entrarConEjemplo(perfil)
                          window.location.assign(perfil === 'sunass' ? '/sunass/te-toca' : '/eps/tramites')
                        }}
                      >
                        Probar como {perfil === 'sunass' ? 'SUNASS' : 'EPS'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="acceso__alterno">
                <IconoOjo tamano={20} />
                <span>La información pública es para todas las personas.<br /><Link to="/ciudadania/decisiones">Consultar decisiones sin iniciar sesión <span aria-hidden="true">↗</span></Link></span>
              </p>
            </section>

          </div>
        </main>
      </div>
      <section id="como-funciona" className="entrada__procesos" aria-labelledby="titulo-procesos">
        <div className="entrada__introduccion"><p className="entrada__sobretitulo">TRES PROCEDIMIENTOS, UNA MISMA TRAZABILIDAD</p><h2 id="titulo-procesos">Del documento al siguiente paso.</h2><p>Conoce qué se está evaluando y sigue su historia, de acuerdo con tu acceso.</p></div>
        <div className="entrada__tarjetas">
          {[
            { codigo: 'CPI', titulo: 'Cambio del programa de inversiones', texto: 'Sigue la evaluación de las modificaciones propuestas al programa de inversiones.' },
            { codigo: 'UFI', titulo: 'Uso excepcional del fondo', texto: 'Consulta el sustento y el seguimiento de cada solicitud de uso del fondo de inversiones.' },
            { codigo: 'RP', titulo: 'Revisión periódica', texto: 'Ubica los documentos, las etapas y los plazos de la revisión del estudio tarifario.' },
          ].map((proceso) => <article key={proceso.codigo}><span className="entrada__codigo">{proceso.codigo}</span><h3>{proceso.titulo}</h3><p>{proceso.texto}</p><span className="entrada__detalle">Documentos · Etapas · Seguimiento</span></article>)}
        </div>
      </section>
      <footer className="entrada__pie"><span>YakuKhipu · Seguimiento EPS–SUNASS</span><span>Información con fuentes. Evaluación con criterio humano.</span></footer>
      </div>
    </>
  )
}
