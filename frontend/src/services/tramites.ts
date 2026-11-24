// Servicios de la vista SUNASS.
// /api/tramites y /api/tramites/{id} siguen docs/contrato_api.md. Las demás rutas son una
// propuesta por acordar con el backend: recepción, catálogos, alertas, vínculos, bandeja y contadores.

import { useSyncExternalStore } from 'react'
import { ejemplo, noEncontrado, pedirJson, usarEjemplos } from './api'
import {
  ALERTAS,
  ASIGNABLES,
  AVISOS_AGENTE,
  DOCUMENTOS_RECIBIDOS,
  PERFIL_BANDEJA,
  TAREAS_BASE,
  TIPOS_ACTUACION,
  TRAMITES,
  expedienteDeEjemplo,
} from '../mocks/tramites'
import type {
  Alerta,
  BandejaTareas,
  CatalogosRecepcion,
  Contadores,
  DocumentoRecibido,
  Expediente,
  Hito,
  ListaPaginada,
  Tarea,
  TramiteResumen,
} from '../types/tramite'

// ─── Avisos de cambio ────────────────────────────────────────────────────────────
// Después de una escritura confirmada, las pantallas y los contadores del menú vuelven a consultar.

let version = 0
const oyentes = new Set<() => void>()

function avisarCambio() {
  version += 1
  oyentes.forEach((oyente) => oyente())
}

/** Número que cambia cada vez que se registra una acción. Úsalo como dependencia de useConsulta. */
export function useVersionTramites(): number {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    },
    () => version,
  )
}

// ─── Estado del modo de ejemplos ─────────────────────────────────────────────────
// Los cambios viven en memoria mientras la pestaña esté abierta.

let documentosPendientes = [...DOCUMENTOS_RECIBIDOS]
const vinculos = new Map<string, 'confirmado' | 'rechazado'>()

interface IncorporacionRegistrada {
  documento: DocumentoRecibido
  datos: Incorporacion
  persona: string
}
const incorporaciones: IncorporacionRegistrada[] = []

function personaDe(id: string) {
  return ASIGNABLES.find((a) => a.id === id)?.texto ?? id
}

function incorporacionesDe(tramiteId: string) {
  return incorporaciones.filter((i) => i.datos.tramite_id === tramiteId)
}

/** Responsable vigente: la última asignación registrada o el original. */
function conResponsable<T extends TramiteResumen>(t: T): T {
  const ultima = incorporacionesDe(t.id).at(-1)
  return ultima ? { ...t, responsable: ultima.persona } : t
}

function fechaCorta(texto: string) {
  return texto.split(',')[0]
}

/** Aplica en un expediente de ejemplo lo registrado en esta sesión: vínculos e incorporaciones. */
function conCambiosAplicados(original: Expediente): Expediente {
  let e = conResponsable(original)
  const decision = vinculos.get(e.id)

  if (decision && e.vinculo) {
    const documento = e.vinculo.documento
    e = {
      ...e,
      vinculo: null,
      linea_tiempo:
        e.linea_tiempo?.map((h) =>
          h.validar
            ? {
                ...h,
                validar: false,
                chip:
                  decision === 'confirmado'
                    ? { texto: 'Vínculo confirmado', tono: 'ok' }
                    : { texto: 'Vínculo rechazado', tono: 'peligro' },
              }
            : h,
        ) ?? null,
      siguiente:
        decision === 'confirmado'
          ? {
              titulo: 'Pedir el documento de la cifra de 19 935',
              detalle:
                'El vínculo quedó confirmado. La cifra final llegó por correo: pide a la EPS que la formalice por Mesa de Partes.',
              responsable: 'Especialista SRT',
              boton: 'Ver alertas de plazo',
              accion: 'alertas',
              urgente: false,
            }
          : {
              titulo: `Asociar el ${documento} al expediente que corresponda`,
              detalle:
                'Rechazaste el vínculo que propuso el agente. El documento queda por asociar en Recepción de documentos.',
              responsable: 'Coordinación DRE',
              boton: 'Ir a recepción',
              accion: 'recepcion',
              urgente: true,
            },
    }
  }

  const propias = incorporacionesDe(e.id)
  if (propias.length === 0) return e

  const hitos: Hito[] = propias.map(({ documento, datos, persona }) => ({
    id: `inc-${documento.id}`,
    fecha_texto: fechaCorta(documento.fecha_texto),
    titulo: `${documento.titulo} incorporado`,
    detalle: `${datos.tipo_actuacion} · asignado a ${persona}`,
    chip: { texto: 'Incorporado', tono: 'info' },
    fuente: documento.hoja ? `Hoja ${documento.hoja}` : null,
    validar: false,
  }))
  const ultima = propias[propias.length - 1]

  return {
    ...e,
    linea_tiempo: e.linea_tiempo ? [...e.linea_tiempo, ...hitos] : null,
    historial: e.historial
      ? [
          ...e.historial.map((h) => ({ ...h, actual: false })),
          ...propias.map(({ documento, datos, persona }, i) => ({
            fecha_texto: fechaCorta(documento.fecha_texto),
            titulo: `${datos.tipo_actuacion}: ${documento.titulo}`,
            detalle: `Incorporado desde Mesa de Partes · asignado a ${persona}`,
            actual: i === propias.length - 1,
          })),
        ]
      : null,
    siguiente: { ...e.siguiente, responsable: ultima.persona },
  }
}

// ─── Expedientes ─────────────────────────────────────────────────────────────────

export function listarExpedientes(signal?: AbortSignal): Promise<ListaPaginada<TramiteResumen>> {
  if (usarEjemplos) {
    const items = TRAMITES.map(conResponsable)
    return ejemplo({ items, total: items.length }, signal)
  }
  return pedirJson('/api/tramites', { signal })
}

export async function obtenerExpediente(id: string, signal?: AbortSignal): Promise<Expediente> {
  if (usarEjemplos) {
    const expediente = expedienteDeEjemplo(id) ?? noEncontrado()
    return ejemplo(conCambiosAplicados(expediente), signal)
  }
  return pedirJson(`/api/tramites/${encodeURIComponent(id)}`, { signal })
}

/** Registra la decisión de una persona sobre el vínculo que propuso el agente. */
async function decidirVinculo(
  id: string,
  documento: string,
  decision: 'confirmar' | 'rechazar',
): Promise<Expediente> {
  let expediente: Expediente
  if (usarEjemplos) {
    await ejemplo(null)
    vinculos.set(id, decision === 'confirmar' ? 'confirmado' : 'rechazado')
    expediente = await obtenerExpediente(id)
  } else {
    expediente = await pedirJson(`/api/tramites/${encodeURIComponent(id)}/vinculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento, decision }),
    })
  }
  avisarCambio()
  return expediente
}

export function confirmarVinculo(id: string, documento: string): Promise<Expediente> {
  return decidirVinculo(id, documento, 'confirmar')
}

export function rechazarVinculo(id: string, documento: string): Promise<Expediente> {
  return decidirVinculo(id, documento, 'rechazar')
}

// ─── Recepción ───────────────────────────────────────────────────────────────────

export function listarDocumentosRecibidos(signal?: AbortSignal): Promise<ListaPaginada<DocumentoRecibido>> {
  if (usarEjemplos) return ejemplo({ items: documentosPendientes, total: documentosPendientes.length }, signal)
  return pedirJson('/api/recepcion', { signal })
}

/** Expedientes, personas asignables y tipos de actuación para incorporar un documento. */
export async function obtenerCatalogosRecepcion(signal?: AbortSignal): Promise<CatalogosRecepcion> {
  if (usarEjemplos) {
    return ejemplo(
      {
        expedientes: TRAMITES.map((t) => ({ id: t.id, eps: t.eps })),
        asignables: ASIGNABLES,
        tipos_actuacion: TIPOS_ACTUACION,
      },
      signal,
    )
  }
  const [expedientes, asignables, tipos] = await Promise.all([
    pedirJson<ListaPaginada<TramiteResumen>>('/api/tramites', { signal }),
    pedirJson<CatalogosRecepcion['asignables']>('/api/recepcion/asignables', { signal }),
    pedirJson<string[]>('/api/recepcion/tipos-actuacion', { signal }),
  ])
  return {
    expedientes: expedientes.items.map((t) => ({ id: t.id, eps: t.eps })),
    asignables,
    tipos_actuacion: tipos,
  }
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
    const documento = documentosPendientes.find((d) => d.id === datos.documento_id) ?? noEncontrado()
    documentosPendientes = documentosPendientes.filter((d) => d.id !== datos.documento_id)
    incorporaciones.push({ documento, datos, persona: personaDe(datos.asignado_a) })
  } else {
    await pedirJson('/api/recepcion/incorporaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })
  }
  avisarCambio()
}

// ─── Alertas ─────────────────────────────────────────────────────────────────────

function alertasVigentes(): Alerta[] {
  const incorporados = new Set(incorporaciones.map((i) => i.documento.id))
  return ALERTAS.filter((a) => {
    if (a.documento_id && incorporados.has(a.documento_id)) return false
    // El Oficio 1628 deja de estar «por asociar» cuando se confirma su vínculo.
    if (a.tipo === 'documento_por_asociar' && vinculos.get('CPI-2026-0007') === 'confirmado') return false
    return true
  })
}

export function listarAlertas(signal?: AbortSignal): Promise<ListaPaginada<Alerta>> {
  if (usarEjemplos) {
    const items = alertasVigentes()
    return ejemplo({ items, total: items.length }, signal)
  }
  return pedirJson('/api/alertas', { signal })
}

// ─── Te toca actuar ──────────────────────────────────────────────────────────────

function bandejaDeEjemplo(): BandejaTareas {
  const tareas: Tarea[] = TAREAS_BASE.filter((t) => t.tipo !== 'validar' || !vinculos.has(t.tramite_id))

  // Cada documento incorporado y asignado al equipo de la analista abre una tarea.
  for (const { documento, datos } of incorporaciones) {
    if (datos.asignado_a !== PERFIL_BANDEJA.asignable_id) continue
    const tramite = TRAMITES.find((t) => t.id === datos.tramite_id)
    tareas.push({
      id: `t-${documento.id}`,
      tramite_id: datos.tramite_id,
      eps: tramite?.eps ?? documento.eps,
      etapa: tramite?.etapa ?? 'Revisión',
      titulo: `Revisar ${documento.titulo}`,
      detalle: `${datos.tipo_actuacion} incorporada desde Mesa de Partes.`,
      urgencia: 'hoy',
      tipo: 'revisar_documento',
      boton: 'Abrir ficha',
      destino: `/sunass/expedientes/${encodeURIComponent(datos.tramite_id)}`,
    })
  }

  const vinculoPendiente = !vinculos.has('CPI-2026-0007')
  const asignados = new Set([...PERFIL_BANDEJA.expedientes, ...tareas.map((t) => t.tramite_id)])
  const nuevos = asignados.size - 1

  return {
    cargo: PERFIL_BANDEJA.cargo,
    tareas,
    avisos: AVISOS_AGENTE.filter((a) => a.tipo !== 'vinculo_propuesto' || vinculoPendiente),
    por_vencer: { total: 1, detalle: 'Plazo del informe' },
    expedientes_asignados: {
      total: asignados.size,
      detalle: nuevos > 0 ? `1 en plazo · ${nuevos} ${nuevos === 1 ? 'nuevo' : 'nuevos'}` : '1 en plazo',
    },
  }
}

/** Acciones pendientes del perfil que inició sesión. */
export function obtenerBandeja(signal?: AbortSignal): Promise<BandejaTareas> {
  if (usarEjemplos) return ejemplo(bandejaDeEjemplo(), signal)
  return pedirJson('/api/sunass/te-toca', { signal })
}

/** Contadores del menú lateral, calculados con los mismos datos que muestran las pantallas. */
export function obtenerContadores(signal?: AbortSignal): Promise<Contadores> {
  if (usarEjemplos) {
    return ejemplo(
      {
        te_toca: bandejaDeEjemplo().tareas.length,
        recepcion: documentosPendientes.filter((d) => d.canal_oficial).length,
        alertas: alertasVigentes().length,
      },
      signal,
    )
  }
  return pedirJson('/api/sunass/contadores', { signal })
}
