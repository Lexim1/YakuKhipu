> HISTÓRICO: corresponde a una etapa anterior. Consultar ../correccion_backend.md y ../../backend/README.md para el estado vigente.

# Diagnóstico previo a la refactorización

La rama inspeccionada es master y contiene solo backend. No hay aplicación frontend ni archivos de las guías enlazadas en README.

- La carga vigente combina demo_portal.json con casos_reales.json. Tacna permanece con una tarea pendiente aunque su ficha documental incluye una resolución final.
- DS02 tiene 481 procedimientos y 1825 hitos. Solo 33 procedimientos corresponden a CPI, UFI y RP. Los otros tipos deben conservarse aunque no tengan aún un flujo operativo.
- Los identificadores UFI-2025-0001 y RP-2024-0001 colisionan entre el dataset y los casos documentales. No representan la misma entidad.
- ds01_catalogo_eps.xlsx contiene CSV. El diccionario es un archivo XLSX, con hojas de contexto, supuestos, relaciones y campos.
- No se entregaron archivos DS10 ni DS11. No se fabricarán documentos para completar sus referencias.
- Los casos se entregaron como tres ZIP, con 31 PDF en total. La ingesta anterior requiere carpetas descomprimidas.
- Los plazos anteriores calculan con feriados fijos y sin suspensiones. Las alertas pierden la marca de regla no validada.
- Las actuaciones permiten un identificador de documento inexistente. Las pruebas antiguas crean y destruyen tablas mediante ORM y dependen de semillas.
- SQL será la fuente del esquema. Se preservan nombres de tablas centrales para reducir cambios en la API. Los datos entregados se almacenan con origen y no se presentan como datos oficiales de producción.

Figma ya inspeccionado en esta conversación: vistas SUNASS, EPS y ciudadanía; expediente con línea de tiempo, comparador, plazos e impacto. Sus cifras y fechas no son fuentes de datos.

Plan: esquema SQL independiente, generación determinista de INSERT desde archivos, documentos por página con visibilidad interna hasta revisión, consultas API desde PostgreSQL y pruebas de integridad sin creación ORM.
