// EJEMPLOS DE DEMOSTRACIÓN con la forma de los tipos de src/types/tramite.ts.
// CPI-2026-0007 (EPS Tacna) se basa en el expediente real: oficios, hoja de trámite y cifras de la RCD 032-2026.
// Las demás EPS (Selva Alta, Manantial, Costa Sur, Río Claro, Pampa Verde, Altiplano) son simuladas.
// Se usan cargos en lugar de nombres de personas.

import type {
  Alerta,
  DocumentoRecibido,
  EstadoPaso,
  Expediente,
  Flujograma,
  Procedimiento,
  TramiteResumen,
} from '../types/tramite'

export const TRAMITES: TramiteResumen[] = [
  {
    id: 'RP-2025-0001',
    procedimiento: 'RP',
    eps: 'EPS Selva Alta',
    tamano_eps: 'Grande',
    etapa: 'Evaluación de comentarios',
    responsable: 'Equipo SRT · Especialista',
    plazo: { situacion: 'vencido', dias_usados: 64, dias_totales: 60, etapa: 'Aprobación' },
    simulado: true,
  },
  {
    id: 'CPI-2026-0004',
    procedimiento: 'CPI',
    eps: 'EPS Manantial',
    tamano_eps: 'Pequeña',
    etapa: 'Elevación al Consejo',
    responsable: 'Gerencia General',
    plazo: { situacion: 'vencido', dias_usados: 37, dias_totales: 30, etapa: null },
    simulado: true,
  },
  {
    id: 'RP-2026-0002',
    procedimiento: 'RP',
    eps: 'EPS Costa Sur',
    tamano_eps: 'Mediana',
    etapa: 'Evaluación de comentarios',
    responsable: 'Equipo SRT · Especialista',
    plazo: { situacion: 'por_vencer', dias_usados: 48, dias_totales: 60, etapa: 'Aprobación' },
    simulado: true,
  },
  {
    id: 'UFI-2026-0001',
    procedimiento: 'UFI',
    eps: 'EPS Río Claro',
    tamano_eps: 'Pequeña',
    etapa: 'Memorando a Gerencia',
    responsable: 'DRE',
    plazo: { situacion: 'por_vencer', dias_usados: 23, dias_totales: 30, etapa: null },
    simulado: true,
  },
  {
    id: 'CPI-2026-0007',
    procedimiento: 'CPI',
    eps: 'EPS Tacna',
    tamano_eps: 'Mediana',
    etapa: 'Revisión · informe técnico',
    responsable: 'Equipo SRT · Especialista',
    plazo: { situacion: 'en_plazo', dias_usados: 18, dias_totales: 30, etapa: null },
    simulado: true,
  },
  {
    id: 'CPI-2026-0003',
    procedimiento: 'CPI',
    eps: 'EPS Pampa Verde',
    tamano_eps: 'Pequeña',
    etapa: 'Revisión de la subdirección',
    responsable: 'Subdirección SRT',
    plazo: { situacion: 'en_plazo', dias_usados: 17, dias_totales: 30, etapa: null },
    simulado: true,
  },
  {
    id: 'RP-2026-0001',
    procedimiento: 'RP',
    eps: 'EPS Altiplano',
    tamano_eps: 'Grande',
    etapa: 'Resolución para difusión',
    responsable: 'Consejo Directivo',
    plazo: { situacion: 'en_plazo', dias_usados: 32, dias_totales: 60, etapa: 'Evaluación' },
    simulado: true,
  },
]

// Pasos de cada procedimiento según el flujograma del Figma.
const PASOS: Record<Procedimiento, [string, string][]> = {
  CPI: [
    ['Solicitud', 'EPS · Mesa de Partes'],
    ['Deriva a SRT', 'DRE · meta 1 DH'],
    ['Asigna equipo', 'SRT'],
    ['Verifica requisitos TUPA', 'Equipo SRT'],
    ['Evalúa información', 'Equipo SRT'],
    ['Informe y proyecto de resolución', 'Equipo SRT'],
    ['Firma SRT y memo a GG', 'SRT y DRE'],
    ['Resolución', 'GG eleva · CD aprueba'],
  ],
  UFI: [
    ['Solicitud', 'EPS · Mesa de Partes'],
    ['Deriva a SRT', 'DRE · meta 1 DH'],
    ['Asigna equipo', 'SRT'],
    ['Verifica requisitos TUPA', 'Equipo SRT'],
    ['Evalúa información', 'Equipo SRT'],
    ['Informe único', 'SRT visa · OAJ y DRE firman'],
    ['Memo a GG', 'DRE'],
    ['Eleva al CD', 'Gerencia General'],
    ['Resolución', 'Consejo Directivo'],
  ],
  RP: [
    ['Inicio', 'EPS, DRE y SRT · máx. 30 DH'],
    ['Evaluación', 'Equipo SRT · máx. 60 DH'],
    ['Difusión aprobada', 'GG eleva · CD aprueba'],
    ['Audiencia pública', 'Dirección de Usuarios · máx. 30 DH'],
    ['Comentarios', 'EPS e interesados · hasta 15 DH'],
    ['Informe, estudio y proyecto final', 'Equipo SRT'],
    ['Firma SRT y memo a GG', 'SRT y DRE'],
    ['Resolución tarifaria', 'GG eleva · CD aprueba'],
  ],
}

export const ENCABEZADO_FLUJO: Record<Procedimiento, string> = {
  CPI: 'Flujograma · Cambio al programa de inversiones · Art. 93 RGT',
  UFI: 'Flujograma · Uso excepcional del fondo de inversiones · Art. 89 RGT',
  RP: 'Flujograma · Revisión periódica (estudio tarifario) · Arts. 45-49 RGT',
}

const NOTA_FLUJO: Record<Procedimiento, string> = {
  CPI: 'Plazo máximo: 30 días hábiles (Art. 93 RGT). Metas internas del anexo: subsanación TUPA máx. 2 DH · información adicional hasta 10 DH · evaluación en SRT 24 DH · firma y decisión (DRE, GG y CD) 5 DH. Si no subsana, se cierra el procedimiento.',
  UFI: 'Plazo máximo: 30 días hábiles (Art. 89 RGT). Metas internas del anexo: subsanación TUPA máx. 2 DH · información adicional hasta 10 DH · evaluación 24 DH · firma y decisión 5 DH. El informe es único: SRT visa, OAJ y DRE firman.',
  RP: 'Metas por etapa del flujograma: inicio 30 DH · evaluación 60 DH · difusión 45 DH desde el día siguiente de la publicación en El Peruano · aprobación 60 DH.',
}

/** Construye el flujograma marcando como hechos los pasos anteriores al actual. */
function flujo(
  procedimiento: Procedimiento,
  actual: number,
  titulo: string,
  chip: string,
  notas: Partial<Record<number, string>> = {},
  detalles: Partial<Record<number, string>> = {},
  extraNota = '',
): Flujograma {
  return {
    encabezado: ENCABEZADO_FLUJO[procedimiento],
    titulo,
    chip,
    nota: `${NOTA_FLUJO[procedimiento]}${extraNota}`,
    pasos: PASOS[procedimiento].map(([t, d], i) => {
      const estado: EstadoPaso = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente'
      return {
        titulo: t,
        detalle: detalles[i] ?? d,
        estado,
        nota: notas[i] ?? (estado === 'hecho' ? '✓ Hecho' : estado === 'actual' ? 'Aquí está' : 'Pendiente'),
      }
    }),
  }
}

const TACNA: Expediente = {
  ...TRAMITES[4],
  tema: 'Adquisición de medidores',
  chip_plazo: 'En plazo · 18 de 30 días hábiles',
  flujo: flujo(
    'CPI',
    5,
    'Paso 6 de 8 · Lo tiene el Equipo SRT desde el 14 ago',
    'Día 18 de 30 días hábiles · en plazo',
    { 0: '✓ 17 jul', 3: '✓ Cumple', 4: '✓ 7 ago → EPS remitió 14 ago', 5: 'Aquí está · desde 14 ago' },
    { 4: 'Equipo SRT · pidió info. adicional', 5: 'Equipo SRT · Especialista' },
  ),
  siguiente: {
    titulo: 'Validar el vínculo del Oficio 1628',
    detalle: 'Al confirmarlo, la cifra de 14 902 entra al comparador.',
    responsable: null,
    boton: 'Validar ahora',
    accion: 'validar',
    urgente: false,
  },
  linea_tiempo: [
    {
      id: 'h1',
      fecha_texto: '17 jul',
      titulo: 'Solicitud de cambio del programa',
      detalle: 'EPS Tacna · 25 000 medidores',
      chip: { texto: 'Recibida', tono: 'ok' },
      fuente: 'Oficio 1447',
      validar: false,
    },
    {
      id: 'h2',
      fecha_texto: '7 ago',
      titulo: 'Requerimiento de información',
      detalle: 'SRT · 3 días hábiles · notificado el 11 ago',
      chip: { texto: 'Notificado', tono: 'ok' },
      fuente: 'Oficio 156',
      validar: false,
    },
    {
      id: 'h3',
      fecha_texto: '12 ago',
      titulo: 'Pedido de ampliación',
      detalle: 'EPS Tacna',
      chip: { texto: 'Recibido', tono: 'ok' },
      fuente: 'Oficio 1590',
      validar: false,
    },
    {
      id: 'h4',
      fecha_texto: '13 ago',
      titulo: 'Ampliación concedida',
      detalle: 'SRT · 2 días hábiles más',
      chip: { texto: 'Notificada', tono: 'ok' },
      fuente: 'Oficio 162',
      validar: false,
    },
    {
      id: 'h5',
      fecha_texto: '14 ago',
      titulo: 'Respuesta de la EPS',
      detalle: '14 902 medidores',
      chip: { texto: 'Vínculo por validar', tono: 'agente' },
      fuente: 'Oficio 1628',
      validar: true,
    },
    {
      id: 'h6',
      fecha_texto: '20 ago',
      titulo: 'Nueva cifra por correo',
      detalle: '19 935 medidores',
      chip: { texto: 'No consta en el expediente', tono: 'aviso' },
      fuente: 'RCD 032 · nota 9',
      validar: false,
    },
    {
      id: 'h7',
      fecha_texto: 'Próximo',
      titulo: 'Informe técnico',
      detalle: 'Especialista SRT · vence en 12 días hábiles',
      chip: { texto: 'Pendiente', tono: 'neutro' },
      fuente: null,
      validar: false,
    },
  ],
  resumen: [
    { etiqueta: 'Solicitado', valor: '25 000 medidores' },
    { etiqueta: 'Última cifra', valor: '19 935 medidores' },
    { etiqueta: 'Monto propuesto', valor: 'S/ 3 817 752' },
    { etiqueta: 'Hoja de trámite', valor: '2026-E01-061121' },
  ],
  comparador: {
    titulo: 'Cantidad de medidores por versión',
    versiones: [
      {
        valor: '25 000',
        titulo: 'Solicitud inicial',
        detalle: 'Base',
        fuente: 'Informe 031 · numeral 10',
        sin_documento: false,
      },
      {
        valor: '14 902',
        titulo: 'Respuesta al requerimiento',
        detalle: '−10 098 frente a la solicitud',
        fuente: 'Oficio 1628 · RCD 032, nota 9',
        sin_documento: false,
      },
      {
        valor: '19 935',
        titulo: 'Actualización de la EPS',
        detalle: '+5 033 frente a la respuesta',
        fuente: 'Correo del 20 ago · RCD 032, nota 9',
        sin_documento: true,
      },
    ],
    aviso: 'La cifra final llegó por correo. Pide el documento antes de cerrar el informe.',
    evaluacion: {
      cantidad: '19 935',
      unidad: 'medidores ultrasónicos',
      monto: 'S/ 3 817 752',
      filas: [
        { etiqueta: 'Renovación', valor: '12 527' },
        { etiqueta: 'Nuevas instalaciones', valor: '7 408' },
        { etiqueta: 'Costo unitario', valor: 'S/ 191,51' },
      ],
    },
  },
  plazos: {
    tarjetas: [
      {
        tipo: 'Normativo',
        valor: '30 días hábiles',
        detalle: 'Máximo del procedimiento · art. 93 RGT',
        usado: 18,
        total: 30,
        pie: 'Usados 18 · quedan 12',
      },
      {
        tipo: 'Interno',
        valor: '24 días hábiles',
        detalle: 'Meta del equipo para el informe',
        usado: 14,
        total: 24,
        pie: 'Usados 14 · quedan 10',
      },
      {
        tipo: 'Del oficio',
        valor: '3 + 2 días hábiles',
        detalle: 'Oficio 156 y ampliación del Oficio 162',
        usado: 5,
        total: 5,
        pie: 'Respondido el 14 ago · a tiempo',
      },
    ],
    proximas: [
      { fecha_texto: '24 ago', titulo: 'Informe técnico al coordinador', chip: { texto: 'Meta interna', tono: 'ok' } },
      {
        fecha_texto: '26 ago',
        titulo: 'Elevación a Gerencia General',
        chip: { texto: 'Memorando DRE', tono: 'neutro' },
      },
      {
        fecha_texto: '2 set',
        titulo: 'Vence el plazo del procedimiento',
        chip: { texto: 'Fecha referencial', tono: 'aviso' },
      },
    ],
    nota: 'Cronograma del ejemplo. Confirmar la notificación, el calendario y la regla aplicable antes de fijar un vencimiento.',
  },
  impacto: {
    indicadores: [
      {
        etiqueta: 'Conexiones beneficiadas',
        valor: '19 935',
        detalle: '12 527 renovadas · 7 408 nuevas',
        tono: 'marca',
      },
      {
        etiqueta: 'Hogares con jefatura femenina',
        valor: '38 %',
        detalle: '≈ 7 600 hogares en la zona',
        tono: 'agente',
      },
      { etiqueta: 'Horas de servicio al día', valor: '19 h', detalle: '2 sectores con menos de 6 h', tono: 'aviso' },
      { etiqueta: 'Monto del cambio', valor: 'S/ 3,82 M', detalle: 'EPS Tacna · región Tacna', tono: 'marca' },
    ],
    datos: [
      { pregunta: '¿Dónde?', estado: 'Verificado', texto: 'Tacna, Pachía y Locumba.', fuente: 'RCD 032 · cuadro 2' },
      {
        pregunta: '¿Qué se hará?',
        estado: 'Verificado',
        texto:
          'Cambiar 12 527 medidores antiguos e instalar 7 408 en conexiones que hoy pagan un consumo asignado, sin medición.',
        fuente: 'RCD 032 · numeral 3.13',
      },
      {
        pregunta: 'Hogares con jefatura femenina',
        estado: 'Simulado',
        texto: '38 % de los hogares de la zona tiene jefatura femenina (≈ 7 600 hogares).',
        fuente: 'Fuente prevista: INEI, por distrito',
      },
      {
        pregunta: 'Horas con servicio de agua',
        estado: 'Simulado',
        texto: '19 h al día en promedio; 2 sectores reciben menos de 6 h.',
        fuente: 'Fuente prevista: SIEPS, Sunass',
      },
    ],
    localidades: [
      { nombre: 'Tacna', renovacion: 12527, nuevas: 7262 },
      { nombre: 'Pachía', renovacion: null, nuevas: 99 },
      { nombre: 'Locumba', renovacion: null, nuevas: 47 },
    ],
    fuente_localidades: 'RCD 032 · cuadro 2',
  },
  vinculo: {
    documento: 'Oficio 1628',
    eps_fecha: 'EPS Tacna · 14 ago 2026',
    responde_a: 'Oficio 156',
    responde_detalle: 'Requerimiento de información',
    evidencia: '«REF.: Oficio N.° 00156-2026-SUNASS-DRE-SRT»',
    fuente: 'Oficio 1628 · pág. 1',
    efecto: 'Al confirmar, la cifra de 14 902 medidores entra al comparador y queda registrado quién validó.',
  },
  historial: null,
}

const RIO_CLARO: Expediente = {
  ...TRAMITES[3],
  tema: 'Equipos de bombeo por emergencia',
  chip_plazo: 'Por vencer · 23 de 30 días hábiles',
  flujo: flujo(
    'UFI',
    6,
    'Paso 7 de 9 · Lo tiene la DRE: memorando a Gerencia General',
    'Día 23 de 30 días hábiles · por vencer',
    { 4: '✓ Sin info. adicional', 6: 'Aquí está · día 23' },
    {},
    ' Datos de este trámite: simulados.',
  ),
  siguiente: {
    titulo: 'Firmar el memorando a Gerencia General',
    detalle: 'Quedan 7 días hábiles para resolver. El anexo prevé 5 DH para la firma y la decisión de DRE, GG y CD.',
    responsable: 'Coordinación DRE',
    boton: 'Ver alertas de plazo',
    accion: 'alertas',
    urgente: true,
  },
  linea_tiempo: null,
  resumen: null,
  comparador: null,
  plazos: null,
  impacto: null,
  vinculo: null,
  historial: [
    {
      fecha_texto: '1 oct',
      titulo: 'Solicitud por Mesa de Partes',
      detalle: 'EPS · Carta de solicitud · causal: emergencia',
      actual: false,
    },
    { fecha_texto: '2 oct', titulo: 'Deriva a SRT', detalle: 'DRE · Hoja de trámite', actual: false },
    { fecha_texto: '3 oct', titulo: 'Asigna equipo', detalle: 'SRT · —', actual: false },
    {
      fecha_texto: '7 oct',
      titulo: 'Cumple requisitos del TUPA',
      detalle: 'Equipo SRT · Lista de verificación',
      actual: false,
    },
    {
      fecha_texto: '24 oct',
      titulo: 'Informe único firmado',
      detalle: 'SRT: visado registrado · DRE y OAJ: firmas registradas',
      actual: false,
    },
    {
      fecha_texto: '28 oct',
      titulo: 'Memorando a Gerencia en preparación',
      detalle: 'Coordinación DRE · Memorando (borrador)',
      actual: true,
    },
  ],
}

const COSTA_SUR: Expediente = {
  ...TRAMITES[2],
  tema: 'Nuevo periodo regulatorio y estudio tarifario',
  chip_plazo: 'Aprobación · 48 de 60 DH',
  flujo: flujo(
    'RP',
    5,
    'Etapa 4 de 4 · Aprobación · Lo tiene el Equipo SRT',
    'Aprobación · día 48 de 60 · por vencer',
    {},
    { 5: 'Equipo SRT · Especialista' },
    ' Caso simulado.',
  ),
  siguiente: {
    titulo: 'Terminar el informe, el estudio tarifario final y el proyecto de resolución',
    detalle: 'Quedan 12 días hábiles de la etapa de aprobación. Caso simulado.',
    responsable: 'Especialista, Equipo SRT',
    boton: 'Ver alertas de plazo',
    accion: 'alertas',
    urgente: true,
  },
  linea_tiempo: null,
  resumen: null,
  comparador: null,
  plazos: null,
  impacto: null,
  vinculo: null,
  historial: [
    { fecha_texto: 'Etapa 1', titulo: 'Resolución de inicio', detalle: 'DRE · Resolución de inicio', actual: false },
    {
      fecha_texto: 'Etapa 2',
      titulo: 'Proyecto de estudio tarifario y de resolución',
      detalle: 'Equipo SRT · Informe y proyecto de ET',
      actual: false,
    },
    {
      fecha_texto: 'Etapa 2',
      titulo: 'Consejo Directivo aprueba la difusión',
      detalle: 'GG eleva · CD aprueba · Resolución de difusión',
      actual: false,
    },
    {
      fecha_texto: 'Etapa 3',
      titulo: 'Publicación en El Peruano',
      detalle: '1 set · El Peruano · difusión desde el 2 set (simulado)',
      actual: false,
    },
    {
      fecha_texto: 'Etapa 3',
      titulo: 'Audiencia pública',
      detalle: 'DU · 9 set · audiencia realizada (simulado)',
      actual: false,
    },
    {
      fecha_texto: 'Etapa 3',
      titulo: 'Recepción de comentarios',
      detalle: 'Cierre: 30 set · 15 DH después de la audiencia · comentarios recibidos',
      actual: false,
    },
    {
      fecha_texto: 'Etapa 4',
      titulo: 'Evaluación de comentarios en curso',
      detalle: 'Equipo SRT · Especialista · Matriz de comentarios (borrador)',
      actual: true,
    },
  ],
}

/** Paso actual de los casos que solo tienen datos básicos. */
const PASO_ACTUAL: Record<string, number> = {
  'RP-2025-0001': 5,
  'CPI-2026-0004': 7,
  'CPI-2026-0003': 6,
  'RP-2026-0001': 2,
}

const TONO_SITUACION = { en_plazo: 'en plazo', por_vencer: 'por vencer', vencido: 'vencido', concluido: 'concluido' }

/** Detalle básico para los casos simulados sin datos propios. */
function expedienteBasico(t: TramiteResumen): Expediente {
  const actual = PASO_ACTUAL[t.id] ?? 0
  const total = PASOS[t.procedimiento].length
  const dias = `${t.plazo.dias_usados} de ${t.plazo.dias_totales} días hábiles`
  return {
    ...t,
    tema: 'Caso simulado',
    chip_plazo: `${t.plazo.etapa ? `${t.plazo.etapa} · ` : ''}${dias}`,
    flujo: flujo(
      t.procedimiento,
      actual,
      `Paso ${actual + 1} de ${total} · Lo tiene ${t.responsable}`,
      `${t.plazo.etapa ? `${t.plazo.etapa} · ` : ''}día ${t.plazo.dias_usados} de ${t.plazo.dias_totales} · ${TONO_SITUACION[t.plazo.situacion]}`,
      {},
      {},
      ' Caso simulado.',
    ),
    siguiente: {
      titulo: `Continuar: ${t.etapa}`,
      detalle: `${dias}. Caso simulado sin documentos cargados.`,
      responsable: t.responsable,
      boton: 'Ver alertas de plazo',
      accion: 'alertas',
      urgente: t.plazo.situacion !== 'en_plazo',
    },
    linea_tiempo: null,
    resumen: null,
    comparador: null,
    plazos: null,
    impacto: null,
    vinculo: null,
    historial: [],
  }
}

const DETALLES: Record<string, Expediente> = {
  'CPI-2026-0007': TACNA,
  'UFI-2026-0001': RIO_CLARO,
  'RP-2026-0002': COSTA_SUR,
}

export function expedienteDeEjemplo(id: string): Expediente | null {
  if (DETALLES[id]) return DETALLES[id]
  const t = TRAMITES.find((x) => x.id === id)
  return t ? expedienteBasico(t) : null
}

export const DOCUMENTOS_RECIBIDOS: DocumentoRecibido[] = [
  {
    id: 'oficio-1628',
    titulo: 'Oficio 1628-2026',
    eps: 'EPS Tacna',
    fecha_texto: '14 ago, 09:12',
    hoja: '2026-E01-067906',
    canal_oficial: true,
    detalle: null,
    propuesta: {
      tramite_id: 'CPI-2026-0007',
      motivo: 'responde al Oficio 156',
      confianza: 'alta',
      fuente: 'Oficio 1628 · pág. 1',
    },
  },
  {
    id: 'oficio-0211',
    titulo: 'Oficio 0211-2026',
    eps: 'EPS Río Claro',
    fecha_texto: '14 ago, 11:40',
    hoja: '2026-E01-068114',
    canal_oficial: true,
    detalle: null,
    propuesta: {
      tramite_id: 'UFI-2026-0001',
      motivo: 'subsana requisitos',
      confianza: 'media',
      fuente: 'Oficio 0211 · pág. 2',
    },
  },
  {
    id: 'correo-tacna',
    titulo: 'Correo de EPS Tacna · 20 ago',
    eps: 'EPS Tacna',
    fecha_texto: '20 ago',
    hoja: null,
    canal_oficial: false,
    detalle: 'Ficha actualizada: 19 935 medidores',
    propuesta: null,
  },
]

export const ASIGNABLES = [
  { id: 'srt-1', texto: 'Especialista SRT · Equipo 1', menor_carga: true },
  { id: 'srt-2', texto: 'Especialista SRT · Equipo 2', menor_carga: false },
  { id: 'subdireccion', texto: 'Subdirección SRT', menor_carga: false },
]

export const TIPOS_ACTUACION = [
  'Respuesta a requerimiento',
  'Subsanación de requisitos',
  'Solicitud nueva',
  'Otro documento',
]

export const ALERTAS: Alerta[] = [
  {
    id: 'a1',
    tipo: 'vencido',
    titulo: 'RP-2025-0001 · EPS Selva Alta',
    detalle: 'Aprobación · 64 de 60 días hábiles (simulado)',
    regla: 'Regla interna: la etapa superó su plazo de referencia',
    fuente: 'Bitácora del expediente',
    destino: { tipo: 'expediente', id: 'RP-2025-0001' },
    accion: 'Ver expediente',
  },
  {
    id: 'a2',
    tipo: 'vencido',
    titulo: 'CPI-2026-0004 · EPS Manantial',
    detalle: '37 de 30 días hábiles · en Gerencia General',
    regla: 'Regla: días hábiles mayores al plazo máximo',
    fuente: 'Bitácora del expediente',
    destino: { tipo: 'expediente', id: 'CPI-2026-0004' },
    accion: 'Ver expediente',
  },
  {
    id: 'a3',
    tipo: 'por_vencer',
    titulo: 'RP-2026-0002 · EPS Costa Sur',
    detalle: 'Aprobación · 48 de 60 días hábiles (80 %)',
    regla: 'Umbral interno: 75 % de la etapa',
    fuente: 'Bitácora del expediente',
    destino: { tipo: 'expediente', id: 'RP-2026-0002' },
    accion: 'Ver expediente',
  },
  {
    id: 'a4',
    tipo: 'cifra_sin_documento',
    titulo: 'CPI-2026-0007 · EPS Tacna',
    detalle: '19 935 medidores citados de un correo',
    regla: 'Regla: cifra citada sin documento en el expediente',
    fuente: 'RCD 032 · nota 9',
    destino: { tipo: 'expediente', id: 'CPI-2026-0007', pestana: 'comparador' },
    accion: 'Ver comparador',
  },
  {
    id: 'a5',
    tipo: 'documento_por_asociar',
    titulo: 'Oficio 1628 · EPS Tacna',
    detalle: 'El agente propone que responde al Oficio 156',
    regla: 'Regla: documento que cita a otro, sin vínculo confirmado',
    fuente: 'Oficio 1628 · pág. 1',
    destino: { tipo: 'recepcion' },
    accion: 'Ir a recepción',
  },
  {
    id: 'a6',
    tipo: 'dos_numeraciones',
    titulo: 'CPI-2026-0007 · EPS Tacna',
    detalle: 'Hojas 2026-E01-061121 y 2026-E01-067906 unificadas',
    regla: 'Regla: mismo trámite con hojas de trámite distintas',
    fuente: 'SIGED',
    destino: { tipo: 'expediente', id: 'CPI-2026-0007', pestana: 'linea' },
    accion: 'Ver línea de tiempo',
  },
]
