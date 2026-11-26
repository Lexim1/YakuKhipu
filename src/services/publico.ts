// Servicios de la consulta ciudadana. No usan sesión: llaman solo a /api/publico.

import { ejemplo, noEncontrado, pedirJson, usarEjemplos } from './api'
import { CIFRAS_SECTOR, DECISIONES, FICHAS_PUBLICAS } from '../mocks/publico'
import type { CifraSector, DecisionPublica, DecisionResumen, ListaPublica } from '../types/publico'

export interface FiltrosPublicos {
  q: string
  page: number
  pageSize: number
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function buscarEnEjemplos({ q, page, pageSize }: FiltrosPublicos): ListaPublica<DecisionResumen> {
  const busqueda = normalizar(q.trim())
  const encontrados = DECISIONES.filter(
    (d) => !busqueda || normalizar(`${d.eps} ${d.localidad} ${d.titulo}`).includes(busqueda),
  )
  const inicio = (page - 1) * pageSize
  return { items: encontrados.slice(inicio, inicio + pageSize), total: encontrados.length, page, page_size: pageSize }
}

export function buscarDecisiones(
  filtros: FiltrosPublicos,
  signal?: AbortSignal,
): Promise<ListaPublica<DecisionResumen>> {
  if (usarEjemplos) return ejemplo(buscarEnEjemplos(filtros), signal)
  const parametros = new URLSearchParams({ page: String(filtros.page), page_size: String(filtros.pageSize) })
  if (filtros.q.trim()) parametros.set('q', filtros.q.trim())
  // Consulta pública: no envía cookies de sesión.
  return pedirJson(`/api/publico/decisiones?${parametros}`, { signal, credentials: 'omit' })
}

/** Cifras generales del sector. El backend responde { concepto, valor, fuente }. */
export async function obtenerCifrasSector(signal?: AbortSignal): Promise<CifraSector[]> {
  if (usarEjemplos) return ejemplo(CIFRAS_SECTOR, signal)
  const cifras = await pedirJson<{ concepto: string; valor: number | string; fuente: string }[]>(
    '/api/publico/cifras',
    { signal, credentials: 'omit' },
  )
  return cifras.map((c) => ({
    valor: typeof c.valor === 'number' ? c.valor.toLocaleString('es-PE') : c.valor,
    texto: c.concepto,
    fuente: c.fuente,
  }))
}

/** Ficha pública de una decisión. Solo existe si el caso está habilitado para publicación. */
export async function obtenerDecision(id: string, signal?: AbortSignal): Promise<DecisionPublica> {
  if (usarEjemplos) return ejemplo(FICHAS_PUBLICAS.find((f) => f.id === id) ?? noEncontrado(), signal)
  const d = await pedirJson<Partial<DecisionPublica>>(`/api/publico/decisiones/${encodeURIComponent(id)}`, { signal, credentials: 'omit' })
  // Los montos ausentes no son cero ni se completan con cifras de demostración.
  return { ...d, cifra: d.cifra ?? 'Cantidad no publicada', nota_estado: d.nota_estado ?? 'Sin nota publicada',
    fecha_actualizacion: d.fecha_actualizacion ?? '', solicitado: d.solicitado ?? null, autorizado: d.autorizado ?? null,
    ejecutado: d.ejecutado ?? null, impacto: Array.isArray(d.impacto) ? d.impacto : [],
    fuentes: Array.isArray(d.fuentes) ? d.fuentes : [], consulta: d.consulta ?? null } as DecisionPublica
}
