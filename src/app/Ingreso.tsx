import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { IconoEdificio, IconoFlecha, IconoOjo, IconoPersonas } from '../components/Iconos'
import { MensajeError } from '../components/Mensajes'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { CLAVE_DEMO, USUARIOS_DEMO } from '../mocks/sesion'
import { usarEjemplos } from '../services/api'
import { URL_INGRESO_INSTITUCIONAL, obtenerEstadoServidor, type ModoIngreso } from '../services/sesion'
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
  const { estado, sesion, ingresar } = useSesion()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const volver = parametros.get('volver')
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null mientras se consulta al servidor si el ingreso es con contraseña o institucional (Keycloak).
  const [modo, setModo] = useState<ModoIngreso | null>(null)
  const accesoFallido = parametros.get('acceso') === 'fallido'

  useEffect(() => {
    let vigente = true
    void obtenerEstadoServidor().then((e) => vigente && setModo(e.ingreso))
    return () => {
      vigente = false
    }
  }, [])

  if (estado === 'listo' && sesion && !enviando) return <Navigate to={destino(sesion, volver)} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!usuario.trim() || !clave) {
      setError('Escribe tu usuario y tu contraseña.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const nueva = await ingresar({ usuario, clave })
      navegar(destino(nueva, volver), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar tu sesión. Inténtalo de nuevo.')
      setEnviando(false)
    }
  }

  function usarCuenta(id: string) {
    setUsuario(id)
    setClave(CLAVE_DEMO)
    setError(null)
  }

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

              {modo === null && <p className="texto-suave" role="status">Preparando el ingreso…</p>}

              {modo === 'oidc' && (
                <div className="acceso__formulario">
                  <p className="texto-suave">
                    Usa tu cuenta institucional. La contraseña se escribe en el servicio de identidad, no en este portal.
                  </p>
                  <a className="boton boton--primario acceso__entrar" href={URL_INGRESO_INSTITUCIONAL}>
                    Ingresar con cuenta institucional
                    <IconoFlecha tamano={16} />
                  </a>
                </div>
              )}

              {modo === 'clave' && <form className="acceso__formulario" onSubmit={enviar} noValidate>
                <label className="campo">
                  Usuario
                  <input
                    type="text"
                    name="usuario"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Ej. sunass-srt"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                  />
                </label>
                <div className="campo">
                  <label htmlFor="clave">Contraseña</label>
                  <div className="acceso__clave">
                    <input
                      id="clave"
                      name="clave"
                      type={verClave ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="acceso__ver"
                      onClick={() => setVerClave((v) => !v)}
                      aria-pressed={verClave}
                      aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <IconoOjo tamano={18} />
                    </button>
                  </div>
                </div>
                {error && <MensajeError mensaje={error} />}
                <button type="submit" className="boton boton--primario acceso__entrar" disabled={enviando}>
                  {enviando ? 'Ingresando…' : 'Ingresar'}
                  <IconoFlecha tamano={16} />
                </button>
              </form>}

              <p className="acceso__alterno">
                ¿Eres ciudadana o ciudadano?{' '}
                <Link to="/ciudadania/decisiones">Consulta las decisiones sin cuenta</Link>
              </p>
            </section>

            {usarEjemplos && (
              <section className="acceso__demo" aria-labelledby="titulo-demo">
                <p id="titulo-demo" className="acceso__demo-titulo">
                  Cuentas de demostración · contraseña <code>{CLAVE_DEMO}</code>
                </p>
                <ul>
                  {USUARIOS_DEMO.map((u) => (
                    <li key={u.usuario_id}>
                      <button
                        type="button"
                        className={`acceso__cuenta${usuario === u.usuario_id ? ' acceso__cuenta--elegida' : ''}`}
                        onClick={() => usarCuenta(u.usuario_id)}
                        aria-pressed={usuario === u.usuario_id}
                      >
                        <span className={`acceso__perfil acceso__perfil--${u.perfil}`}>
                          {u.perfil === 'sunass' ? 'SUNASS' : 'EPS'}
                        </span>
                        {u.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
