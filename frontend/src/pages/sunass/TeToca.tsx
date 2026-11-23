import { Link } from 'react-router'
import { useAgente, useContextoAgente } from '../../agente/useAgente'
import { Chip, type Tono } from '../../components/Chip'
import { IconoChispa, IconoEnlace, IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { obtenerBandeja, useVersionTramites } from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import type { AvisoAgente, BandejaTareas, Tarea, UrgenciaTarea } from '../../types/tramite'

const URGENCIA: Record<UrgenciaTarea, { tono: Tono; texto: string; orden: number }> = {
  hoy: { tono: 'aviso', texto: 'Hoy', orden: 0 },
  por_vencer: { tono: 'aviso', texto: 'Por vencer', orden: 1 },
  en_plazo: { tono: 'ok', texto: 'En plazo', orden: 2 },
}

const AVISO: Record<AvisoAgente['tipo'], { tono: Tono; texto: string }> = {
  cifra_sin_documento: { tono: 'aviso', texto: 'Cifra sin documento' },
  vinculo_propuesto: { tono: 'agente', texto: 'Vínculo propuesto' },
  por_vencer: { tono: 'info', texto: 'Plazo próximo' },
  vencido: { tono: 'peligro', texto: 'Plazo vencido' },
  documento_por_asociar: { tono: 'agente', texto: 'Documento por asociar' },
  dos_numeraciones: { tono: 'info', texto: 'Dos numeraciones' },
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

function TarjetaTarea({ tarea }: { tarea: Tarea }) {
  const urgencia = URGENCIA[tarea.urgencia]
  const principal = tarea.tipo === 'validar'
  return (
    <li className="tarjeta tarea">
      <div className="tarea__cuerpo">
        <div className="fila-chips">
          <Chip tono={urgencia.tono}>{urgencia.texto}</Chip>
          <span className="texto-pequeno texto-suave">
            {tarea.tramite_id} · {tarea.eps} · {tarea.etapa}
          </span>
        </div>
        <h3 className="tarea__titulo">{tarea.titulo}</h3>
        <p className="texto-suave">{tarea.detalle}</p>
      </div>
      <Link className={`boton ${principal ? 'boton--primario' : 'boton--secundario'}`} to={tarea.destino}>
        {tarea.boton}
        <span className="solo-lectores">: {tarea.titulo}</span>
        {principal ? <IconoEnlace tamano={16} /> : <IconoFlecha tamano={16} />}
      </Link>
    </li>
  )
}

function Resumen({ bandeja }: { bandeja: BandejaTareas }) {
  const expedientes = [...new Set(bandeja.tareas.map((t) => t.tramite_id))]
  const porValidar = bandeja.tareas.filter((t) => t.tipo === 'validar').length
  const tarjetas = [
    {
      etiqueta: 'Acciones de hoy',
      valor: bandeja.tareas.length,
      detalle: expedientes.length > 0 ? `En ${expedientes.join(', ')}` : 'Sin acciones pendientes',
      tono: '',
    },
    { etiqueta: 'Por vencer', valor: bandeja.por_vencer.total, detalle: bandeja.por_vencer.detalle, tono: 'aviso' },
    {
      etiqueta: 'Por validar',
      valor: porValidar,
      detalle: porValidar > 0 ? 'Vínculo propuesto por el agente' : 'Nada por validar',
      tono: 'agente',
    },
    {
      etiqueta: 'Expedientes asignados',
      valor: bandeja.expedientes_asignados.total,
      detalle: bandeja.expedientes_asignados.detalle,
      tono: '',
    },
  ]
  return (
    <ul className="cuatro-columnas resumen-bandeja">
      {tarjetas.map((t) => (
        <li key={t.etiqueta} className="tarjeta resumen-bandeja__tarjeta">
          <p className="texto-suave">{t.etiqueta}</p>
          <p className={`indicador__valor${t.tono ? ` indicador__valor--${t.tono}` : ''}`}>{t.valor}</p>
          <p className="texto-pequeno texto-suave">{t.detalle}</p>
        </li>
      ))}
    </ul>
  )
}

/** «Te toca actuar»: acciones pendientes del perfil actual, ordenadas por urgencia. */
export function TeToca() {
  const versionDatos = useVersionTramites()
  const [resultado, reintentar] = useConsulta((signal) => obtenerBandeja(signal), [versionDatos])
  const { abrir } = useAgente()

  useContextoAgente({
    espacio: 'Espacio SUNASS · Te toca actuar',
    preguntas: [
      {
        pregunta: '¿Por dónde empiezo hoy?',
        respuesta:
          'Por validar el vínculo del Oficio 1628 en CPI-2026-0007: el agente propone que responde al Oficio 156 y, mientras no se valide, el documento sigue por asociar.',
        fuentes: ['Oficio 1628 · pág. 1'],
        palabras: ['empiezo', 'primero', 'urgente', 'hoy'],
      },
      {
        pregunta: '¿Qué cifra no tiene documento?',
        respuesta:
          'Los 19 935 medidores de EPS Tacna llegaron por correo el 20 de agosto y el correo no consta en el expediente. Pide que lo formalicen por Mesa de Partes.',
        fuentes: ['Correo del 20 ago', 'RCD 032 · nota 9'],
        palabras: ['cifra', 'documento', 'correo'],
      },
    ],
  })

  return (
    <div className="pagina">
      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando tus acciones…">
        {(bandeja) => {
          const tareas = [...bandeja.tareas].sort((a, b) => URGENCIA[a.urgencia].orden - URGENCIA[b.urgencia].orden)
          const expedientes = new Set(tareas.map((t) => t.tramite_id)).size
          return (
            <>
              <div>
                <p className="antetitulo">{bandeja.cargo}</p>
                <h1>Te toca actuar</h1>
                <p className="subtitulo">
                  {tareas.length > 0
                    ? `Tienes ${plural(tareas.length, 'acción', 'acciones')} en ${plural(expedientes, 'expediente', 'expedientes')}. Empieza por la más urgente.`
                    : 'No tienes acciones pendientes.'}
                </p>
              </div>

              <Resumen bandeja={bandeja} />

              <div className="dos-columnas">
                <section aria-labelledby="titulo-tareas" className="columna">
                  <h2 id="titulo-tareas">Te toca actuar</h2>
                  {tareas.length === 0 ? (
                    <SinResultados titulo="Estás al día">
                      <p className="texto-suave">Cuando te asignen un documento o una validación, aparecerá aquí.</p>
                    </SinResultados>
                  ) : (
                    <ul className="lista-tareas">
                      {tareas.map((t) => (
                        <TarjetaTarea key={t.id} tarea={t} />
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="titulo-avisos" className="columna">
                  <h2 id="titulo-avisos">Avisos del agente</h2>
                  <div className="tarjeta avisos-agente">
                    {bandeja.avisos.length === 0 ? (
                      <p className="texto-suave">El agente no tiene avisos nuevos.</p>
                    ) : (
                      <ul className="avisos-agente__lista">
                        {bandeja.avisos.map((a) => (
                          <li key={a.id}>
                            <Chip tono={AVISO[a.tipo].tono}>{AVISO[a.tipo].texto}</Chip>
                            <p>{a.texto}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className="boton boton--secundario boton--bloque" onClick={() => abrir()}>
                      Preguntar al agente
                      <IconoChispa tamano={16} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )
        }}
      </Contenido>
    </div>
  )
}
