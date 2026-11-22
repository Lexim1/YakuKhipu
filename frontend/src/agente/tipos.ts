/** Pregunta que el agente sabe responder en una pantalla, con sus fuentes. */
export interface PreguntaAgente {
  pregunta: string
  respuesta: string
  fuentes: string[]
  /** Palabras que, si aparecen en lo que escribe la persona, eligen esta respuesta. */
  palabras?: string[]
}

export interface ContextoAgente {
  /** Texto del chip, por ejemplo «Espacio SUNASS · CPI-2026-0007». */
  espacio: string
  preguntas: PreguntaAgente[]
}
