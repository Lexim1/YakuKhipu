import { Link, useSearchParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Barra } from '../../components/Barra'
import { Chip } from '../../components/Chip'
import { IconoFlecha } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { listarExpedientes } from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import { NOMBRE_PROCEDIMIENTO, type Procedimiento, type Situacion, type TramiteResumen } from '../../types/tramite'
import { SEMAFORO, textoDias } from './semaforo'

const ORDEN: Record<Situacion, number> = { vencido: 0, por_vencer: 1, en_plazo: 2, pendiente_de_validacion: 3, concluido: 4 }

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Más urgentes primero: vencidos, por vencer y en plazo. Dentro de cada grupo se respeta el orden de la API. */
function ordenarPorUrgencia(items: TramiteResumen[]) {
  return [...items].sort((a, b) => ORDEN[a.plazo.situacion] - ORDEN[b.plazo.situacion])
}

export function Expedientes() {
  const [resultado, reintentar] = useConsulta((signal) => listarExpedientes(signal), [])
  const [parametros, setParametros] = useSearchParams()
  const procedimiento = parametros.get('procedimiento') ?? ''
  const situacion = parametros.get('situacion') ?? ''
  const q = parametros.get('q') ?? ''

  useContextoAgente({
    espacio: 'Espacio SUNASS · Expedientes',
    preguntas: [
      {
        pregunta: '¿Qué expedientes atiendo primero?',
        respuesta:
          'Dos están vencidos: RP-2025-0001 (EPS Selva Alta, 64 de 60 días hábiles en aprobación) y CPI-2026-0004 (EPS Manantial, 37 de 30, en Gerencia General). Luego vienen RP-2026-0002 y UFI-2026-0001, que pasaron el 75 % de su plazo.',
        fuentes: ['Bitácora del expediente'],
        palabras: ['primero', 'urgente', 'vencid'],
      },
    ],
  })

  function cambiar(nombre: string, valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (valor && nuevos.get(nombre) !== valor) nuevos.set(nombre, valor)
    else nuevos.delete(nombre)
    setParametros(nuevos, { replace: true })
  }

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Coordinación DRE</p>
        <h1>Expedientes</h1>
        {resultado.estado === 'listo' && (
          <p className="subtitulo">
            {resultado.datos.items.filter((t) => t.plazo.situacion !== 'concluido').length} en trámite · ordenados por
            urgencia
          </p>
        )}
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando expedientes…">
        {({ items }) => {
          const contar = (s: Situacion) => items.filter((t) => t.plazo.situacion === s).length
          const busqueda = normalizar(q.trim())
          const visibles = ordenarPorUrgencia(
            items.filter(
              (t) =>
                (!procedimiento || t.procedimiento === procedimiento) &&
                (!situacion || t.plazo.situacion === situacion) &&
                (!busqueda || normalizar(`${t.id} ${t.eps} ${t.etapa}`).includes(busqueda)),
            ),
          )
          return (
            <>
              <div className="pastillas" role="group" aria-label="Filtrar expedientes">
                <button
                  type="button"
                  className="pastilla"
                  aria-pressed={!procedimiento}
                  onClick={() => cambiar('procedimiento', '')}
                >
                  Todos
                </button>
                {(Object.keys(NOMBRE_PROCEDIMIENTO) as Procedimiento[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="pastilla"
                    aria-pressed={procedimiento === p}
                    onClick={() => cambiar('procedimiento', p)}
                  >
                    {NOMBRE_PROCEDIMIENTO[p]}
                  </button>
                ))}
                <span className="pastillas__separador" aria-hidden="true" />
                {(['vencido', 'por_vencer', 'en_plazo'] as Situacion[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip chip--${SEMAFORO[s].tono}`}
                    aria-pressed={situacion === s}
                    onClick={() => cambiar('situacion', s)}
                  >
                    {s === 'vencido' ? 'Vencidos' : SEMAFORO[s].texto} {contar(s)}
                  </button>
                ))}
              </div>

              {q && (
                <p className="texto-suave" aria-live="polite">
                  Resultados para «{q}».{' '}
                  <button type="button" className="enlace-boton" onClick={() => cambiar('q', '')}>
                    Quitar búsqueda
                  </button>
                </p>
              )}

              {items.some((t) => t.simulado) && <AvisoSimulado />}

              {visibles.length === 0 ? (
                <SinResultados titulo="No hay expedientes con estos filtros">
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => setParametros({}, { replace: true })}
                  >
                    Quitar filtros
                  </button>
                </SinResultados>
              ) : (
                <div className="tabla-expedientes">
                  <table>
                    <caption className="solo-lectores">Expedientes ordenados por urgencia</caption>
                    <thead>
                      <tr>
                        <th scope="col">Expediente</th>
                        <th scope="col">EPS</th>
                        <th scope="col">Etapa · responsable</th>
                        <th scope="col">Plazo (días hábiles)</th>
                        <th scope="col">Semáforo</th>
                        <th scope="col">
                          <span className="solo-lectores">Acción</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((t) => {
                        const s = SEMAFORO[t.plazo.situacion]
                        const completo = t.id === 'CPI-2026-0007'
                        return (
                          <tr key={t.id}>
                            <td>
                              <strong>{t.id}</strong>
                              <span className="celda__detalle">{NOMBRE_PROCEDIMIENTO[t.procedimiento]}</span>
                            </td>
                            <td>
                              <strong>{t.eps}</strong>
                              <span className="celda__detalle">{t.tamano_eps}</span>
                            </td>
                            <td>
                              <strong>{t.etapa}</strong>
                              <span className="celda__detalle">{t.responsable}</span>
                            </td>
                            <td>
                              <span className={`celda__plazo celda__plazo--${t.plazo.situacion}`}>
                                {textoDias(t.plazo)}
                              </span>
                              <Barra
                                usado={t.plazo.dias_usados}
                                total={t.plazo.dias_totales}
                                tono={s.barra}
                                etiqueta={`Plazo de ${t.id}`}
                              />
                            </td>
                            <td>
                              <Chip tono={s.tono}>{s.texto}</Chip>
                            </td>
                            <td>
                              <Link
                                className="boton boton--secundario"
                                to={`/sunass/expedientes/${encodeURIComponent(t.id)}`}
                              >
                                {completo ? 'Abrir' : 'Ver'}
                                <span className="solo-lectores"> {t.id}</span>
                                {completo && <IconoFlecha tamano={16} />}
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="nota">
                Alerta interna desde el 75 %. En revisión periódica se mide la etapa activa. Cada ajuste de plazo
                requiere sustento en el expediente.
              </p>
            </>
          )
        }}
      </Contenido>
    </div>
  )
}
