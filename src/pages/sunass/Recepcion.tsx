import { useState } from 'react'
import { useAgente, useContextoAgente } from '../../agente/useAgente'
import { Chip, Fuente } from '../../components/Chip'
import { Dialogo } from '../../components/Dialogo'
import { IconoAlerta, IconoChispa, IconoDocumento, IconoFlecha, IconoOjo } from '../../components/Iconos'
import { Gotita } from '../../components/Gotita'
import { CifrasSaludo, Puntos, Saludo } from '../../components/Graficos'
import { Contenido, MensajeError, SinResultados } from '../../components/Mensajes'
import {
  incorporarDocumento,
  listarDocumentosRecibidos,
  useVersionTramites,
  type Incorporacion,
} from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import type { DocumentoRecibido } from '../../types/tramite'
import { CargarPdf } from './recepcion/CargarPdf'
import { IncorporarDialogo } from './recepcion/IncorporarDialogo'

const CONFIANZA = {
  alta: { tono: 'ok', texto: 'Confianza alta', nivel: 3 },
  media: { tono: 'aviso', texto: 'Confianza media', nivel: 2 },
  baja: { tono: 'peligro', texto: 'Confianza baja', nivel: 1 },
} as const

/** En qué paso va el documento: recibido → leído → listo para vincular. */
function pasoDocumento(doc: DocumentoRecibido) {
  if (!doc.procesamiento_pdf) return 2
  if (doc.procesamiento_pdf.estado === 'listo') return 2
  if (doc.procesamiento_pdf.estado === 'fallido') return 0
  return 1
}

function CintaDocumento({ doc }: { doc: DocumentoRecibido }) {
  const paso = pasoDocumento(doc)
  const pasos = [
    { emoji: '📥', texto: 'Recibido' },
    { emoji: '🔎', texto: 'Leído por Yaku' },
    { emoji: '🔗', texto: 'Listo para vincular' },
  ]
  return (
    <ol className="cinta-doc" aria-label={`Avance: ${pasos[paso].texto}`}>
      {pasos.map((p, i) => (
        <li
          key={p.texto}
          className={i < paso ? 'cinta-doc--hecho' : i === paso ? 'cinta-doc--actual' : undefined}
          aria-current={i === paso ? 'step' : undefined}
        >
          <span aria-hidden="true">{p.emoji}</span>
          {p.texto}
        </li>
      ))}
    </ol>
  )
}

/** Estado del PDF que procesa el worker del backend. */
const ESTADO_PDF: Record<string, { tono: 'ok' | 'aviso' | 'peligro' | 'info'; texto: string }> = {
  pendiente: { tono: 'info', texto: 'PDF en cola' },
  procesando: { tono: 'info', texto: 'Extrayendo texto' },
  listo: { tono: 'ok', texto: 'PDF listo' },
  fallido: { tono: 'peligro', texto: 'Error en el PDF' },
}

/** El documento se puede incorporar si no tiene PDF o si su PDF ya terminó de procesarse. */
function listoParaIncorporar(doc: DocumentoRecibido) {
  return !doc.procesamiento_pdf || doc.procesamiento_pdf.estado === 'listo'
}

export function Recepcion() {
  const versionDatos = useVersionTramites()
  const [resultado, reintentar] = useConsulta((signal) => listarDocumentosRecibidos(signal), [versionDatos])
  const [incorporando, setIncorporando] = useState<DocumentoRecibido | null>(null)
  const [viendo, setViendo] = useState<DocumentoRecibido | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const { abrir } = useAgente()

  useContextoAgente({
    espacio: 'Espacio SUNASS · Recepción',
    preguntas: [
      {
        pregunta: '¿Por qué propones CPI-2026-0007 para el Oficio 1628?',
        respuesta:
          'En la referencia, el Oficio 1628 cita «Oficio N.° 00156-2026-SUNASS-DRE-SRT», que es el requerimiento del expediente CPI-2026-0007.',
        fuentes: ['Oficio 1628 · pág. 1'],
        palabras: ['por que', '1628', 'propones'],
      },
      {
        pregunta: 'Redacta el pedido a EPS Tacna por Mesa de Partes',
        respuesta:
          'Borrador: «Se solicita a EPS Tacna presentar por Mesa de Partes Virtual el documento que sustenta los 19 935 medidores informados por correo el 20 de agosto, con el número del expediente CPI-2026-0007.» Revísalo antes de enviarlo.',
        fuentes: ['Correo del 20 ago'],
        palabras: ['pedido', 'mesa de partes', 'redacta'],
      },
    ],
  })

  async function incorporar(datos: Incorporacion, persona: string) {
    await incorporarDocumento(datos)
    const lista = resultado.estado === 'listo' ? resultado.datos.items : []
    const doc = lista.find((d) => d.id === datos.documento_id) ?? incorporando
    setIncorporando(null)
    setMensaje(`${doc?.titulo ?? 'Documento'} incorporado a ${datos.tramite_id}${persona ? ` y asignado a ${persona}` : ''}.`)
  }

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Coordinación DRE</p>
        <h1>Recepción de documentos</h1>
        <p className="subtitulo">
          Registra aquí documentos que ya recibiste por Mesa de Partes. Vincúlalos o registra un expediente nuevo y derívalo.
        </p>
      </div>

      {mensaje && (
        <p className="mensaje mensaje--exito" role="status">
          {mensaje}
        </p>
      )}

      <CargarPdf
        alCargar={(titulo) => {
          setMensaje(`${titulo}: PDF recibido. El texto se extrae en segundo plano; usa «Actualizar estado» para ver si ya está listo.`)
          reintentar()
        }}
      />

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando documentos recibidos…">
        {({ items }) => {
          const oficiales = items.filter((d) => d.canal_oficial)
          const conPropuesta = oficiales.filter((d) => d.propuesta).length
          const fuera = items.length - oficiales.length
          return (
          <>
            <Saludo
              pose={items.length === 0 ? 'al-dia' : 'verificando'}
              titulo={items.length === 0 ? '📭 Bandeja vacía, ¡bien!' : `📬 Llegaron ${items.length} ${items.length === 1 ? 'documento' : 'documentos'}`}
              texto={
                items.length === 0
                  ? 'Todo lo recibido ya está asociado a un expediente.'
                  : 'Yaku lee cada PDF y te sugiere a qué expediente pertenece. Tú confirmas.'
              }
            >
              <CifrasSaludo
                cifras={[
                  { emoji: '📄', valor: oficiales.length, texto: 'por incorporar', tono: 'info' },
                  { emoji: '✨', valor: conPropuesta, texto: 'con sugerencia', tono: 'ok' },
                  { emoji: '⚠️', valor: fuera, texto: 'fuera de canal oficial', tono: 'aviso' },
                ]}
              />
            </Saludo>
          {items.length === 0 ? (
            <SinResultados titulo="No hay documentos por incorporar">
              <p className="texto-suave">Todo lo recibido ya está asociado a un expediente.</p>
            </SinResultados>
          ) : (
            <>
              {items.map((doc) =>
                doc.canal_oficial ? (
                  <article key={doc.id} className="tarjeta documento documento--vivo" aria-labelledby={`doc-${doc.id}`}>
                    <div className="documento__cabecera">
                      <span className="burbuja burbuja--cielo burbuja--md documento__icono" aria-hidden="true">
                        <IconoDocumento tamano={22} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 id={`doc-${doc.id}`} className="documento__titulo">
                          {doc.titulo}
                        </h2>
                        <p className="texto-suave texto-pequeno">
                          {doc.eps} · {doc.fecha_texto}
                          {doc.hoja && ` · Hoja ${doc.hoja}`}
                        </p>
                      </div>
                      {doc.procesamiento_pdf ? (
                        <Chip tono={ESTADO_PDF[doc.procesamiento_pdf.estado]?.tono ?? 'info'}>
                          {ESTADO_PDF[doc.procesamiento_pdf.estado]?.texto ?? doc.procesamiento_pdf.estado}
                          {doc.procesamiento_pdf.paginas ? ` · ${doc.procesamiento_pdf.paginas} págs.` : ''}
                        </Chip>
                      ) : (
                        <Chip tono="info">Nuevo</Chip>
                      )}
                    </div>
                    <CintaDocumento doc={doc} />
                    {doc.procesamiento_pdf?.error && <MensajeError mensaje={doc.procesamiento_pdf.error} />}
                    {doc.propuesta && (
                      <div className="propuesta propuesta--yaku">
                        <Gotita pose="pensando" alto={48} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p className="propuesta__texto">
                            El agente propone: {doc.propuesta.tramite_id} · {doc.propuesta.motivo}
                          </p>
                          <div className="fila-chips">
                            <Chip tono={CONFIANZA[doc.propuesta.confianza].tono}>
                              {CONFIANZA[doc.propuesta.confianza].texto}
                            </Chip>
                            <Puntos
                              marcados={CONFIANZA[doc.propuesta.confianza].nivel}
                              total={3}
                              etiqueta={CONFIANZA[doc.propuesta.confianza].texto}
                            />
                            <Fuente>{doc.propuesta.fuente}</Fuente>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="acciones-derecha">
                      <button type="button" className="boton boton--secundario" onClick={() => setViendo(doc)}>
                        Ver documento
                        <IconoOjo tamano={16} />
                      </button>
                      {listoParaIncorporar(doc) ? (
                        <button type="button" className="boton boton--primario" onClick={() => setIncorporando(doc)}>
                          Vincular o registrar expediente
                          <IconoFlecha tamano={16} />
                        </button>
                      ) : (
                        <button type="button" className="boton boton--secundario" onClick={reintentar}>
                          Actualizar estado
                        </button>
                      )}
                    </div>
                  </article>
                ) : (
                  <article key={doc.id} className="tarjeta documento documento--vivo documento--fuera" aria-labelledby={`doc-${doc.id}`}>
                    <div className="documento__cabecera">
                      <span className="documento__avatar" title="Fuera del canal oficial">
                        <Gotita pose="avatar-naranja" alto={46} />
                        <span className="solo-lectores">
                          <IconoAlerta tamano={22} />
                        </span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 id={`doc-${doc.id}`} style={{ fontSize: 'var(--texto-lg)' }}>
                          {doc.titulo}
                        </h2>
                        <p className="texto-suave texto-pequeno">{doc.detalle}</p>
                      </div>
                      <Chip tono="aviso">No es canal oficial</Chip>
                    </div>
                    <div className="acciones-derecha">
                      <button
                        type="button"
                        className="boton boton--secundario"
                        onClick={() => abrir('Redacta el pedido a EPS Tacna por Mesa de Partes')}
                      >
                        Pedir por Mesa de Partes
                        <IconoChispa tamano={16} />
                      </button>
                    </div>
                  </article>
                ),
              )}
              {incorporando && (
                <IncorporarDialogo
                  key={incorporando.id}
                  documento={incorporando}
                  documentos={items}
                  alCerrar={() => setIncorporando(null)}
                  alIncorporar={incorporar}
                  alRegistrar={(id, persona) => {
                    setIncorporando(null)
                    setMensaje(`Expediente ${id} registrado y asignado a ${persona}.`)
                  }}
                />
              )}
            </>
          )}
          </>
          )
        }}
      </Contenido>

      <Dialogo abierto={viendo != null} titulo={viendo?.titulo ?? 'Documento'} alCerrar={() => setViendo(null)}>
        {viendo && (
          <div className="dialogo__cuerpo">
            <dl className="lista-datos">
              <div>
                <dt>EPS</dt>
                <dd>{viendo.eps}</dd>
              </div>
              <div>
                <dt>Recibido</dt>
                <dd>{viendo.fecha_texto}</dd>
              </div>
              <div>
                <dt>Referencia u hoja de trámite</dt>
                <dd>{viendo.hoja ?? '—'}</dd>
              </div>
            </dl>
            <p className="texto-suave texto-pequeno">
              El texto del documento se podrá consultar en el expediente después de incorporarlo.
            </p>
          </div>
        )}
      </Dialogo>
    </div>
  )
}
