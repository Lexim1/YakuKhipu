import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip } from '../../components/Chip'
import { ACCESOS, REGLAS_PLAZO } from '../../mocks/seguimiento'

/** Plazos, calendario y accesos por perfil (solo Jefatura DRE). Hoy es una consulta: no guarda cambios. */
export function Configuracion() {
  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Sistema</p>
        <h1>Configuración</h1>
        <p className="subtitulo">Plazos, calendario y accesos por perfil. Cambiar una regla no exige programar.</p>
      </div>

      <AvisoSimulado texto=" Las reglas que usa el servidor para calcular plazos siguen pendientes de validación por la DRE." />

      <section aria-labelledby="titulo-plazos-config" className="columna">
        <h2 id="titulo-plazos-config">Plazos por procedimiento</h2>
        <div className="tabla-expedientes">
          <table>
            <thead>
              <tr>
                <th scope="col">Procedimiento</th>
                <th scope="col">Base normativa</th>
                <th scope="col">Plazo máximo</th>
                <th scope="col">Alerta «por vencer»</th>
              </tr>
            </thead>
            <tbody>
              {REGLAS_PLAZO.map((r) => (
                <tr key={r.procedimiento}>
                  <td>
                    <strong>{r.procedimiento}</strong>
                  </td>
                  <td>{r.base}</td>
                  <td>{r.plazo}</td>
                  <td>{r.alerta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tarjeta fila-chips" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Calendario del prototipo</strong>
            <p className="texto-pequeno texto-suave">Validar feriados y notificación para cada cómputo.</p>
          </div>
          <Chip tono="agente">Demo</Chip>
        </div>
      </section>

      <section aria-labelledby="titulo-accesos" className="columna">
        <h2 id="titulo-accesos">Quién accede a qué</h2>
        <div className="tabla-expedientes">
          <table>
            <thead>
              <tr>
                <th scope="col">Perfil</th>
                <th scope="col">Ámbito</th>
                <th scope="col">Trazabilidad</th>
                <th scope="col">Acciones en el portal</th>
                <th scope="col">Configuración</th>
              </tr>
            </thead>
            <tbody>
              {ACCESOS.map((a) => (
                <tr key={a.perfil}>
                  <td>
                    <strong>{a.perfil}</strong>
                  </td>
                  <td>{a.ambito}</td>
                  <td>{a.trazabilidad}</td>
                  <td>{a.acciones}</td>
                  <td>
                    <Chip tono={a.configuracion === 'Administra' ? 'ok' : 'neutro'}>{a.configuracion}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tarjeta">
          <strong>Participan en el procedimiento, sin cuenta en este portal</strong>
          <p className="texto-pequeno texto-suave">
            Mesa de Partes, OAJ, DU, ODS, Gerencia General y Consejo Directivo figuran como emisores o responsables de
            actuaciones documentadas. El portal no ejecuta sus firmas ni sus decisiones.
          </p>
        </div>
      </section>
    </div>
  )
}
