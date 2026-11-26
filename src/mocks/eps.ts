// EJEMPLOS DE DEMOSTRACIÓN de la vista EPS. Misma forma que GET /api/eps/tramites y /api/eps/tramites/{id}.
// CPI-2026-0007 se basa en el expediente de medidores de EPS Tacna; estados, fechas y plazos son simulados.
// UFI-2025-0003 y la revisión periódica son ejemplos. Textos tomados del Figma (EPS 1, 2 y 3 y los
// mensajes por estado de «Rutas y estados»).

import type { TramiteEps, TramiteEpsResumen } from '../types/eps'

export const FICHAS_EPS: TramiteEps[] = [
  {
    id: 'CPI-2026-0007',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'CPI',
    titulo: 'Cambio del programa de inversiones',
    estado: 'requiere_respuesta',
    estado_texto: 'Necesitamos tu respuesta',
    resumen: 'Sunass necesita estos 8 puntos para evaluar tu solicitud.',
    simulado: true,
    siguiente_accion: {
      tipo: 'informar_presentacion',
      etiqueta: 'Respuesta',
      titulo: 'Responde el Oficio 156',
      texto: 'Preparar respuesta',
      instrucciones: null,
      canal: 'Mesa de Partes Virtual de Sunass',
      fecha_limite: '2026-08-14',
      fecha_texto: '14 ago',
      fecha_detalle: '3 días hábiles + 2 de ampliación',
      dias_restantes: 2,
      fuente_documento_id: 'oficio-162',
      requisitos: [
        { id: 'r1', texto: 'Causal del cambio (art. 93.1)', preparado: true },
        { id: 'r2', texto: 'Efecto en las metas de gestión', preparado: true },
        { id: 'r3', texto: 'Sustento de los medidores frente a los 36 498 del programa', preparado: true },
        { id: 'r4', texto: 'Avance de ejecución a marzo de 2026', preparado: false },
        { id: 'r5', texto: 'Base de datos de antigüedad (Excel)', preparado: false },
        { id: 'r6', texto: 'Renovación y nuevas instalaciones por localidad', preparado: false },
        { id: 'r7', texto: 'Comparación ultrasónico vs. chorro múltiple', preparado: false },
        { id: 'r8', texto: 'Detalle del costo unitario (S/ 212,83)', preparado: false },
      ],
    },
    documentos: [
      {
        id: 'oficio-156',
        titulo: 'Oficio 156',
        pagina: 1,
        resumen: 'Sunass pide 8 puntos de sustento para evaluar el cambio del programa de inversiones.',
      },
      {
        id: 'oficio-162',
        titulo: 'Oficio 162',
        pagina: 1,
        resumen: 'Sunass amplía el plazo de respuesta en 2 días hábiles.',
      },
    ],
    seguimiento: [
      { titulo: 'Presentaste tu solicitud', fecha_texto: '17 jul', estado: 'hecho' },
      { titulo: 'Sunass te pidió información', fecha_texto: '11 ago', estado: 'hecho' },
      { titulo: 'Tu respuesta al Oficio 156', fecha_texto: 'Vence el 14 ago', estado: 'actual' },
      { titulo: 'Sunass evalúa tu respuesta', fecha_texto: 'Después de tu respuesta', estado: 'pendiente' },
      { titulo: 'Decisión del Consejo Directivo', fecha_texto: 'Te avisaremos cuando se publique', estado: 'pendiente' },
    ],
    aviso: null,
    respuesta_informada: null,
  },
  {
    id: 'UFI-2025-0003',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'UFI',
    titulo: 'Uso del fondo · equipos de bombeo',
    estado: 'autorizado',
    estado_texto: 'Autorizado',
    resumen: 'Sunass autorizó el uso del fondo. No tienes tareas pendientes en este trámite.',
    simulado: true,
    siguiente_accion: null,
    documentos: [{ id: 'resolucion-ufi-0003', titulo: 'Resolución de autorización', pagina: 1 }],
    seguimiento: [
      { titulo: 'Presentaste tu solicitud', fecha_texto: '12 feb', estado: 'hecho' },
      { titulo: 'Sunass evaluó tu solicitud', fecha_texto: '20 feb', estado: 'hecho' },
      { titulo: 'Sunass autorizó el uso del fondo', fecha_texto: '3 mar', estado: 'hecho' },
    ],
    aviso: null,
    respuesta_informada: null,
  },
  {
    id: 'RP-2026-0003',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'RP',
    titulo: 'Revisión periódica de tarifas',
    estado: 'en_evaluacion',
    estado_texto: 'En evaluación',
    resumen: 'Sunass está evaluando tu propuesta. Por ahora no tienes ninguna tarea pendiente.',
    simulado: true,
    siguiente_accion: null,
    documentos: [],
    seguimiento: [
      { titulo: 'Presentaste tu propuesta', fecha_texto: '2 jun', estado: 'hecho' },
      { titulo: 'Sunass evalúa la propuesta', fecha_texto: 'Etapa activa', estado: 'actual' },
      { titulo: 'Publicación del proyecto y audiencia', fecha_texto: 'Pendiente', estado: 'pendiente' },
      { titulo: 'Decisión del Consejo Directivo', fecha_texto: 'Te avisaremos cuando se publique', estado: 'pendiente' },
    ],
    aviso: null,
    respuesta_informada: null,
  },
]

/**
 * Ejemplos de otros estados del Figma («mensajes para la EPS»). No aparecen en la lista para que
 * «Mis trámites» coincida con el prototipo; se abren por URL para probarlos.
 */
export const FICHAS_EPS_OTROS_ESTADOS: TramiteEps[] = [
  {
    id: 'CPI-2026-0011',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'CPI',
    titulo: 'Cambio del programa · reservorio',
    estado: 'requiere_subsanacion',
    estado_texto: 'Completa tu solicitud',
    resumen: 'Sunass observó un requisito de tu solicitud.',
    simulado: true,
    siguiente_accion: {
      tipo: 'informar_presentacion',
      etiqueta: 'Subsanación',
      titulo: 'Completa tu solicitud',
      texto: 'Preparar subsanación',
      instrucciones:
        'Revisa qué requisito observó Sunass en el oficio que recibiste. Presenta la subsanación por Mesa de Partes y conserva tu cargo.',
      canal: 'Mesa de Partes Virtual de Sunass',
      fecha_limite: null,
      fecha_texto: null,
      fecha_detalle: 'Plazo indicado en tu oficio',
      dias_restantes: null,
      fuente_documento_id: null,
      requisitos: [],
    },
    aviso: null,
    documentos: [{ id: 'oficio-observacion-0011', titulo: 'Oficio de observaciones', pagina: 1 }],
    seguimiento: [
      { titulo: 'Presentaste tu solicitud', fecha_texto: '3 nov', estado: 'hecho' },
      { titulo: 'Sunass revisó los requisitos', fecha_texto: '10 nov', estado: 'hecho' },
      { titulo: 'Completa tu solicitud', fecha_texto: 'Plazo indicado en tu oficio', estado: 'actual' },
      { titulo: 'Sunass evalúa tu solicitud', fecha_texto: 'Después de la subsanación', estado: 'pendiente' },
    ],
    respuesta_informada: null,
  },
  {
    id: 'RP-2026-0004',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'RP',
    titulo: 'Revisión periódica · proyecto de tarifas',
    estado: 'en_consulta',
    estado_texto: 'En difusión pública',
    resumen: 'El proyecto de tarifas está publicado. Por ahora no tienes ninguna tarea obligatoria.',
    simulado: true,
    siguiente_accion: null,
    aviso: {
      tipo: 'participacion',
      titulo: 'Puedes enviar comentarios',
      etiqueta: 'Difusión pública · ejemplo simulado',
      texto:
        'Audiencia: 9 de septiembre. Puedes comentar el proyecto hasta el 30 de septiembre por el canal indicado en la convocatoria. Participar es opcional.',
      enlace: null,
    },
    documentos: [{ id: 'convocatoria-rp-0004', titulo: 'Convocatoria a audiencia pública', pagina: 1 }],
    seguimiento: [
      { titulo: 'Presentaste tu propuesta', fecha_texto: '2 jun', estado: 'hecho' },
      { titulo: 'Sunass publicó el proyecto', fecha_texto: '25 ago', estado: 'hecho' },
      { titulo: 'Audiencia y comentarios', fecha_texto: 'Hasta el 30 sep', estado: 'actual' },
      { titulo: 'Resolución de tarifas', fecha_texto: 'Te avisaremos cuando se publique', estado: 'pendiente' },
    ],
    respuesta_informada: null,
  },
  {
    id: 'RP-2025-0009',
    eps: 'EPS Tacna S.A.',
    procedimiento: 'RP',
    titulo: 'Revisión periódica · solicitud anterior',
    estado: 'concluido',
    estado_texto: 'Solicitud improcedente',
    resumen: 'Este trámite terminó. No tienes tareas pendientes.',
    simulado: true,
    siguiente_accion: null,
    aviso: {
      tipo: 'concluido',
      titulo: 'Solicitud improcedente',
      etiqueta: 'Trámite concluido',
      texto: 'Consulta en la resolución notificada el motivo y las indicaciones para tu caso.',
      enlace: null,
    },
    documentos: [{ id: 'resolucion-rp-0009', titulo: 'Resolución notificada', pagina: 1 }],
    seguimiento: [
      { titulo: 'Presentaste tu solicitud', fecha_texto: '14 abr', estado: 'hecho' },
      { titulo: 'Sunass evaluó tu solicitud', fecha_texto: '30 abr', estado: 'hecho' },
      { titulo: 'Sunass resolvió: improcedente', fecha_texto: '12 may', estado: 'hecho' },
    ],
    respuesta_informada: null,
  },
]

const DETALLE_LISTA: Record<string, string> = {
  'CPI-2026-0007': 'respuesta pendiente',
  'UFI-2025-0003': 'resuelto el 3 mar',
  'RP-2026-0003': 'caso de ejemplo · en evaluación',
}

/** Construye la fila del listado a partir de la ficha, para que ambos ejemplos no se contradigan. */
export function resumirFicha(f: TramiteEps): TramiteEpsResumen {
  const accion = f.siguiente_accion
  const respuesta = f.respuesta_informada && !f.respuesta_informada.verificada ? f.respuesta_informada : null
  const ESTADO_CORTO: Partial<Record<TramiteEps['estado'], string>> = {
    requiere_respuesta: 'Requiere respuesta',
    requiere_subsanacion: 'Requiere subsanación',
    en_evaluacion: 'En evaluación',
  }
  return {
    id: f.id,
    eps: f.eps,
    procedimiento: f.procedimiento,
    titulo: f.titulo,
    estado: f.estado,
    estado_texto: ESTADO_CORTO[f.estado] ?? f.estado_texto,
    detalle: respuesta ? 'Sunass evalúa tu respuesta' : (DETALLE_LISTA[f.id] ?? f.estado_texto.toLowerCase()),
    simulado: f.simulado,
    pendiente: accion
      ? {
          titulo: accion.titulo,
          fecha_texto: accion.fecha_texto,
          fecha_detalle: accion.fecha_detalle,
          dias_restantes: accion.dias_restantes,
          listos: accion.requisitos.filter((r) => r.preparado).length,
          total: accion.requisitos.length,
        }
      : null,
    respuesta: respuesta ? { documento: respuesta.documento, fecha_texto: respuesta.fecha_texto } : null,
  }
}
