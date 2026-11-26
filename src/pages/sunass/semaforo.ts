import type { Plazo, Situacion } from '../../types/tramite'

/** «18 de 30», o un aviso cuando el backend todavía no puede contar días. */
export function textoDias(plazo: Plazo): string {
  if (plazo.dias_usados == null || plazo.dias_totales == null) return 'Sin regla validada'
  return `${plazo.dias_usados} de ${plazo.dias_totales}`
}

/** Color y texto del semáforo de plazo. */
export const SEMAFORO: Record<
  Situacion,
  { tono: 'ok' | 'aviso' | 'peligro' | 'neutro'; texto: string; barra: 'ok' | 'aviso' | 'peligro' | 'marca' }
> = {
  vencido: { tono: 'peligro', texto: 'Vencido', barra: 'peligro' },
  por_vencer: { tono: 'aviso', texto: 'Por vencer', barra: 'aviso' },
  en_plazo: { tono: 'ok', texto: 'En plazo', barra: 'marca' },
  concluido: { tono: 'neutro', texto: 'Concluido', barra: 'marca' },
  pendiente_de_validacion: { tono: 'neutro', texto: 'Por validar', barra: 'marca' },
}
