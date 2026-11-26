/** Pregunta que el agente sabe responder en una pantalla, con sus fuentes. */
export interface PreguntaAgente {
  pregunta: string
  respuesta: string
  fuentes: string[]
  /** Palabras que, si aparecen en lo que escribe la persona, eligen esta respuesta. */
  palabras?: string[]
}

/** Caso sobre el que pregunta la pantalla. Con la API real, el agente busca en sus documentos. */
export type ConsultaAgente = { tipo: 'tramite'; tramite_id: string } | { tipo: 'publico'; caso_id: string }

export interface ContextoAgente {
  /** Texto del chip, por ejemplo «Espacio SUNASS · CPI-2026-0007». */
  espacio: string
  /** Respuestas de ejemplo. Con la API real solo se usan sus preguntas como sugerencias. */
  preguntas: PreguntaAgente[]
  consulta?: ConsultaAgente
}
