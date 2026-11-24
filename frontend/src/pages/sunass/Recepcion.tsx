import { useState } from 'react'
import { useAgente, useContextoAgente } from '../../agente/useAgente'
import { Chip, Fuente } from '../../components/Chip'
import { Dialogo } from '../../components/Dialogo'
import { IconoAlerta, IconoChispa, IconoDocumento, IconoFlecha, IconoOjo } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import {
  incorporarDocumento,
  listarDocumentosRecibidos,
  useVersionTramites,
  type Incorporacion,
} from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import type { DocumentoRecibido } from '../../types/tramite'
import { IncorporarDialogo } from './recepcion/IncorporarDialogo'

const CONFIANZA = {
  alta: { tono: 'ok', texto: 'Confianza alta' },
  media: { tono: 'aviso', texto: 'Confianza media' },
  baja: { tono: 'peligro', texto: 'Confianza baja' },
} as const

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
    setMensaje(`${doc?.titulo ?? 'Documento'} incorporado a ${datos.tramite_id} y asignado a ${persona}.`)
  }

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">Coordinación DRE</p>
        <h1>Recepción de documentos</h1>
        <p className="subtitulo">
          Llegaron por Mesa de Partes Virtual. El agente propone a qué expediente pertenecen; tú decides.
        </p>
      </div>

      {mensaje && (
        <p className="mensaje mensaje--exito" role="status">
          {mensaje}
        </p>
      )}

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando documentos recibidos…">
        {({ items }) =>
          items.length === 0 ? (
            <SinResultados titulo="No hay documentos por incorporar">
              <p className="texto-suave">Todo lo recibido ya está asociado a un expediente.</p>
            </SinResultados>
          ) : (
            <>
              {items.map((doc) =>
                doc.canal_oficial ? (
                  <article key={doc.id} className="tarjeta documento" aria-labelledby={`doc-${doc.id}`}>
                    <div className="documento__cabecera">
                      <span className="icono-cuadro">
                        <IconoDocumento tamano={20} />
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
                      <Chip tono="info">Nuevo</Chip>
                    </div>
                    {doc.propuesta && (
                      <div className="propuesta">
                        <IconoChispa tamano={18} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p className="propuesta__texto">
                            El agente propone: {doc.propuesta.tramite_id} · {doc.propuesta.motivo}
                          </p>
                          <div className="fila-chips">
                            <Chip tono={CONFIANZA[doc.propuesta.confianza].tono}>
                              {CONFIANZA[doc.propuesta.confianza].texto}
                            </Chip>
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
                      <button type="button" className="boton boton--primario" onClick={() => setIncorporando(doc)}>
                        Incorporar y asignar
                        <IconoFlecha tamano={16} />
                      </button>
                    </div>
                  </article>
                ) : (
                  <article key={doc.id} className="tarjeta documento" aria-labelledby={`doc-${doc.id}`}>
                    <div className="documento__cabecera">
                      <span style={{ color: 'var(--color-aviso)' }}>
                        <IconoAlerta tamano={22} />
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
                />
              )}
            </>
          )
        }
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
                <dt>Hoja de trámite</dt>
                <dd>{viendo.hoja ?? '—'}</dd>
              </div>
            </dl>
            <p className="texto-suave texto-pequeno">
              La vista del PDF se mostrará cuando el backend entregue el archivo desde SIGED.
            </p>
          </div>
        )}
      </Dialogo>
    </div>
  )
}
