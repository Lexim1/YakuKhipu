// EJEMPLOS DE DEMOSTRACIÓN de la consulta ciudadana. Misma forma que GET /api/publico/decisiones.
// La decisión de EPS Tacna se basa en la RCD 032-2026; Río Claro y Altiplano son simuladas.

import type { CifraSector, DecisionPublica, DecisionResumen } from '../types/publico'

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
    ficha_disponible: true,
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
    ficha_disponible: true,
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

// Ficha pública completa. Misma forma que GET /api/publico/decisiones/{id}.
// Textos y cifras del Figma («Ciudadanía 2 · Ficha de la decisión»). Lo ejecutado y dos datos de
// impacto son simulados. Verificar solicitado y autorizado con la RCD 032-2026 antes de publicar.
const [TACNA, RIO_CLARO, ALTIPLANO] = DECISIONES

export const FICHAS_PUBLICAS: DecisionPublica[] = [
  {
    ...TACNA,
    titulo: 'Compra de medidores en Tacna',
    resumen_ciudadano: 'Sunass autorizó que EPS Tacna use recursos propios para medir el agua de cada hogar.',
    solicitado: {
      valor: 25000,
      unidad: 'medidores',
      texto: '25 000 medidores',
      fecha: '2026-07-17',
      origen: 'Solicitud de EPS Tacna',
      simulado: false,
      estimado: false,
    },
    autorizado: {
      valor: 19935,
      unidad: 'medidores',
      texto: '19 935 medidores',
      fecha: '2026-08-28',
      origen: 'RCD 032-2026',
      simulado: false,
      estimado: false,
      monto_texto: 'S/ 3 817 752',
    },
    ejecutado: {
      valor: 4210,
      unidad: 'medidores',
      texto: '4 210 instalados',
      fecha: '2026-11-15',
      origen: 'Reporte de avance',
      simulado: true,
      estimado: false,
    },
    impacto: [
      {
        pregunta: '¿Dónde?',
        texto: 'Tacna, Pachía y Locumba.',
        condicion: 'verificado',
        fuente_id: 'rcd-032-cuadro-2',
        fuente_prevista: null,
      },
      {
        pregunta: '¿Qué se hará?',
        texto:
          'Cambiar 12 527 medidores antiguos e instalar 7 408 en conexiones que hoy pagan un consumo asignado, sin medición.',
        condicion: 'verificado',
        fuente_id: 'rcd-032-numeral-3-13',
        fuente_prevista: null,
      },
      {
        pregunta: 'Hogares con jefatura femenina',
        texto: '38 % de los hogares de la zona tiene jefatura femenina (≈ 7 600 hogares).',
        condicion: 'simulado',
        fuente_id: null,
        fuente_prevista: 'INEI, por distrito',
      },
      {
        pregunta: 'Horas con servicio de agua',
        texto: '19 h al día en promedio; 2 sectores reciben menos de 6 h.',
        condicion: 'simulado',
        fuente_id: null,
        fuente_prevista: 'SIEPS, Sunass',
      },
    ],
    fuentes: [
      { id: 'rcd-032', titulo: 'RCD 032-2026', pagina: null, articulo: null, enlace: null },
      { id: 'rcd-032-cuadro-2', titulo: 'RCD 032-2026', pagina: null, articulo: 'Cuadro 2', enlace: null },
      { id: 'rcd-032-numeral-3-13', titulo: 'RCD 032-2026', pagina: null, articulo: 'Numeral 3.13', enlace: null },
    ],
    consulta: null,
  },
  // Caso simulado sin decisión ni ejecución: sirve para probar «Sin dato de ejecución» y «No disponible».
  {
    ...RIO_CLARO,
    solicitado: {
      valor: 436595,
      unidad: 'soles',
      texto: 'S/ 436 595',
      fecha: '2026-10-20',
      origen: 'Solicitud de EPS Río Claro · simulada',
      simulado: true,
      estimado: false,
    },
    ejecutado: null,
    impacto: [
      {
        pregunta: '¿Dónde?',
        texto: 'Río Claro, en el tramo de la tubería dañada.',
        condicion: 'simulado',
        fuente_id: null,
        fuente_prevista: 'Solicitud de la EPS',
      },
      {
        pregunta: 'Hogares beneficiados',
        texto: null,
        condicion: 'simulado',
        fuente_id: null,
        fuente_prevista: null,
      },
    ],
    fuentes: [],
    consulta: null,
  },
  // Caso simulado en consulta pública: muestra la audiencia y la fecha para opinar.
  {
    ...ALTIPLANO,
    solicitado: null,
    ejecutado: null,
    impacto: [],
    fuentes: [],
    consulta: {
      audiencia_texto: 'Audiencia pública el 3 de diciembre',
      fecha_limite: '2026-12-10',
      fecha_limite_texto: '10 dic 2026',
      enlace: null,
    },
  },
]
