import { useState } from 'react'
import { LectorDocumento } from '../../../components/LectorDocumento'
import type { Expediente } from '../../../types/tramite'

export function DocumentosExpediente({ expediente }: { expediente: Expediente }) {
  const [id, setId] = useState<string | null>(null)
  return <section className="tarjeta"><h2>Documentos incorporados</h2>
    {expediente.documentos?.length ? <ul className="lista-simple">{expediente.documentos.map((d) => <li key={d.id}>
      <span>{d.titulo}</span><button className="boton boton--secundario" type="button" onClick={() => setId(d.id)}>Leer documento</button>
    </li>)}</ul> : <p>No hay documentos incorporados. Coordinación puede recibirlos y vincularlos desde Recepción.</p>}
    {id && <LectorDocumento id={id} alCerrar={() => setId(null)} />}
  </section>
}
