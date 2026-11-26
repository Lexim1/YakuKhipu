import { Link, Navigate, useSearchParams } from 'react-router'
import { IconoEdificio, IconoFlecha, IconoOjo, IconoPersonas } from '../components/Iconos'
import { MensajeError } from '../components/Mensajes'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { URL_INGRESO_INSTITUCIONAL } from '../services/sesion'
import { useSesion } from '../sesion/useSesion'
import { INICIO_PERFIL, type Sesion } from '../types/sesion'

const VISTAS = [
  { icono: <IconoPersonas tamano={18} />, titulo: 'Sunass decide', texto: 'Incorpora, valida y resuelve cada expediente' },
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
      <div className="acceso">
        <aside className="acceso__marca" aria-label="Sobre YakuKhipu">
          <div className="acceso__logo">
            <span className="acceso__logo-caja">
              <img src="/logo.png" alt="" width={36} height={36} />
            </span>
            <span>
              <span className="acceso__nombre">YakuKhipu</span>
              <span className="acceso__lema">Seguimiento de decisiones e inversiones</span>
            </span>
          </div>

          <div className="acceso__mensaje">
            <p className="acceso__titular">
              Cada decisión sobre el agua, <span>trazable de principio a fin.</span>
            </p>
            <p className="acceso__texto">Un mismo trámite, tres miradas y siempre con sus fuentes.</p>

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

          <p className="acceso__pie">Datos de demostración · las cifras simuladas se marcan como «Simulado».</p>
          <Ondas />
        </aside>

        <main id="contenido" className="acceso__panel" tabIndex={-1}>
          <div className="acceso__barra">
            <Accesibilidad />
          </div>

          <div className="acceso__centro">
            <section className="acceso__tarjeta" aria-labelledby="titulo-ingreso">
              <div>
                <h1 id="titulo-ingreso">Inicia sesión</h1>
                <p className="acceso__subtitulo">Ingresa con tu cuenta de Sunass o de tu EPS para continuar.</p>
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
                <p className="texto-suave">Usa tu cuenta institucional. La contraseña se escribe en Keycloak.</p>
                <a className="boton boton--primario acceso__entrar" href={URL_INGRESO_INSTITUCIONAL}>
                  Ingresar con cuenta institucional
                  <IconoFlecha tamano={16} />
                </a>
              </div>

              <p className="acceso__alterno">
                ¿Eres ciudadana o ciudadano?{' '}
                <Link to="/ciudadania/decisiones">Consulta las decisiones sin cuenta</Link>
              </p>
            </section>

          </div>
        </main>
      </div>
    </>
  )
}
