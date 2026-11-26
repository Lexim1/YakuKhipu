// DATOS DE DEMOSTRACIÓN de las vistas de seguimiento del Figma (Prototipo v2).
// El backend todavía no tiene rutas para Ficha 360, actos externos, encargos, reportes ni configuración,
// así que estas pantallas usan estos ejemplos en los dos modos y los marcan como simulados.
// Las personas se identifican por su cargo, nunca por su nombre.

import type {
  ActoExterno,
  DashboardSimulado,
  Encargo,
  FichaEps,
  ReglaPlazo,
  Reporte,
  AccesoPerfil,
} from '../types/seguimiento'

export const DASHBOARD_SIMULADO: DashboardSimulado = {
  monto_evaluacion: { valor: 'S/ 6,23 M', detalle: 'Cambios del programa y usos del fondo' },
  resueltos: { valor: 12, detalle: '9 dentro del plazo' },
  demora_por_etapa: [
    { etapa: 'Verificación de requisitos', dias: 2 },
    { etapa: 'Espera de respuesta de la EPS', dias: 6 },
    { etapa: 'Evaluación técnica', dias: 11 },
    { etapa: 'Visto legal y DRE', dias: 4 },
    { etapa: 'Gerencia y Consejo', dias: 5 },
  ],
  resueltos_por_mes: [
    { mes: 'jun', dentro: 2, fuera: 0 },
    { mes: 'jul', dentro: 2, fuera: 1 },
    { mes: 'ago', dentro: 3, fuera: 1 },
    { mes: 'set', dentro: 1, fuera: 0 },
    { mes: 'oct', dentro: 1, fuera: 1 },
  ],
  impacto: [
    { etiqueta: 'Inversión autorizada en 2026', valor: 'S/ 9,4 M', detalle: 'En 5 decisiones' },
    { etiqueta: 'Conexiones beneficiadas', valor: '31 200', detalle: 'Medidores, redes y bombeo' },
    { etiqueta: 'Hogares con jefatura femenina', valor: '37 %', detalle: 'En las zonas de las inversiones · simulado' },
  ],
}

export const FICHAS_EPS: FichaEps[] = [
  {
    id: 'eps-tacna',
    nombre: 'EPS Tacna S.A.',
    descripcion: 'Mediana · Tacna, Pachía y Locumba · periodo regulatorio 2024–2028',
    calificacion: 'Ejecución regular · 12 de 20',
    indicadores: [
      { etiqueta: 'Conexiones de agua', valor: '112 400', detalle: 'Dato simulado' },
      { etiqueta: 'Calificación de ejecución', valor: '12 / 20', detalle: 'Reporte de inversiones n.° 9' },
      { etiqueta: 'Fondo de inversiones 2026', valor: '20,9 %', detalle: 'Ejecutado a junio de 2026' },
      { etiqueta: 'Trámites activos', valor: '1', detalle: 'CPI-2026-0007 en revisión' },
    ],
    tramites: [
      {
        id: 'CPI-2026-0007',
        titulo: 'CPI-2026-0007 · Cambio del programa · medidores',
        detalle: 'Revisión · día 18 de 30',
        estado: { texto: 'En plazo', tono: 'ok' },
      },
      {
        id: 'UFI-2025-0003',
        titulo: 'UFI-2025-0003 · Uso del fondo · bombeo',
        detalle: 'Resuelto el 3 mar 2025',
        estado: { texto: 'Autorizado', tono: 'info' },
      },
      {
        id: 'RP-2023-0004',
        titulo: 'RP-2023-0004 · Revisión periódica 2024–2028',
        detalle: 'RCD 072-2023',
        estado: { texto: 'Vigente', tono: 'neutro' },
      },
    ],
    metas: [
      { meta: 'Reemplazo de medidores', avance: '4 210 de 6 000', porcentaje: 70 },
      { meta: 'Continuidad del servicio', avance: '19 de 20 h', porcentaje: 95 },
      { meta: 'Agua no facturada', avance: '38 % · meta 35 %', porcentaje: 92 },
    ],
  },
]

export const ACTOS_EXTERNOS: ActoExterno[] = [
  {
    id: 'cpi-2026-0007-medidores',
    tramite_id: 'CPI-2026-0007',
    titulo: 'CPI-2026-0007 · EPS Tacna · Cambio del programa',
    decision: 'Autorizar la compra de 19 935 medidores',
    monto: 'S/ 3 817 752',
    plazo: { texto: 'Por vencer · día 26 de 30', tono: 'aviso' },
    documentos: ['Informe técnico', 'Visto de la DRE', 'Proyecto de resolución'],
    resumen: {
      cifra: '19 935',
      unidad: 'medidores ultrasónicos',
      monto: 'S/ 3 817 752',
      desglose: [
        { etiqueta: 'Renovación', valor: '12 527' },
        { etiqueta: 'Nuevas instalaciones', valor: '7 408' },
      ],
      financia: 'Recursos liberados',
      cambios: [
        { paso: 'Solicitud', valor: '25 000', fuente: 'Informe 031 · num. 10' },
        { paso: 'Respuesta', valor: '14 902', fuente: 'Oficio 1628' },
        { paso: 'Ficha actualizada', valor: '19 935', fuente: 'Pendiente de acreditar en el expediente' },
      ],
      sustento: [
        'Informe técnico 031-2026 · SRT',
        'Memorando 327-2026 · DRE',
        'Elevación de Gerencia General',
        'Proyecto de resolución',
      ],
    },
  },
  {
    id: 'cpi-2026-0004-medidores',
    tramite_id: 'CPI-2026-0004',
    titulo: 'CPI-2026-0004 · EPS Manantial · Cambio del programa',
    decision: 'Autorizar el cambio del proyecto de medidores',
    monto: 'S/ 159 441',
    plazo: { texto: 'Vencido · día 37 de 30', tono: 'peligro' },
    documentos: ['Informe técnico', 'Visto de la DRE', 'Proyecto de resolución'],
    resumen: null,
  },
]

export const ENCARGOS: Encargo[] = [
  {
    encargo: 'Pedir el reporte de avance de la compra',
    detalle: '4 210 de 19 935 instalados',
    decision: 'RCD 032-2026',
    eps: 'EPS Tacna',
    responsable: 'Analista SRT',
    area: 'SRT',
    vence: '30 set',
    estado: 'en_curso',
  },
  {
    encargo: 'Verificar en campo la instalación',
    detalle: 'Muestra de 3 sectores',
    decision: 'RCD 032-2026',
    eps: 'EPS Tacna',
    responsable: 'ODS Tacna',
    area: 'Oficina desconcentrada',
    vence: '15 oct',
    estado: 'pendiente',
  },
  {
    encargo: 'Publicar la ficha ciudadana',
    detalle: 'Con datos verificados',
    decision: 'RCD 032-2026',
    eps: 'EPS Tacna',
    responsable: 'Coordinación DRE',
    area: 'DRE',
    vence: '29 ago',
    estado: 'hecho',
  },
  {
    encargo: 'Verificar el uso del fondo',
    detalle: 'Camiones cisterna',
    decision: 'RCD 126-2025',
    eps: 'EPSSMU',
    responsable: 'ODS Amazonas',
    area: 'Oficina desconcentrada',
    vence: '15 dic',
    estado: 'hecho',
  },
  {
    encargo: 'Revisar el reporte de gasto',
    detalle: 'Hasta S/ 217 313,20',
    decision: 'RCD 126-2025',
    eps: 'EPSSMU',
    responsable: 'Analista SRT',
    area: 'SRT',
    vence: '20 ene',
    estado: 'en_curso',
  },
  {
    encargo: 'Seguimiento de metas 2025',
    detalle: 'Primer año del periodo',
    decision: 'RCD 076-2024',
    eps: 'EMAPA Pasco',
    responsable: 'ODS Pasco',
    area: 'Oficina desconcentrada',
    vence: '31 mar',
    estado: 'pendiente',
  },
  {
    encargo: 'Notificar la resolución',
    detalle: 'Mesa de Partes',
    decision: 'RCD 076-2024',
    eps: 'EMAPA Pasco',
    responsable: 'Subdirección SRT',
    area: 'DRE',
    vence: '20 dic',
    estado: 'hecho',
  },
]

export const REPORTES: Reporte[] = [
  {
    titulo: 'Cartera de expedientes',
    detalle: 'Todos los trámites con etapa, responsable y semáforo',
    formato: 'Excel',
    actualizado: 'Hoy, 08:00',
  },
  {
    titulo: 'Tiempos por etapa',
    detalle: 'Días hábiles promedio por etapa y procedimiento',
    formato: 'PDF',
    actualizado: '1 nov',
  },
  {
    titulo: 'Decisiones y ejecución',
    detalle: 'Autorizado frente a ejecutado por EPS',
    formato: 'Excel',
    actualizado: '28 oct',
  },
  {
    titulo: 'Impacto social',
    detalle: 'A quién llegan las inversiones autorizadas',
    formato: 'PDF',
    actualizado: '28 oct',
  },
]

export const REGLAS_PLAZO: ReglaPlazo[] = [
  {
    procedimiento: 'Uso excepcional del fondo',
    base: 'Art. 89 · RGT',
    plazo: '30 días hábiles',
    alerta: 'Desde el 75 %',
  },
  {
    procedimiento: 'Cambio del programa de inversiones',
    base: 'Art. 93 · RGT',
    plazo: '30 días hábiles',
    alerta: 'Desde el 75 %',
  },
  {
    procedimiento: 'Revisión periódica',
    base: 'Arts. 45–49 · RCD 124-2025',
    plazo: '30 / 60 / 45 / 60 DH',
    alerta: '75 % por etapa',
  },
]

export const ACCESOS: AccesoPerfil[] = [
  {
    perfil: 'Analista SRT',
    ambito: 'Asignados',
    trazabilidad: 'Sí · completa en su ámbito',
    acciones: 'Valida datos, vínculos y respuestas; prepara revisión técnica',
    configuracion: 'Sin acceso',
  },
  {
    perfil: 'Coordinación DRE',
    ambito: 'Cartera DRE',
    trazabilidad: 'Sí · cartera DRE',
    acciones: 'Incorpora documentos, asigna responsables y registra actos externos',
    configuracion: 'Sin acceso',
  },
  {
    perfil: 'Jefatura DRE',
    ambito: 'Cartera DRE',
    trazabilidad: 'Sí · cartera DRE',
    acciones: 'Supervisa cartera, riesgos, calidad y permisos',
    configuracion: 'Administra',
  },
  {
    perfil: 'EPS',
    ambito: 'Su empresa',
    trazabilidad: 'Solo información habilitada',
    acciones: 'Consulta requisitos; informa presentación por Mesa de Partes',
    configuracion: 'Sin acceso',
  },
  {
    perfil: 'Ciudadanía · pública',
    ambito: 'Solo publicado',
    trazabilidad: 'Historial público',
    acciones: 'Consulta decisiones y fuentes publicadas; agente público',
    configuracion: 'Sin cuenta',
  },
]
