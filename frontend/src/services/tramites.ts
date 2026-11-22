// Servicios de la vista SUNASS.
// /api/tramites y /api/tramites/{id} siguen docs/contrato_api.md. Las demás rutas son una
// propuesta por acordar con el backend: recepción, alertas, confirmar vínculo e incorporar documento.

import { ejemplo, noEncontrado, pedirJson, usarEjemplos } from './api'
import { ALERTAS, DOCUMENTOS_RECIBIDOS, TRAMITES, expedienteDeEjemplo } from '../mocks/tramites'
import type { Alerta, DocumentoRecibido, Expediente, ListaPaginada, TramiteResumen } from '../types/tramite'

// En modo de ejemplos, los cambios viven en memoria mientras la pestaña esté abierta.
let documentosPendientes = [...DOCUMENTOS_RECIBIDOS]
const vinculosConfirmados = new Set<string>()

export function listarExpedientes(signal?: AbortSignal): Promise<ListaPaginada<TramiteResumen>> {
  if (usarEjemplos) return ejemplo({ items: TRAMITES, total: TRAMITES.length }, signal)
  return pedirJson('/api/tramites', { signal })
}

export async function obtenerExpediente(id: string, signal?: AbortSignal): Promise<Expediente> {
  if (usarEjemplos) {
    const expediente = expedienteDeEjemplo(id) ?? noEncontrado()
    return ejemplo(conVinculoAplicado(expediente), signal)
  }
  return pedirJson(`/api/tramites/${encodeURIComponent(id)}`, { signal })
}

/** Una persona confirma el vínculo que propuso el agente. */
export async function confirmarVinculo(id: string, documento: string): Promise<Expediente> {
  if (usarEjemplos) {
    vinculosConfirmados.add(id)
    return obtenerExpediente(id)
  }
  return pedirJson(`/api/tramites/${encodeURIComponent(id)}/vinculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documento, decision: 'confirmar' }),
  })
}

/** Aplica en los ejemplos el efecto de haber confirmado el vínculo. */
function conVinculoAplicado(e: Expediente): Expediente {
  if (!vinculosConfirmados.has(e.id) || !e.vinculo) return e
  return {
    ...e,
    vinculo: null,
    linea_tiempo:
      e.linea_tiempo?.map((h) =>
        h.validar ? { ...h, validar: false, chip: { texto: 'Vínculo confirmado', tono: 'ok' } } : h,
      ) ?? null,
    siguiente: {
      titulo: 'Pedir el documento de la cifra de 19 935',
      detalle:
        'El vínculo quedó confirmado. La cifra final llegó por correo: pide a la EPS que la formalice por Mesa de Partes.',
      responsable: 'Especialista SRT',
      boton: 'Ver alertas de plazo',
      accion: 'alertas',
      urgente: false,
    },
  }
}

export function listarDocumentosRecibidos(signal?: AbortSignal): Promise<ListaPaginada<DocumentoRecibido>> {
  if (usarEjemplos) return ejemplo({ items: documentosPendientes, total: documentosPendientes.length }, signal)
  return pedirJson('/api/recepcion', { signal })
}

export interface Incorporacion {
  documento_id: string
  tramite_id: string
  tipo_actuacion: string
  asignado_a: string
  avisar: boolean
}

export async function incorporarDocumento(datos: Incorporacion): Promise<void> {
  if (usarEjemplos) {
    await ejemplo(null)
    documentosPendientes = documentosPendientes.filter((d) => d.id !== datos.documento_id)
    return
  }
  await pedirJson('/api/recepcion/incorporaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
}

export function listarAlertas(signal?: AbortSignal): Promise<ListaPaginada<Alerta>> {
  if (usarEjemplos) return ejemplo({ items: ALERTAS, total: ALERTAS.length }, signal)
  return pedirJson('/api/alertas', { signal })
}
