# Búsqueda con fuentes y carga de analistas

El panel del agente permite buscar por EPS, referencia de expediente/oficio o expresión del documento sin abrir primero un caso. La cabecera de Expedientes utiliza la misma búsqueda. Los resultados incluyen enlace al expediente, etapa y fuentes por página. Abre una fuente para comprobar el pasaje; una coincidencia de índice no se presenta como una página de contenido.

Las preguntas «¿Qué analista tiene menos carga?» consultan los registros actuales del servidor. Asignación y recepción muestran los expedientes abiertos por persona y la menor carga; los concluidos no se cuentan. No se asigna automáticamente. Si la API aún no proporciona carga, se muestra «carga no disponible», sin convertirla en cero.

La búsqueda respeta el perfil: el analista consulta sus asignaciones, la EPS sus casos y fuentes permitidas, y ciudadanía solo el caso publicado. La conversación se reinicia al cambiar de usuario o expediente, no cuando termina de cargar el título de una pantalla. Una consulta general no se convierte en el ID de conversación de un caso.

Ejemplos: «Busca el oficio 76321», «¿Dónde está CPI-2026-0001?», «Busca documentos sobre abrazaderas» y «¿Qué analista tiene menos expedientes asignados?». Las preguntas sobre el contenido de un caso se hacen dentro del expediente; allí se conservan las citas y su visor.

Requiere el backend `feature/agente-busqueda-carga`, con `/api/agente/buscar` y `/api/asignaciones/carga`. El diseño utiliza los mismos cinco servicios Railway; la imagen backend fija el commit de este frontend. Primero revisar en QA.

Validación: `npm run lint`, `npm run test:contract`, `npm run build` y `npm run test:e2e -- e2e/agente-carga.spec.ts`. El navegador necesita los archivos privados QA y `QA_BASE_URL` local descritos en `docs/integracion_qa_d3.md`. El escenario añade `caso_carga`, `analista_inicial`, `analista_recomendado` y `documento_busqueda`; estos identificadores son exclusivamente de práctica.

Los tests verifican que `/health` informe inferencia deshabilitada antes de enviar preguntas. La búsqueda y la carga son GET sin modelo; la consulta de expediente comprueba la respuesta extractiva con página y enlace, no la calidad de una generación real. No ejecutar las escrituras de las pruebas contra producción.
