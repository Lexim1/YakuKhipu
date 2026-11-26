// Tipos de la vista SUNASS. Siguen docs/contrato_api.md y amplían lo que el Figma necesita mostrar.
// Lo que todavía no está en el contrato se marca «por acordar» para revisarlo con el backend.

export type Procedimiento = 'CPI' | 'UFI' | 'RP'

export const NOMBRE_PROCEDIMIENTO: Record<Procedimiento, string> = {
  CPI: 'Cambio del programa',
  UFI: 'Uso del fondo',
  RP: 'Revisión periódica',
}

export const NOMBRE_COMPLETO: Record<Procedimiento, string> = {
  CPI: 'Cambio del programa de inversiones',
  UFI: 'Uso excepcional del fondo de inversiones',
  RP: 'Revisión periódica',
}

export type TamanoEps = 'Pequeña' | 'Mediana' | 'Grande'

/**
 * Situación del plazo que calcula el backend. «pendiente_de_validacion»: falta una regla, notificación
 * o calendario acreditado, así que el backend no cuenta días (dias_usados y dias_totales llegan en null).
 */
export type Situacion = 'en_plazo' | 'por_vencer' | 'vencido' | 'concluido' | 'pendiente_de_validacion'

export interface Plazo {
  situacion: Situacion
  dias_usados: number | null
  dias_totales: number | null
  /** Etapa medida en revisión periódica (se mide la etapa activa). */
  etapa: string | null
}

export interface TramiteResumen {
  id: string
  procedimiento: Procedimiento
  eps: string
  tamano_eps: TamanoEps
  etapa: string
  responsable: string
  plazo: Plazo
  simulado: boolean
}

export interface ListaPaginada<T> {
  items: T[]
  total: number
}

export type EstadoPaso = 'hecho' | 'actual' | 'pendiente'

export interface PasoFlujo {
  titulo: string
  detalle: string
  estado: EstadoPaso
  /** «✓ Hecho», «Aquí está · desde 14 ago», «Pendiente». */
  nota: string
}

export interface Flujograma {
  encabezado: string
  titulo: string
  chip: string
  pasos: PasoFlujo[]
  nota: string
}

export interface ChipTexto {
  texto: string
  tono: 'ok' | 'aviso' | 'peligro' | 'info' | 'agente' | 'neutro'
}

export interface Hito {
  id: string
  fecha_texto: string
  titulo: string
  detalle: string
  chip: ChipTexto
  fuente: string | null
  /** El hito tiene un vínculo propuesto por el agente que una persona debe validar. */
  validar: boolean
}

export interface ItemHistorial {
  fecha_texto: string
  titulo: string
  detalle: string
  actual: boolean
}

export type AccionSiguiente = 'validar' | 'alertas' | 'recepcion'

export interface SiguienteAccion {
  titulo: string
  detalle: string
  responsable: string | null
  boton: string
  accion: AccionSiguiente
  urgente: boolean
}

export interface VersionCifra {
  valor: string
  titulo: string
  detalle: string
  fuente: string
  sin_documento: boolean
}

export interface Comparador {
  titulo: string
  versiones: VersionCifra[]
  aviso: string | null
  evaluacion: {
    cantidad: string
    unidad: string
    monto: string
    filas: { etiqueta: string; valor: string }[]
  }
}

export interface TarjetaPlazo {
  tipo: string
  valor: string
  detalle: string
  usado: number
  total: number
  pie: string
}

export interface FechaProxima {
  fecha_texto: string
  titulo: string
  chip: ChipTexto
}

export interface Plazos {
  tarjetas: TarjetaPlazo[]
  proximas: FechaProxima[]
  nota: string
}

/** Estado de un dato de impacto, según el componente «Estado del dato» del Figma. */
export type EstadoDato =
  'Verificado' | 'Estimado' | 'Potencial' | 'Por validar' | 'Simulado' | 'No está en el expediente'

export interface Impacto {
  indicadores: { etiqueta: string; valor: string; detalle: string; tono: 'marca' | 'agente' | 'aviso' }[]
  datos: { pregunta: string; estado: EstadoDato; texto: string; fuente: string }[]
  localidades: { nombre: string; renovacion: number | null; nuevas: number }[]
  fuente_localidades: string
}

export interface VinculoPropuesto {
  documento: string
  eps_fecha: string
  responde_a: string
  responde_detalle: string
  evidencia: string
  fuente: string
  efecto: string
}

export interface Expediente extends TramiteResumen {
  tema: string
  chip_plazo: string
  flujo: Flujograma
  siguiente: SiguienteAccion
  /** Expedientes con pestañas (línea de tiempo, comparador, plazos, impacto). */
  linea_tiempo: Hito[] | null
  resumen: { etiqueta: string; valor: string }[] | null
  comparador: Comparador | null
  plazos: Plazos | null
  impacto: Impacto | null
  vinculo: VinculoPropuesto | null
  /** Expedientes sin pestañas: historial del trámite. */
  historial: ItemHistorial[] | null
  /** Versión vigente. Toda escritura la envía; si otra persona cambió el trámite, el backend responde 409. */
  version: number
}

export interface DocumentoRecibido {
  id: string
  titulo: string
  eps: string
  fecha_texto: string
  hoja: string | null
  canal_oficial: boolean
  detalle: string | null
  /** EPS del documento (API real); el expediente destino debe ser de la misma EPS. */
  eps_id?: string
  /** Estado del PDF cargado: pendiente, procesando, listo o error. null si se registró sin PDF. */
  procesamiento_pdf?: { estado: string; error?: string | null; paginas?: number | null } | null
  propuesta: {
    tramite_id: string
    motivo: string
    confianza: 'alta' | 'media' | 'baja'
    fuente: string
  } | null
}

export type TipoAlerta = 'vencido' | 'por_vencer' | 'cifra_sin_documento' | 'documento_por_asociar' | 'dos_numeraciones'
  | 'reporte_faltante' | 'avance_inconsistente' | 'dato_duplicado' | 'saldo_inconsistente' | 'deposito_insuficiente'

export interface Alerta {
  id: string
  tipo: TipoAlerta
  titulo: string
  detalle: string
  regla: string
  fuente: string
  /** Destino de la acción: un expediente (con pestaña opcional) o la recepción. */
  destino: { tipo: 'expediente'; id: string; pestana?: string } | { tipo: 'recepcion' }
  accion: string
  /** Documento recibido al que se refiere la alerta; deja de mostrarse cuando se incorpora. */
  documento_id?: string
}

/** Persona o equipo al que se puede asignar un documento. Por acordar con el backend. */
export interface Asignable {
  id: string
  texto: string
  menor_carga: boolean
}

/** Opciones del diálogo «Incorporar documento». Vienen de servicios, no de los ejemplos. */
export interface CatalogosRecepcion {
  /** Expedientes abiertos que admiten documentos, con su versión vigente. */
  expedientes: { id: string; eps: string; version: number; eps_id?: string }[]
  asignables: Asignable[]
  tipos_actuacion: string[]
}

export type UrgenciaTarea = 'hoy' | 'por_vencer' | 'en_plazo'

/** Acción pendiente para el perfil actual en «Te toca actuar». Por acordar con el backend. */
export interface Tarea {
  id: string
  tramite_id: string
  eps: string
  etapa: string
  titulo: string
  detalle: string
  urgencia: UrgenciaTarea
  tipo: 'validar' | 'comparar' | 'informe' | 'revisar_documento'
  boton: string
  /** Ruta del expediente, con pestaña o acción, a la que lleva el botón. */
  destino: string
}

export interface AvisoAgente {
  id: string
  tipo: TipoAlerta | 'vinculo_propuesto'
  texto: string
}

export interface BandejaTareas {
  /** Cargo del perfil, por ejemplo «Analista SRT». */
  cargo: string
  tareas: Tarea[]
  avisos: AvisoAgente[]
  /** Plazos propios del perfil que están por vencer, por ejemplo el del informe. */
  por_vencer: { total: number; detalle: string }
  expedientes_asignados: { total: number; detalle: string }
}

/** Contadores del menú lateral. */
export interface Contadores {
  te_toca: number
  recepcion: number
  alertas: number
}
