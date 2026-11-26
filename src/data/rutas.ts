// Rutas de cada procedimiento: tarjetas de la sección «Rutas y estados · SUNASS y EPS» del Figma.
// Cada opción lleva a otra tarjeta. Las tarjetas «eps-…» muestran el aviso que ve la EPS.
// Es contenido del procedimiento (RGT y anexo), no datos de un expediente.

import type { Procedimiento } from '../types/tramite'

export interface OpcionRuta {
  texto: string
  destino: string
}

export interface TarjetaRuta {
  antetitulo: string
  titulo: string
  /** Línea breve bajo el título (avisos de la EPS). */
  subtitulo?: string
  texto: string
  opciones: OpcionRuta[]
}

export const INICIO_RUTA: Record<Procedimiento, string> = {
  CPI: 'cpi',
  UFI: 'ufi',
  RP: 'rp',
}

const avisoEps = (destino: string): OpcionRuta => ({ texto: 'Ver aviso de la EPS', destino })

export const RUTAS: Record<string, TarjetaRuta> = {
  // Cambio del programa de inversiones
  cpi: {
    antetitulo: 'Cambio del programa',
    titulo: 'Ruta del expediente',
    texto: 'Elige la situación que quieres consultar. El historial conserva el estado real del caso.',
    opciones: [
      { texto: 'Revisar requisitos', destino: 'cpi-admision' },
      { texto: 'Evaluar información', destino: 'cpi-evaluacion' },
      { texto: 'Revisar firmas y elevación', destino: 'cpi-decision' },
    ],
  },
  'cpi-admision': {
    antetitulo: 'Cambio del programa · admisión',
    titulo: '¿Cumple los requisitos?',
    texto: 'El equipo SRT verifica los requisitos del TUPA.',
    opciones: [
      { texto: 'Sí · pasar a evaluación', destino: 'cpi-evaluacion' },
      { texto: 'Falta un requisito', destino: 'cpi-subsanacion' },
    ],
  },
  'cpi-subsanacion': {
    antetitulo: 'Cambio del programa · subsanación',
    titulo: 'Esperando a la EPS',
    texto:
      'El equipo prepara el oficio y SRT lo firma. Registrar notificación y plazo de subsanación (máx. 2 DH en el anexo).',
    opciones: [
      avisoEps('eps-cpi-completa'),
      { texto: 'Subsanó · revisar expediente', destino: 'cpi-reingreso' },
      { texto: 'Sin subsanación · ver cierre', destino: 'cpi-salida' },
    ],
  },
  'cpi-reingreso': {
    antetitulo: 'Cambio del programa · reingreso',
    titulo: 'Respuesta por Mesa de Partes',
    texto: 'DRE deriva a SRT. El equipo contrasta la respuesta con el requerimiento y registra el resultado.',
    opciones: [{ texto: 'Revisar requisitos', destino: 'cpi-admision' }],
  },
  'cpi-salida': {
    antetitulo: 'Cambio del programa · salida',
    titulo: 'Cierre del procedimiento',
    texto: 'Si se confirma que la EPS no subsanó, registrar el cierre, su sustento y la comunicación a la EPS.',
    opciones: [avisoEps('eps-cpi-cerro')],
  },
  'cpi-evaluacion': {
    antetitulo: 'Cambio del programa · evaluación',
    titulo: '¿Falta información?',
    texto: 'El equipo contrasta las cifras y los documentos de sustento.',
    opciones: [
      { texto: 'Solicitar información', destino: 'cpi-requerimiento' },
      { texto: 'Información suficiente', destino: 'cpi-decision' },
    ],
  },
  'cpi-requerimiento': {
    antetitulo: 'Cambio del programa · requerimiento',
    titulo: 'Respuesta adicional',
    texto:
      'El equipo proyecta el oficio y SRT lo firma. La EPS responde por Mesa de Partes. El anexo prevé hasta 10 DH. Registrar el plazo notificado y cualquier prórroga.',
    opciones: [{ texto: 'Respuesta recibida · DRE deriva a SRT', destino: 'cpi-evaluacion' }],
  },
  'cpi-decision': {
    antetitulo: 'Cambio del programa · decisión',
    titulo: 'Del informe a la resolución',
    texto:
      'Equipo SRT: informe y proyecto de resolución. SRT revisa y firma. DRE emite memorando, Gerencia eleva y Consejo decide. Registrar documento y fecha en cada intervención.',
    opciones: [],
  },

  // Uso excepcional del fondo de inversiones
  ufi: {
    antetitulo: 'Uso excepcional del fondo',
    titulo: 'Ruta del expediente',
    texto: 'Consulta una situación del procedimiento.',
    opciones: [
      { texto: 'Revisar requisitos', destino: 'ufi-admision' },
      { texto: 'Evaluar información', destino: 'ufi-evaluacion' },
      { texto: 'Consultar visado y firmas', destino: 'ufi-informe' },
    ],
  },
  'ufi-admision': {
    antetitulo: 'Uso del fondo · admisión',
    titulo: '¿Cumple los requisitos?',
    texto: 'El equipo SRT verifica los requisitos del TUPA.',
    opciones: [
      { texto: 'Sí · pasar a evaluación', destino: 'ufi-evaluacion' },
      { texto: 'Falta un requisito', destino: 'ufi-subsanacion' },
    ],
  },
  'ufi-subsanacion': {
    antetitulo: 'Uso del fondo · subsanación',
    titulo: 'Esperando a la EPS',
    texto:
      'SRT firma el oficio preparado por el equipo. Registrar la notificación y la fecha límite de subsanación (máx. 2 DH en el anexo).',
    opciones: [
      avisoEps('eps-ufi-completa'),
      { texto: 'Subsanó · DRE deriva a SRT', destino: 'ufi-admision' },
      { texto: 'Sin subsanación · ver archivo', destino: 'ufi-salida' },
    ],
  },
  'ufi-salida': {
    antetitulo: 'Uso del fondo · salida',
    titulo: 'Archivo del procedimiento',
    texto: 'Confirmada la falta de subsanación, registrar el archivo, su sustento y la comunicación a la EPS.',
    opciones: [avisoEps('eps-ufi-archivado')],
  },
  'ufi-evaluacion': {
    antetitulo: 'Uso del fondo · evaluación',
    titulo: '¿Falta información?',
    texto: 'El equipo evalúa el pedido y el sustento del uso excepcional.',
    opciones: [
      { texto: 'Solicitar información', destino: 'ufi-requerimiento' },
      { texto: 'Información suficiente', destino: 'ufi-informe' },
    ],
  },
  'ufi-requerimiento': {
    antetitulo: 'Uso del fondo · requerimiento',
    titulo: 'Respuesta adicional',
    texto:
      'El equipo prepara el oficio y SRT lo firma. La EPS responde por Mesa de Partes en el plazo notificado (hasta 10 DH en el anexo).',
    opciones: [
      avisoEps('eps-ufi-sustento'),
      { texto: 'Respuesta recibida · DRE deriva a SRT', destino: 'ufi-evaluacion' },
    ],
  },
  'ufi-informe': {
    antetitulo: 'Uso del fondo · caso simulado',
    titulo: 'Informe único',
    texto:
      'Visado SRT: registrado.\nFirma DRE: registrada.\nFirma OAJ: registrada.\n\nEl mismo informe reúne las tres intervenciones. DRE prepara el memorando a Gerencia.',
    opciones: [
      { texto: 'Ver ejemplo de firma pendiente', destino: 'ufi-firma-pendiente' },
      { texto: 'Ver elevación y decisión', destino: 'ufi-decision' },
    ],
  },
  'ufi-firma-pendiente': {
    antetitulo: 'Uso del fondo · ejemplo de firma pendiente',
    titulo: 'Pendiente de firma de OAJ',
    subtitulo: 'Informe único · versión en revisión',
    texto:
      'SRT: visado registrado.\nDRE: firma registrada.\nOAJ: firma pendiente.\n\nAcción pendiente: OAJ revisa y firma esta versión. DRE podrá remitir el informe completo a Gerencia.',
    opciones: [{ texto: 'Ver informe con firmas completas', destino: 'ufi-informe' }],
  },
  'ufi-decision': {
    antetitulo: 'Uso del fondo · decisión',
    titulo: 'Pendiente de elevación',
    texto:
      'DRE firma el memorando. Gerencia General eleva el expediente. El Consejo Directivo decide mediante resolución.',
    opciones: [],
  },

  // Revisión periódica
  rp: {
    antetitulo: 'Revisión periódica',
    titulo: 'Ruta por etapas',
    texto: 'Cada etapa tiene su propio inicio y plazo de referencia.',
    opciones: [
      { texto: 'Inicio · 30 DH', destino: 'rp-inicio' },
      { texto: 'Evaluación · 60 DH', destino: 'rp-evaluacion' },
      { texto: 'Difusión · 45 DH', destino: 'rp-difusion' },
      { texto: 'Aprobación · 60 DH', destino: 'rp-aprobacion' },
    ],
  },
  'rp-inicio': {
    antetitulo: 'Revisión periódica · inicio',
    titulo: 'Verificación de requisitos',
    texto: 'La EPS presenta la solicitud. DRE la deriva, SRT asigna al equipo y el equipo evalúa los requisitos.',
    opciones: [
      { texto: 'Pedir subsanación', destino: 'rp-subsanacion' },
      { texto: 'Consultar salidas de inicio', destino: 'rp-resolucion-inicio' },
    ],
  },
  'rp-subsanacion': {
    antetitulo: 'Revisión periódica · inicio',
    titulo: 'Subsanación de la EPS',
    texto:
      'Equipo proyecta el oficio, SRT lo revisa y DRE lo firma. La EPS tiene hasta 10 DH según el flujograma. Su respuesta reingresa por Mesa de Partes.',
    opciones: [avisoEps('eps-rp-requisitos'), { texto: 'Respuesta recibida · volver a evaluar', destino: 'rp-inicio' }],
  },
  'rp-resolucion-inicio': {
    antetitulo: 'Revisión periódica · inicio',
    titulo: 'Resolución de inicio',
    texto: 'Registrar el pronunciamiento sustentado en el expediente.',
    opciones: [
      { texto: 'Inicio · continuar', destino: 'rp-evaluacion' },
      { texto: 'Inadmisible', destino: 'rp-inadmisible' },
      { texto: 'Improcedente', destino: 'rp-improcedente' },
    ],
  },
  'rp-inadmisible': {
    antetitulo: 'Revisión periódica · salida',
    titulo: 'Solicitud inadmisible',
    texto:
      'Registrar la resolución de inadmisibilidad y la notificación. La ruta de evaluación tarifaria termina aquí.',
    opciones: [avisoEps('eps-rp-inadmisible')],
  },
  'rp-improcedente': {
    antetitulo: 'Revisión periódica · salida',
    titulo: 'Solicitud improcedente',
    texto: 'Registrar la resolución de improcedencia y la notificación. La ruta de evaluación tarifaria termina aquí.',
    opciones: [avisoEps('eps-rp-improcedente')],
  },
  'rp-evaluacion': {
    antetitulo: 'Revisión periódica · evaluación',
    titulo: 'Proyecto de estudio y resolución',
    texto: 'El equipo elabora el estudio tarifario y el proyecto de resolución.',
    opciones: [
      { texto: 'Pedir información adicional', destino: 'rp-requerimiento' },
      { texto: 'Elevar para aprobar difusión', destino: 'rp-difusion' },
    ],
  },
  'rp-requerimiento': {
    antetitulo: 'Revisión periódica · requerimiento',
    titulo: 'Información adicional',
    texto:
      'Equipo prepara el oficio, SRT revisa y DRE firma. La EPS responde en el plazo notificado, hasta 10 DH según el anexo. DRE y SRT lo remiten al equipo.',
    opciones: [
      avisoEps('eps-rp-informacion'),
      { texto: 'Respuesta recibida · continuar evaluación', destino: 'rp-evaluacion' },
    ],
  },
  'rp-difusion': {
    antetitulo: 'Revisión periódica · difusión',
    titulo: 'Publicación y participación',
    texto:
      'DRE remite a Gerencia y esta eleva al Consejo para aprobar la difusión. El plazo de difusión corre desde el día siguiente de la publicación en El Peruano. DU convoca la audiencia (máx. 30 DH). Los comentarios se reciben hasta 15 DH después de la audiencia.',
    opciones: [
      avisoEps('eps-rp-comentarios'),
      { texto: 'Comentarios recibidos · pasar a aprobación', destino: 'rp-aprobacion' },
    ],
  },
  'rp-aprobacion': {
    antetitulo: 'Revisión periódica · aprobación',
    titulo: 'Resolución tarifaria final',
    texto:
      'El equipo evalúa los comentarios y prepara informe, estudio final y proyecto de resolución. SRT revisa y firma, DRE remite a Gerencia y el Consejo decide.',
    opciones: [],
  },

  // Avisos que ve la EPS
  'eps-cpi-completa': {
    antetitulo: 'Aviso a la EPS · Cambio del programa',
    titulo: 'Completa tu solicitud',
    subtitulo: 'Subsanación · plazo indicado en tu oficio',
    texto:
      'Revisa qué requisito observó Sunass en el oficio que recibiste. Presenta la subsanación por Mesa de Partes y conserva tu cargo.',
    opciones: [],
  },
  'eps-cpi-cerro': {
    antetitulo: 'Aviso a la EPS · Cambio del programa',
    titulo: 'Tu procedimiento se cerró',
    subtitulo: 'Trámite concluido',
    texto:
      'Consulta la comunicación de cierre en tu notificación. Allí encontrarás el motivo y las indicaciones aplicables.',
    opciones: [],
  },
  'eps-ufi-completa': {
    antetitulo: 'Aviso a la EPS · Uso del fondo',
    titulo: 'Completa tu solicitud',
    subtitulo: 'Subsanación · plazo indicado en tu oficio',
    texto: 'Revisa el requisito observado en el oficio. Presenta el sustento por Mesa de Partes y conserva tu cargo.',
    opciones: [],
  },
  'eps-ufi-sustento': {
    antetitulo: 'Aviso a la EPS · Uso del fondo',
    titulo: 'Envía el sustento solicitado',
    subtitulo: 'Respuesta · plazo indicado en tu oficio',
    texto:
      'Consulta la lista del oficio recibido. Presenta los documentos por Mesa de Partes e indica el número de tu expediente.',
    opciones: [],
  },
  'eps-ufi-archivado': {
    antetitulo: 'Aviso a la EPS · Uso del fondo',
    titulo: 'Tu trámite fue archivado',
    subtitulo: 'Trámite concluido',
    texto:
      'Consulta el documento de archivo en la notificación recibida. Allí encontrarás el motivo y las indicaciones aplicables.',
    opciones: [],
  },
  'eps-rp-requisitos': {
    antetitulo: 'Aviso a la EPS · Revisión periódica',
    titulo: 'Completa los requisitos',
    subtitulo: 'Subsanación · revisa la fecha notificada',
    texto:
      'Consulta las observaciones de la notificación. Presenta la subsanación por Mesa de Partes con el número de tu expediente.',
    opciones: [],
  },
  'eps-rp-informacion': {
    antetitulo: 'Aviso a la EPS · Revisión periódica',
    titulo: 'Envía la información adicional',
    subtitulo: 'Respuesta · revisa la fecha notificada',
    texto:
      'Reúne la información tarifaria indicada en tu oficio y preséntala por Mesa de Partes. Conserva tu número de cargo.',
    opciones: [],
  },
  'eps-rp-comentarios': {
    antetitulo: 'Aviso a la EPS · Revisión periódica',
    titulo: 'Puedes enviar comentarios',
    subtitulo: 'Difusión pública · ejemplo simulado',
    texto:
      'Audiencia: 9 de septiembre. Puedes comentar el proyecto hasta el 30 de septiembre por el canal indicado en la convocatoria. Participar es opcional.',
    opciones: [],
  },
  'eps-rp-inadmisible': {
    antetitulo: 'Aviso a la EPS · Revisión periódica',
    titulo: 'Solicitud inadmisible',
    subtitulo: 'Trámite concluido',
    texto: 'Consulta en la resolución notificada el motivo y las indicaciones para tu caso.',
    opciones: [],
  },
  'eps-rp-improcedente': {
    antetitulo: 'Aviso a la EPS · Revisión periódica',
    titulo: 'Solicitud improcedente',
    subtitulo: 'Trámite concluido',
    texto: 'Consulta en la resolución notificada el motivo y las indicaciones para tu caso.',
    opciones: [],
  },
}
