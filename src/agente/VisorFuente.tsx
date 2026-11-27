import { Chip } from '../components/Chip'
import { IconoAtras, IconoDocumento } from '../components/Iconos'
import { Cargando, MensajeError } from '../components/Mensajes'
import { abrirFuente, enlacePdf, type FuenteCita } from '../services/asistente'
import { useConsulta } from '../services/useConsulta'

const VALIDACION: Record<string, { tono: 'ok' | 'aviso' | 'info'; texto: string }> = {
  verificado: { tono: 'ok', texto: 'Verificado' },
  validado: { tono: 'ok', texto: 'Verificado' },
  por_validar: { tono: 'aviso', texto: 'Por validar' },
  pendiente: { tono: 'aviso', texto: 'Por validar' },
}

/** Resalta el fragmento citado dentro del texto de la página, aunque cambien los espacios o saltos de línea. */
function TextoConCita({ texto, extracto }: { texto: string; extracto: string }) {
  // El backend puede recortar el extracto con «…»: se busca solo el texto real.
  const palabras = extracto.trim().replace(/^(…|\.\.\.)\s*/, '').replace(/\s*(…|\.\.\.)$/, '').split(/\s+/).filter(Boolean)
  const patron = palabras.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
  const encontrado = patron ? new RegExp(patron).exec(texto) : null
  if (!encontrado) return <p className="visor__texto">{texto}</p>
  const inicio = encontrado.index
  const fin = inicio + encontrado[0].length
  return (
    <p className="visor__texto">
      {texto.slice(0, inicio)}
      <mark>{texto.slice(inicio, fin)}</mark>
      {texto.slice(fin)}
    </p>
  )
}

/** Muestra la página que citó el agente, dentro del mismo panel. */
export function VisorFuente({ cita, alVolver }: { cita: FuenteCita; alVolver: () => void }) {
  const enlace = cita.enlace ?? ''
  const [resultado, reintentar] = useConsulta((signal) => abrirFuente(enlace, signal), [enlace])

  return (
    <div className="visor">
      <button type="button" className="enlace-atras visor__volver" onClick={alVolver}>
        <IconoAtras tamano={16} />
        Volver a la conversación
      </button>

      {resultado.estado === 'cargando' && <Cargando texto="Abriendo la fuente…" />}
      {resultado.estado === 'error' && <MensajeError mensaje={resultado.mensaje} reintentar={reintentar} />}
      {resultado.estado === 'listo' &&
        (() => {
          const doc = resultado.datos
          const validacion = VALIDACION[doc.estado_validacion]
          const paginas = cita.pagina_pdf
            ? doc.paginas.filter((p) => p.pagina_pdf === cita.pagina_pdf)
            : doc.paginas
          return (
            <>
              <div className="visor__cabecera">
                <span className="icono-cuadro" aria-hidden="true">
                  <IconoDocumento tamano={18} />
                </span>
                <div>
                  <h3 className="visor__titulo">{doc.titulo}</h3>
                  {doc.referencia && doc.referencia !== doc.titulo && (
                    <p className="texto-pequeno texto-suave">{doc.referencia}</p>
                  )}
                </div>
              </div>
              <div className="fila-chips">
                {cita.tipo === 'indice' && <p className="nota">La coincidencia está en el título o número del documento; revisa su contenido antes de sacar conclusiones.</p>}
                {cita.pagina_pdf && <Chip tono="info">Página {cita.pagina_pdf}</Chip>}
                {doc.simulado && <Chip tono="agente">Simulado</Chip>}
                {validacion && <Chip tono={validacion.tono}>{validacion.texto}</Chip>}
              </div>

              {paginas.length === 0 ? (
                <p className="texto-suave">El texto de esta página no está disponible.</p>
              ) : (
                paginas.map((p, i) => (
                  <section key={`${p.pagina_pdf ?? 'sin'}-${i}`} className="visor__pagina">
                    {paginas.length > 1 && (
                      <p className="texto-pequeno texto-suave">
                        Página {p.pagina_impresa ?? p.pagina_pdf}
                      </p>
                    )}
                    {p.requiere_ocr ? (
                      <p className="texto-suave">
                        Esta página es una imagen escaneada y todavía no tiene texto. Ábrela en el PDF.
                      </p>
                    ) : (
                      <TextoConCita texto={p.texto} extracto={cita.extracto} />
                    )}
                  </section>
                ))
              )}

              {doc.pdf_disponible && (
                <a
                  className="boton boton--secundario boton--bloque"
                  href={enlacePdf(enlace)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir el PDF
                  <span className="solo-lectores"> (se abre en otra pestaña)</span>
                </a>
              )}
            </>
          )
        })()}
    </div>
  )
}
