// Perfiles SUNASS del Figma (Prototipo v2): cada uno ve el menú de su ámbito.
// El menú solo ordena la navegación; los permisos reales los exige el backend en cada petición.

import type { Sesion } from '../types/sesion'

export type RolSunass = 'analista_srt' | 'coordinacion_dre' | 'jefatura_dre'

export const ROLES_SUNASS: Record<RolSunass, { cargo: string; ambito: string; descripcion: string }> = {
  analista_srt: {
    cargo: 'Analista SRT',
    ambito: 'Solo expedientes asignados',
    descripcion: 'Valida datos y vínculos de tus casos. Las firmas y decisiones externas se consultan con su evidencia.',
  },
  coordinacion_dre: {
    cargo: 'Coordinación DRE',
    ambito: 'Cartera DRE · tres procedimientos',
    descripcion:
      'Incorpora documentos, asigna responsables y registra actos externos. La revisión técnica corresponde al analista.',
  },
  jefatura_dre: {
    cargo: 'Jefatura DRE',
    ambito: 'Toda la cartera DRE',
    descripcion:
      'Supervisa plazos, riesgos, trazabilidad y permisos. Los actos externos se registran con documento de sustento.',
  },
}

/**
 * Rol SUNASS de la sesión. Las cuentas de demostración sin rol (modo de ejemplos) ven la vista completa,
 * que corresponde a Jefatura DRE.
 */
export function rolSunass(sesion: Sesion | null): RolSunass {
  const rol = sesion?.rol_id
  return rol && rol in ROLES_SUNASS ? (rol as RolSunass) : 'jefatura_dre'
}
