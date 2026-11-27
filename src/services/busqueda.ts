import { pedirJson } from './api'
import type { FuenteCita } from './asistente'

export interface ExpedienteEncontrado {
  tramite_id: string
  referencia: string
  titulo: string
  eps: string
  procedimiento: string
  estado: string
  etapa: string
  responsable: string | null
  analista: string | null
  enlace_expediente: string
  fuentes: (FuenteCita & { tipo: 'texto' | 'indice' })[]
}
export interface BusquedaAgente {
  items: ExpedienteEncontrado[]
  limite: number
  parcial: boolean
  sin_inferencia: boolean
  nota: string
}
export function buscarExpedientes(q: string, signal?: AbortSignal, limite=5) {
  return pedirJson<BusquedaAgente>(`/api/agente/buscar?${new URLSearchParams({ q, limite: String(limite) })}`, { signal })
}
