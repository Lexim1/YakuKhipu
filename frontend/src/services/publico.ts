// Servicios de la consulta ciudadana. No usan sesión: llaman solo a /api/publico.

import { ejemplo, pedirJson, usarEjemplos } from './api'
import { CIFRAS_SECTOR, DECISIONES } from '../mocks/publico'
import type { CifraSector, DecisionResumen, ListaPublica } from '../types/publico'

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

/** Cifras generales del sector. Ruta por acordar con el backend. */
export function obtenerCifrasSector(signal?: AbortSignal): Promise<CifraSector[]> {
  if (usarEjemplos) return ejemplo(CIFRAS_SECTOR, signal)
  return pedirJson('/api/publico/cifras', { signal, credentials: 'omit' })
}
