import type { Situacion } from '../../types/tramite'

/** Color y texto del semáforo de plazo. */
export const SEMAFORO: Record<
  Situacion,
  { tono: 'ok' | 'aviso' | 'peligro' | 'neutro'; texto: string; barra: 'ok' | 'aviso' | 'peligro' | 'marca' }
> = {
  vencido: { tono: 'peligro', texto: 'Vencido', barra: 'peligro' },
  por_vencer: { tono: 'aviso', texto: 'Por vencer', barra: 'aviso' },
  en_plazo: { tono: 'ok', texto: 'En plazo', barra: 'marca' },
  concluido: { tono: 'neutro', texto: 'Concluido', barra: 'marca' },
}
