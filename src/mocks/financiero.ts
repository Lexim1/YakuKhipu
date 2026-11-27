// Gestión financiera de las EPS. Cifras calculadas del dataset de muestra del Desafío 3 (Sunass):
// DS03 (programa de inversiones vigente), DS04 (ejecución hasta 2026-T2) y DS05 (fondo de inversiones).
// Son datos de muestra, no cifras oficiales. Montos en millones de soles.

export interface AvanceEps {
  eps: string
  programado: number
  ejecutado: number
}

export const FINANCIERO = {
  fuente: 'Dataset de muestra Sunass · DS03, DS04 y DS05',
  /** Programa vigente de las 20 EPS frente a lo ejecutado acumulado a 2026-T2. */
  total: { programado: 1145.8, ejecutado: 906.9 },
  /** Ejecución financiera de cada trimestre, suma de las 20 EPS. */
  ejecucion_trimestral: [
    { x: '24-T3', y: 40.65 },
    { x: '24-T4', y: 54.32 },
    { x: '25-T1', y: 54.92 },
    { x: '25-T2', y: 50.63 },
    { x: '25-T3', y: 53.86 },
    { x: '25-T4', y: 54.65 },
    { x: '26-T1', y: 67.12 },
    { x: '26-T2', y: 75.49 },
  ],
  /** Depósitos mensuales al fondo de inversiones en 2026: programado frente a efectuado. */
  fondo_2026: [
    { x: 'ene', programado: 12.54, efectuado: 11.18 },
    { x: 'feb', programado: 12.96, efectuado: 10.89 },
    { x: 'mar', programado: 12.72, efectuado: 11.19 },
    { x: 'abr', programado: 10.99, efectuado: 6.54 },
    { x: 'may', programado: 12.74, efectuado: 6.54 },
    { x: 'jun', programado: 12.64, efectuado: 7.06 },
    { x: 'jul', programado: 12.22, efectuado: 8.14 },
    { x: 'ago', programado: 10.55, efectuado: 5.37 },
  ],
  /** Las seis EPS con menor avance financiero del programa vigente. */
  menor_avance: [
    { eps: 'EPS Vertiente Andina', programado: 21.86, ejecutado: 10.83 },
    { eps: 'EPS Aguas del Bosque', programado: 30.13, ejecutado: 15.09 },
    { eps: 'EPS Aguas de la Quebrada', programado: 42.75, ejecutado: 23.61 },
    { eps: 'EPS Ojo de Agua', programado: 144.37, ejecutado: 83.54 },
    { eps: 'EPS Agua Viva', programado: 2.88, ejecutado: 1.69 },
    { eps: 'EPS Manantial', programado: 6.19, ejecutado: 3.9 },
  ] satisfies AvanceEps[],
}

/** Últimos movimientos de la bitácora (DS10, actualización al 20/11/2026). Personas por cargo. */
export const MOVIMIENTOS = [
  { quien: 'Dirección de Usuarios', avatar: '🗣️', color: '#dbeefe', punto: '#2453e6', que: 'Realizó la audiencia pública', exp: 'RP-2026-0001', fecha: '12 nov' },
  { quien: 'Consejo Directivo', avatar: '🏛️', color: '#ece4ff', punto: '#7c5cd6', que: 'Aprobó la resolución tarifaria', exp: 'RP-2025-0001', fecha: '20 oct' },
  { quien: 'Consejo Directivo', avatar: '🏛️', color: '#ece4ff', punto: '#7c5cd6', que: 'Emitió la resolución', exp: 'CPI-2026-0004', fecha: '14 oct' },
  { quien: 'Gerencia General', avatar: '📰', color: '#fbf3c4', punto: '#c9a400', que: 'Publicó el proyecto en El Peruano', exp: 'RP-2026-0001', fecha: '13 oct' },
  { quien: 'Consejo Directivo', avatar: '🏛️', color: '#ece4ff', punto: '#7c5cd6', que: 'Emitió la resolución', exp: 'UFI-2026-0001', fecha: '12 oct' },
  { quien: 'DRE', avatar: '✍️', color: '#d6f5e8', punto: '#3fb59b', que: 'Firmó el memorándum a la GG', exp: 'RP-2025-0001', fecha: '9 oct' },
]
