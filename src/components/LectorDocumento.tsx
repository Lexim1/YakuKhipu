import { Dialogo } from './Dialogo'
import { Contenido } from './Mensajes'
import { pedirJson, urlApi } from '../services/api'
import { useConsulta } from '../services/useConsulta'
import type { ContenidoFuente } from '../services/asistente'

export function LectorDocumento({ id, publico = false, alCerrar }: { id: string; publico?: boolean; alCerrar: () => void }) {
  const ruta = `/api/${publico ? 'publico/' : ''}documentos/${encodeURIComponent(id)}/contenido`
  const [r, retry] = useConsulta((signal) => pedirJson<ContenidoFuente>(ruta, { signal, credentials: publico ? 'omit' : 'include' }), [ruta])
  return <Dialogo abierto titulo="Fuente documental" alCerrar={alCerrar}>
    <div className="dialogo__cuerpo"><Contenido resultado={r} reintentar={retry} textoCarga="Cargando documento autorizado…">{(d) => <>
      <h2>{d.titulo}</h2>
      <p>{d.simulado ? 'Documento ficticio de práctica' : 'Documento de referencia'} · {publico ? 'Fuente autorizada para ciudadanía' : 'Acceso según tu perfil'}</p>
      {d.pdf_disponible && <a className="boton boton--secundario" href={urlApi(ruta + '?formato=pdf')} target="_blank" rel="noreferrer">Abrir PDF autorizado</a>}
      {d.paginas.length ? d.paginas.map((p, i) => <section key={i}><h3>Página {p.pagina_pdf ?? 'sin numeración'}</h3>
        {p.requiere_ocr && <p className="mensaje">El texto requiere OCR o revisión; no se interpreta como evidencia completa.</p>}
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.texto || 'Sin texto extraído.'}</pre>
      </section>) : <p>Entrada del índice documental. No se entregó texto o PDF para este documento; el vínculo referencial del dataset no se presenta como archivo disponible.</p>}
    </>}</Contenido></div>
  </Dialogo>
}
