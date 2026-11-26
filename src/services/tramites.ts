// Servicios de la vista SUNASS. Siguen el backend YakuKhipu-Backend (docs/openapi.json).
// «Te toca actuar» y los contadores del menú se arman con /api/tramites, /api/recepcion y /api/alertas,
// porque el backend no tiene una bandeja propia.

import { useSyncExternalStore } from 'react'
import { ErrorApi, ejemplo, noEncontrado, pedir, pedirJson, usarEjemplos } from './api'
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

/** true si el valor es un objeto con la lista `campo`: así se reconoce el formato que dibuja cada pestaña. */
function tieneLista(valor: unknown, campo: string): boolean {
  return typeof valor === 'object' && valor !== null && Array.isArray((valor as Record<string, unknown>)[campo])
}

/**
 * El backend entrega algunas secciones con otra forma (por ejemplo, `resumen` trae la procedencia
 * del caso y `plazos` solo su validación). Lo que no tiene el formato de la pantalla se deja en null
 * para que esa pestaña no se muestre, en lugar de romper la ficha.
 */
function adaptarExpediente(e: Expediente): Expediente {
  const lineaTiempo = Array.isArray(e.linea_tiempo) && e.linea_tiempo.length > 0 ? e.linea_tiempo : null
  return {
    ...e,
    resumen: Array.isArray(e.resumen) ? e.resumen : null,
    comparador: tieneLista(e.comparador, 'versiones') ? e.comparador : null,
    plazos: tieneLista(e.plazos, 'tarjetas') ? e.plazos : null,
    impacto: tieneLista(e.impacto, 'indicadores') ? e.impacto : null,
    linea_tiempo: lineaTiempo,
    historial: lineaTiempo ? e.historial : Array.isArray(e.historial) ? e.historial : [],
  }
}

export async function obtenerExpediente(id: string, signal?: AbortSignal): Promise<Expediente> {
  if (usarEjemplos) {
    const expediente = expedienteDeEjemplo(id) ?? noEncontrado()
    return ejemplo(conCambiosAplicados(expediente), signal)
  }
  return adaptarExpediente(await pedirJson<Expediente>(`/api/tramites/${encodeURIComponent(id)}`, { signal }))
}

/** Registra la decisión de una persona sobre el vínculo que propuso el agente. */
async function decidirVinculo(
  id: string,
  documento: string,
  decision: 'confirmar' | 'rechazar',
  version: number,
): Promise<Expediente> {
  let expediente: Expediente
  if (usarEjemplos) {
    await ejemplo(null)
    vinculos.set(id, decision === 'confirmar' ? 'confirmado' : 'rechazado')
    expediente = await obtenerExpediente(id)
  } else {
    if (decision === 'rechazar') {
      // El backend solo registra confirmaciones (ConfirmarVinculo admite decision = «confirmar»).
      throw new ErrorApi(409, 'El rechazo del vínculo todavía no se registra en el servidor.')
    }
    expediente = adaptarExpediente(
      await pedirJson<Expediente>(`/api/tramites/${encodeURIComponent(id)}/vinculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento, decision, version }),
      }),
    )
  }
  avisarCambio()
  return expediente
}

export function confirmarVinculo(id: string, documento: string, version: number): Promise<Expediente> {
  return decidirVinculo(id, documento, 'confirmar', version)
}

export function rechazarVinculo(id: string, documento: string, version: number): Promise<Expediente> {
  return decidirVinculo(id, documento, 'rechazar', version)
}

// ─── Recepción ───────────────────────────────────────────────────────────────────

/** Documento recibido tal como lo entrega GET /api/recepcion. */
interface RecepcionApi {
  id: string
  titulo: string
  referencia: string
  fecha_documento: string
  eps_id: string
  registrado_por: string
  procesamiento_pdf?: DocumentoRecibido['procesamiento_pdf']
}

interface DestinoApi {
  id: string
  titulo: string
  eps_id: string
  eps: string
  version: number
}

/** «2026-11-25» → «25 nov 2026». */
function fechaLegible(iso: string) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  if (!anio || !mes || !dia) return iso
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Expedientes abiertos que admiten documentos, con su EPS y versión vigente. */
export async function listarDestinos(signal?: AbortSignal): Promise<DestinoApi[]> {
  if (usarEjemplos) {
    return ejemplo(TRAMITES.map((t) => ({ id: t.id, titulo: t.id, eps_id: t.eps, eps: t.eps, version: 1 })), signal)
  }
  return (await pedirJson<{ items: DestinoApi[] }>('/api/recepcion/destinos', { signal })).items
}

export interface CandidatoAsignacion {
  id: string
  nombre: string
}

export function listarCandidatosAsignacion(id: string, signal?: AbortSignal) {
  return pedirJson<CandidatoAsignacion[]>(`/api/tramites/${encodeURIComponent(id)}/asignaciones/candidatos`, { signal })
}

export async function asignarExpediente(id: string, datos: { usuario_id: string; motivo: string; version: number }) {
  await pedir(`/api/tramites/${encodeURIComponent(id)}/asignaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  avisarCambio()
}

export async function listarDocumentosRecibidos(signal?: AbortSignal): Promise<ListaPaginada<DocumentoRecibido>> {
  if (usarEjemplos) return ejemplo({ items: documentosPendientes, total: documentosPendientes.length }, signal)
  const [recibidos, catalogo] = await Promise.all([
    pedirJson<ListaPaginada<RecepcionApi>>('/api/recepcion', { signal }),
    consultarCatalogoRecepcion(signal).catch(() => ({ empresas: [], analistas: [] })),
  ])
  const nombres = new Map(catalogo.empresas.map((e) => [e.id, e.nombre]))
  const items: DocumentoRecibido[] = recibidos.items.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    eps: nombres.get(r.eps_id) ?? r.eps_id,
    eps_id: r.eps_id,
    fecha_texto: fechaLegible(r.fecha_documento),
    hoja: r.referencia,
    // La carga manual corresponde a un documento recibido fuera del portal.
    canal_oficial: true,
    detalle: null,
    procesamiento_pdf: r.procesamiento_pdf ?? null,
    propuesta: null,
  }))
  return { items, total: recibidos.total }
}

/**
 * Carga un PDF recibido por Mesa de Partes (POST /api/recepcion/pdf). El backend lo guarda en el bucket
 * privado y el worker extrae el texto y aplica OCR; el estado se ve en la lista de recepción.
 */
export async function cargarPdf(datos: FormData): Promise<void> {
  if (usarEjemplos) {
    throw new ErrorApi(503, 'En el modo de ejemplos no se cargan archivos.')
  }
  await pedir('/api/recepcion/pdf', { method: 'POST', body: datos })
  avisarCambio()
}

export function consultarCatalogoRecepcion(signal?: AbortSignal) {
  return pedirJson<{
    empresas: { id: string; nombre: string }[]
    analistas: CandidatoAsignacion[]
  }>('/api/recepcion/catalogos', { signal })
}

export interface NuevoExpedienteRecepcion {
  documento_id: string
  procedimiento: 'CPI' | 'UFI' | 'RP'
  fecha_ingreso: string
  asignado_a: string
}

export async function registrarExpedienteRecepcion(datos: NuevoExpedienteRecepcion) {
  const nuevo = await pedirJson<{ tramite_id: string }>('/api/recepcion/expedientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  avisarCambio()
  return nuevo
}

/** Expedientes, personas asignables y tipos de actuación para incorporar un documento. */
export async function obtenerCatalogosRecepcion(signal?: AbortSignal): Promise<CatalogosRecepcion> {
  if (usarEjemplos) {
    return ejemplo(
      {
        expedientes: TRAMITES.map((t) => ({ id: t.id, eps: t.eps, version: 1 })),
        asignables: ASIGNABLES,
        tipos_actuacion: TIPOS_ACTUACION,
      },
      signal,
    )
  }
  const [destinos, catalogo] = await Promise.all([listarDestinos(signal), consultarCatalogoRecepcion(signal)])
  return {
    expedientes: destinos.map((t) => ({ id: t.id, eps: t.eps, version: t.version, eps_id: t.eps_id })),
    asignables: catalogo.analistas.map((persona) => ({ id: persona.id, texto: persona.nombre, menor_carga: false })),
    tipos_actuacion: TIPOS_ACTUACION,
  }
}

export interface Incorporacion {
  documento_id: string
  tramite_id: string
  tipo_actuacion: string
  /** null cuando no hay a quién asignar desde recepción. */
  asignado_a: string | null
  avisar: boolean
  /** Versión del expediente elegido. */
  version: number
}

export async function incorporarDocumento(datos: Incorporacion): Promise<void> {
  if (usarEjemplos) {
    await ejemplo(null)
    const documento = documentosPendientes.find((d) => d.id === datos.documento_id) ?? noEncontrado()
    documentosPendientes = documentosPendientes.filter((d) => d.id !== datos.documento_id)
    incorporaciones.push({ documento, datos, persona: datos.asignado_a ? personaDe(datos.asignado_a) : 'Sin asignar' })
  } else {
    await pedir('/api/recepcion/incorporaciones', {
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

/** Lista de una ruta que el perfil puede no tener permitida: sin permiso, cuenta como vacía. */
async function listaSiPermitida<T>(ruta: string, signal?: AbortSignal): Promise<ListaPaginada<T>> {
  try {
    return await pedirJson<ListaPaginada<T>>(ruta, { signal })
  } catch (error) {
    if (error instanceof ErrorApi && (error.estado === 403 || error.estado === 404)) return { items: [], total: 0 }
    throw error
  }
}

const URGENCIA: Partial<Record<TramiteResumen['plazo']['situacion'], Tarea['urgencia']>> = {
  vencido: 'hoy',
  por_vencer: 'por_vencer',
}

/** Bandeja calculada con los datos reales: expedientes con plazo en riesgo y documentos por incorporar. */
async function bandejaReal(signal?: AbortSignal): Promise<BandejaTareas> {
  const [tramites, recibidos] = await Promise.all([
    pedirJson<ListaPaginada<TramiteResumen>>('/api/tramites', { signal }),
    listaSiPermitida<DocumentoRecibido>('/api/recepcion', signal),
  ])
  const enRiesgo = tramites.items.filter((t) => URGENCIA[t.plazo.situacion])
  const tareas: Tarea[] = [
    ...enRiesgo.map((t) => ({
      id: `plazo-${t.id}`,
      tramite_id: t.id,
      eps: t.eps,
      etapa: t.etapa,
      titulo: t.plazo.situacion === 'vencido' ? 'Plazo vencido: revisar el expediente' : 'Plazo por vencer',
      detalle: `${t.plazo.dias_usados} de ${t.plazo.dias_totales} días hábiles · lo tiene ${t.responsable}.`,
      urgencia: URGENCIA[t.plazo.situacion]!,
      tipo: 'informe' as const,
      boton: 'Abrir ficha',
      destino: `/sunass/expedientes/${encodeURIComponent(t.id)}`,
    })),
    ...recibidos.items
      .filter((d) => d.canal_oficial)
      .map((d) => ({
        id: `recibido-${d.id}`,
        tramite_id: d.propuesta?.tramite_id ?? '',
        eps: d.eps,
        etapa: 'Recepción',
        titulo: `Incorporar ${d.titulo}`,
        detalle: `Llegó el ${d.fecha_texto}. Asócialo al expediente que corresponda.`,
        urgencia: 'en_plazo' as const,
        tipo: 'revisar_documento' as const,
        boton: 'Ir a recepción',
        destino: '/sunass/recepcion',
      })),
  ]
  const porValidar = tramites.items.filter((t) => t.plazo.situacion === 'pendiente_de_validacion').length
  return {
    cargo: 'Tus expedientes',
    tareas,
    avisos: [],
    por_vencer: {
      total: enRiesgo.length,
      detalle: enRiesgo.length ? 'Vencidos o por vencer' : 'Ningún plazo en riesgo',
    },
    expedientes_asignados: {
      total: tramites.total,
      detalle: porValidar ? `${porValidar} con plazo por validar` : 'Todos con plazo calculado',
    },
  }
}

/** Acciones pendientes del perfil que inició sesión. */
export function obtenerBandeja(signal?: AbortSignal): Promise<BandejaTareas> {
  if (usarEjemplos) return ejemplo(bandejaDeEjemplo(), signal)
  return bandejaReal(signal)
}

/** Contadores del menú lateral, calculados con los mismos datos que muestran las pantallas. */
export async function obtenerContadores(signal?: AbortSignal): Promise<Contadores> {
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
  const [bandeja, recibidos, alertas] = await Promise.all([
    bandejaReal(signal),
    listaSiPermitida<DocumentoRecibido>('/api/recepcion', signal),
    listaSiPermitida<Alerta>('/api/alertas', signal),
  ])
  return {
    te_toca: bandeja.tareas.length,
    recepcion: recibidos.items.filter((d) => d.canal_oficial).length,
    alertas: alertas.total,
  }
}

// ─── Propuestas del agente ───────────────────────────────────────────────────────
// Al incorporar un PDF, el worker del backend pide al agente un análisis con citas (propuesta_agente).
// SUNASS lo acepta o rechaza con un motivo; la revisión no cambia el estado del expediente.

export interface PropuestaAgente {
  documento_id: string
  /** pendiente, procesando, lista, aceptada, rechazada o error. */
  estado: string
  propuesta: string | null
  fuentes: { titulo: string; pagina_pdf: number | null; documento_id: string }[] | null
  advertencias: string[] | null
  error: string | null
  revision_motivo: string | null
}

export async function listarPropuestas(tramiteId: string, signal?: AbortSignal): Promise<PropuestaAgente[]> {
  if (usarEjemplos) return ejemplo([], signal)
  const datos = await pedirJson<{ items: PropuestaAgente[] }>(
    `/api/tramites/${encodeURIComponent(tramiteId)}/propuestas`,
    { signal },
  )
  return datos.items
}

export async function revisarPropuesta(
  tramiteId: string,
  documentoId: string,
  decision: 'aceptada' | 'rechazada',
  motivo: string,
): Promise<void> {
  await pedirJson(
    `/api/tramites/${encodeURIComponent(tramiteId)}/propuestas/${encodeURIComponent(documentoId)}/revision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, motivo }),
    },
  )
  avisarCambio()
}
