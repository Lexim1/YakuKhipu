// EJEMPLOS DE DEMOSTRACIÓN de la consulta ciudadana. Misma forma que GET /api/publico/decisiones.
// La decisión de EPS Tacna se basa en la RCD 032-2026; Río Claro y Altiplano son simuladas.

import type { CifraSector, DecisionResumen } from '../types/publico'

export const DECISIONES: DecisionResumen[] = [
  {
    id: 'tacna-medidores-2026',
    eps: 'EPS Tacna',
    localidad: 'Tacna, Pachía y Locumba',
    procedimiento: 'CPI',
    titulo: 'Compra de medidores',
    estado_publico: 'decision_publicada',
    cifra: '19 935 medidores · S/ 3 817 752',
    nota_estado: '28 ago 2026',
    resumen_ciudadano:
      'Sunass autorizó incluir la compra e instalación de medidores en el plan de inversiones de la EPS.',
    fecha_actualizacion: '2026-08-28',
    autorizado: {
      valor: 3817752,
      unidad: 'soles',
      texto: 'S/ 3 817 752',
      fecha: '2026-08-28',
      origen: 'RCD 032-2026',
      simulado: false,
      estimado: false,
    },
    ficha_disponible: true,
    simulado: false,
  },
  {
    id: 'rioclaro-fondo-2026',
    eps: 'EPS Río Claro',
    localidad: 'Río Claro',
    procedimiento: 'UFI',
    titulo: 'Uso del fondo por rotura de tubería',
    estado_publico: 'en_evaluacion',
    cifra: 'S/ 436 595 solicitados',
    nota_estado: 'Día 23 de 30',
    resumen_ciudadano: 'La EPS pidió usar su fondo de inversiones por una emergencia. Sunass todavía evalúa el pedido.',
    fecha_actualizacion: '2026-11-16',
    autorizado: null,
    ficha_disponible: false,
    simulado: true,
  },
  {
    id: 'altiplano-tarifas-2027',
    eps: 'EPS Altiplano',
    localidad: 'Altiplano',
    procedimiento: 'RP',
    titulo: 'Revisión de tarifas 2027–2031',
    estado_publico: 'en_consulta',
    cifra: 'Audiencia pública el 3 dic',
    nota_estado: 'Opina hasta el 10 dic',
    resumen_ciudadano: 'El proyecto de tarifas está publicado para recibir comentarios de la población.',
    fecha_actualizacion: '2026-11-10',
    autorizado: null,
    ficha_disponible: false,
    simulado: true,
  },
]

// Cifras tomadas del diseño en Figma. Verificar con los reportes citados antes de publicar.
export const CIFRAS_SECTOR: CifraSector[] = [
  { valor: '41,1 %', texto: 'de lo programado ejecutaron las EPS en 2025', fuente: 'Reporte de inversiones n.° 9' },
  {
    valor: '16 de 50',
    texto: 'EPS en nivel crítico de ejecución a junio de 2026',
    fuente: 'Reporte de inversiones n.° 9',
  },
  { valor: '3,3 millones', texto: 'de peruanos sin acceso al agua', fuente: 'Sunass · ENAPRES 2025' },
]
