import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { AvisoSimulado } from '../../components/AvisoSimulado'
import { Chip, Fuente } from '../../components/Chip'
import { Dialogo } from '../../components/Dialogo'
import { Gotita } from '../../components/Gotita'
import { Burbuja, Saludo, TituloIcono } from '../../components/Graficos'
import { IconoAtras, IconoCheck, IconoFlecha } from '../../components/Iconos'
import { ACTOS_EXTERNOS } from '../../mocks/seguimiento'
import type { ActoExterno } from '../../types/seguimiento'

/** Actos emitidos fuera del portal (informes, vistos, resoluciones): se consultan y se registran con su evidencia. */
export function ActosExternos() {
  const [registrando, setRegistrando] = useState<ActoExterno | null>(null)

  useContextoAgente({
    espacio: 'Espacio SUNASS · Actos externos',
    preguntas: [
      {
        pregunta: '¿Este portal firma resoluciones?',
        respuesta:
          'No. Las firmas y decisiones de Gerencia General y el Consejo Directivo se emiten fuera del portal. Aquí solo se registra el documento que las sustenta, con su fecha y emisor.',
        fuentes: ['Configuración · quién accede a qué'],
        palabras: ['firma', 'resolucion', 'aprueba'],
      },
    ],
  })

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Seguimiento documental</p>
        <h1>Actos externos</h1>
        <p className="subtitulo">Consulta y registro documental de actos emitidos fuera del portal.</p>
      </div>

      <AvisoSimulado />

      <Saludo
        pose="pensando"
        titulo="🏛️ Lo que se decide fuera del portal"
        texto="Informes, vistos y resoluciones se firman afuera. Aquí guardas su evidencia para que nada se pierda."
      />

      <ul className="lista-tareas">
        {ACTOS_EXTERNOS.map((a, i) => (
          <li key={a.id} className="tarjeta acto acto--vivo">
            <Burbuja emoji={['📜', '🖋️', '🏛️'][i % 3]} color={(['lila', 'cielo', 'durazno'] as const)[i % 3]} tamano="lg" />
            <div className="acto__cuerpo">
              <div className="fila-chips">
                <Chip tono={a.plazo.tono}>{a.plazo.texto}</Chip>
                <span className="texto-pequeno texto-suave">{a.titulo}</span>
              </div>
              <h2 className="acto__decision">{a.decision}</h2>
              <p className="indicador-grande">{a.monto}</p>
            </div>
            <div className="acto__documentos">
              {a.documentos.map((d) => (
                <Fuente key={d}>{d}</Fuente>
              ))}
              {a.resumen && (
                <Link className="boton boton--secundario" to={`/sunass/actos/${encodeURIComponent(a.id)}`}>
                  Ver resumen
                  <IconoFlecha tamano={16} />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div>
        <button type="button" className="boton boton--primario" onClick={() => setRegistrando(ACTOS_EXTERNOS[0])}>
          Registrar acto externo
        </button>
      </div>

      <RegistrarActo acto={registrando} alCerrar={() => setRegistrando(null)} />
    </div>
  )
}

/** Resumen documental de un acto externo: la cifra, cómo cambió y qué documentos lo sustentan. */
export function ResumenActo() {
  const { id = '' } = useParams()
  const acto = ACTOS_EXTERNOS.find((a) => a.id === id)
  const [registrando, setRegistrando] = useState(false)

  if (!acto?.resumen) {
    return (
      <div className="pagina">
        <Link className="enlace-atras" to="/sunass/actos">
          <IconoAtras tamano={16} />
          Actos externos
        </Link>
        <h1>No encontramos este acto externo</h1>
      </div>
    )
  }
  const r = acto.resumen

  return (
    <div className="pagina">
      <Link className="enlace-atras" to="/sunass/actos">
        <IconoAtras tamano={16} />
        Actos externos
      </Link>
      <div className="pagina__cabecera">
        <div>
          <p className="antetitulo">{acto.titulo} · escenario posterior</p>
          <h1>Resumen documental</h1>
        </div>
        <Chip tono={acto.plazo.tono}>{acto.plazo.texto}</Chip>
      </div>

      <AvisoSimulado />

      <div className="tres-columnas">
        <section className="tarjeta tarjeta--destacada-acto" aria-labelledby="titulo-sustento-acto">
          <Gotita pose="logrado" alto={70} className="tarjeta__gotita" />
          <p id="titulo-sustento-acto" className="antetitulo">
            Sustento del acto externo
          </p>
          <p className="indicador-grande">{r.cifra}</p>
          <p className="texto-suave">{r.unidad}</p>
          <p className="indicador-grande" style={{ marginTop: 12 }}>
            {r.monto}
          </p>
          <dl className="lista-datos">
            {r.desglose.map((d) => (
              <div key={d.etiqueta}>
                <dt>{d.etiqueta}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
            <div>
              <dt>Financia</dt>
              <dd>{r.financia}</dd>
            </div>
          </dl>
        </section>

        <section className="tarjeta" aria-labelledby="titulo-cambio-cifra">
          <TituloIcono id="titulo-cambio-cifra" emoji="🔁" color="durazno">
            Cómo cambió la cifra
          </TituloIcono>
          <ol className="historial">
            {r.cambios.map((c, i) => (
              <li key={c.paso} className={i === r.cambios.length - 1 ? 'historial__actual' : undefined}>
                <span className="historial__fecha">{c.paso}</span>
                <div>
                  <p className="historial__titulo">{c.valor}</p>
                  <Fuente>{c.fuente}</Fuente>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="tarjeta" aria-labelledby="titulo-sustento">
          <TituloIcono id="titulo-sustento" emoji="📎" color="menta">
            Sustento
          </TituloIcono>
          <ul className="lista-simple">
            {r.sustento.map((s) => (
              <li key={s}>
                <Fuente>{s}</Fuente>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="fila-chips">
        <Link className="boton boton--secundario" to={`/sunass/expedientes/${encodeURIComponent(acto.tramite_id)}`}>
          Consultar documentos
        </Link>
        <button type="button" className="boton boton--primario" onClick={() => setRegistrando(true)}>
          Registrar acto externo
        </button>
      </div>

      <RegistrarActo acto={registrando ? acto : null} alCerrar={() => setRegistrando(false)} />
    </div>
  )
}

const EJEMPLO = {
  documento: 'RCD 032-2026 · documento del ejemplo',
  fecha: '2026-08-28',
  emisor: 'Consejo Directivo · actuación externa',
}

/**
 * Registro de la evidencia de un acto externo (estados del Figma: vacío, ejemplo, faltan datos y confirmación).
 * Es una simulación: no firma, no aprueba y no escribe en la base de datos.
 */
function RegistrarActo({ acto, alCerrar }: { acto: ActoExterno | null; alCerrar: () => void }) {
  const [documento, setDocumento] = useState('')
  const [fecha, setFecha] = useState('')
  const [emisor, setEmisor] = useState('')
  const [estado, setEstado] = useState<'formulario' | 'faltan' | 'listo'>('formulario')

  function cerrar() {
    setDocumento('')
    setFecha('')
    setEmisor('')
    setEstado('formulario')
    alCerrar()
  }

  function completarEjemplo() {
    setDocumento(EJEMPLO.documento)
    setFecha(EJEMPLO.fecha)
    setEmisor(EJEMPLO.emisor)
    setEstado('formulario')
  }

  function registrar() {
    setEstado(documento && fecha && emisor ? 'listo' : 'faltan')
  }

  return (
    <Dialogo abierto={acto != null} titulo="Registrar acto externo" alCerrar={cerrar}>
      {estado === 'listo' ? (
        <div className="dialogo__cuerpo">
          <p className="mensaje mensaje--exito">
            <IconoCheck tamano={16} /> Evidencia revisada · demostración
          </p>
          <p>
            La simulación conserva la relación entre el documento, su emisor externo y el perfil que registra. No se
            ejecutó una firma, aprobación ni escritura real en la base de datos.
          </p>
          <div className="dialogo__acciones">
            <Link
              className="boton boton--secundario"
              to={`/sunass/expedientes/${encodeURIComponent(acto?.tramite_id ?? '')}`}
              onClick={cerrar}
            >
              Consultar trazabilidad del expediente
            </Link>
            <button type="button" className="boton boton--primario" onClick={cerrar}>
              Volver a actos externos
            </button>
          </div>
        </div>
      ) : (
        <form
          className="dialogo__cuerpo"
          onSubmit={(e) => {
            e.preventDefault()
            registrar()
          }}
        >
          <p>Adjunta el sustento de una actuación ya emitida. Este portal no firma ni aprueba resoluciones.</p>
          <p className="texto-pequeno texto-suave">{acto?.titulo}</p>
          <label className="campo">
            Documento de sustento
            <select value={documento} onChange={(e) => setDocumento(e.target.value)}>
              <option value="">Selecciona el documento incorporado</option>
              <option>{EJEMPLO.documento}</option>
              {acto?.documentos.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            Fecha acreditada
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="campo">
            Emisor externo
            <select value={emisor} onChange={(e) => setEmisor(e.target.value)}>
              <option value="">Selecciona el órgano emisor</option>
              <option>{EJEMPLO.emisor}</option>
              <option>Gerencia General · actuación externa</option>
              <option>Mesa de Partes · actuación externa</option>
            </select>
          </label>
          {estado === 'faltan' && (
            <div className="mensaje mensaje--error" role="alert">
              <p>
                <strong>Faltan datos para registrar.</strong> Selecciona un documento, la fecha acreditada y el órgano
                emisor. El registro debe permitir identificar la fuente y quién la incorporó.
              </p>
            </div>
          )}
          <button type="button" className="boton boton--secundario boton--bloque" onClick={completarEjemplo}>
            Completar con el ejemplo de demostración
          </button>
          <div className="dialogo__acciones">
            <button type="button" className="boton boton--secundario" onClick={cerrar}>
              Cancelar
            </button>
            <button type="submit" className="boton boton--primario">
              Registrar evidencia · demostración
            </button>
          </div>
          <p className="nota">Prototipo: los datos del formulario son simulados y no se guardan en una base de datos.</p>
        </form>
      )}
    </Dialogo>
  )
}
