/** Pregunta que el agente sabe responder en una pantalla, con sus fuentes. */
export interface PreguntaAgente {
  pregunta: string
  respuesta: string
  fuentes: string[]
  /** Palabras que, si aparecen en lo que escribe la persona, eligen esta respuesta. */
  palabras?: string[]
}

/**
 * Caso sobre el que pregunta el agente al backend.
 * - tramite: vistas SUNASS y EPS → POST /api/agente/chat (con sesión).
 * - publico: ciudadanía → POST /api/publico/asistente/chat (solo fuentes publicadas).
 */
export type CasoAgente = { tipo: 'tramite'; id: string } | { tipo: 'publico'; id: string }

export interface ContextoAgente {
  /** Texto del chip, por ejemplo «Espacio SUNASS · CPI-2026-0007». */
  espacio: string
  preguntas: PreguntaAgente[]
  /** Si la pantalla trata de un caso, el agente consulta al backend sobre ese caso. */
  caso?: CasoAgente
  /** true en la consulta ciudadana: el agente explica en lenguaje sencillo y cita solo fuentes públicas. */
  publico?: boolean
}
