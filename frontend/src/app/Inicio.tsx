import { Link } from 'react-router'
import { Accesibilidad } from '../components/PanelAccesibilidad'
import { IconoEdificio, IconoFlecha, IconoOjo, IconoPersonas } from '../components/Iconos'
import { Marca } from './Marca'

const VISTAS = [
  {
    ruta: '/sunass/expedientes',
    titulo: 'SUNASS',
    icono: <IconoPersonas />,
    texto:
      'La DRE incorpora y vincula, la especialista valida y decide, y Gerencia y Consejo resuelven. Incluye a quién llega cada inversión.',
    temas: ['Dashboard y alertas', 'Expedientes', 'Impacto social'],
    soloEscritorio: true,
  },
  {
    ruta: '/eps/tramites',
    titulo: 'EPS',
    icono: <IconoEdificio />,
    texto: 'Responde a Sunass y sigue sus trámites desde el celular.',
    temas: ['Mis trámites', 'Siguiente paso', 'Seguimiento'],
    soloEscritorio: false,
  },
  {
    ruta: '/ciudadania/decisiones',
    titulo: 'Ciudadanía',
    icono: <IconoOjo />,
    texto: 'Consulta en lenguaje simple qué se aprobó, qué falta ejecutar y a quién llega cada inversión.',
    temas: ['Consulta pública', 'Ficha de la decisión', 'A quién llega'],
    soloEscritorio: false,
  },
]

const PASOS = [
  { titulo: 'EPS', texto: 'Presenta su documento por Mesa de Partes' },
  { titulo: 'DRE · SUNASS', texto: 'Incorpora el archivo y confirma el trámite' },
  { titulo: 'Asistente', texto: 'Propone datos y cambios citando la página' },
  { titulo: 'Especialista · SUNASS', texto: 'Valida o corrige y decide qué requerir' },
  { titulo: 'EPS y ciudadanía', texto: 'La EPS ve qué le falta; la ciudadanía, lo aprobado y a quién llega' },
]

/** Pantalla de ingreso: elegir la vista. El perfil es simulado hasta conectar la sesión. */
export function Inicio() {
  return (
    <>
      <header className="cabecera">
        <Marca vista="Seguimiento de decisiones e inversiones" />
        <div className="cabecera__espacio" />
        <Accesibilidad />
      </header>
      <main id="contenido" className="publico">
        <div className="pagina ingreso">
          <div>
            <h1>
              <span className="ingreso__titulo-escritorio">¿Con qué vista ingresas?</span>
              <span className="ingreso__titulo-movil">Elige tu vista</span>
            </h1>
            <p className="subtitulo ingreso__titulo-escritorio">
              Tres vistas, un mismo trámite: Sunass decide, la EPS responde y la ciudadanía consulta.
            </p>
            <p className="subtitulo ingreso__titulo-movil">
              Desde el celular: la EPS responde y la ciudadanía consulta. La vista SUNASS se usa en computadora.
            </p>
          </div>

          <section aria-labelledby="titulo-vistas">
            <h2 id="titulo-vistas" className="ingreso__etiqueta">
              Elige tu vista
            </h2>
            <ul className="vistas">
              {VISTAS.map((vista) => (
                <li key={vista.ruta} className={`tarjeta vista${vista.soloEscritorio ? ' vista--escritorio' : ''}`}>
                  <div className="vista__cabecera">
                    <span className="icono-caja">{vista.icono}</span>
                    <h3>{vista.titulo}</h3>
                  </div>
                  <p className="texto-pequeno">{vista.texto}</p>
                  <ul className="etiquetas" aria-label={`Qué incluye la vista ${vista.titulo}`}>
                    {vista.temas.map((tema) => (
                      <li key={tema} className="etiqueta">
                        {tema}
                      </li>
                    ))}
                  </ul>
                  <Link className="boton boton--primario vista__boton" to={vista.ruta}>
                    Entrar <span className="solo-lectores">a la vista {vista.titulo}</span>
                    <IconoFlecha tamano={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="titulo-conexion" className="ingreso__titulo-escritorio">
            <h2 id="titulo-conexion" className="ingreso__etiqueta">
              Cómo se conectan: un mismo trámite, de principio a fin
            </h2>
            <ol className="pasos-ingreso">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="paso-ingreso">
                  <strong>
                    {i + 1}. {paso.titulo}
                  </strong>
                  <span>{paso.texto}</span>
                </li>
              ))}
            </ol>
          </section>

          <p className="texto-suave texto-pequeno">
            Datos de demostración. Los documentos de ejemplo se basan en expedientes reales; las cifras simuladas se
            marcan como «Simulado».
          </p>
        </div>
      </main>
    </>
  )
}
