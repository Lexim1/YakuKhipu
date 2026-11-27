# Búsqueda con fuentes y carga de analistas

El panel del agente permite buscar por EPS, referencia de expediente/oficio o expresión del documento sin abrir primero un caso. La cabecera de Expedientes utiliza la misma búsqueda. Los resultados incluyen enlace al expediente, etapa y fuentes por página. Abre una fuente para comprobar el pasaje; una coincidencia de índice no se presenta como una página de contenido.

Las preguntas «¿Qué analista tiene menos carga?» consultan los registros actuales del servidor. Asignación y recepción muestran los expedientes abiertos por persona y la menor carga; los concluidos no se cuentan. No se asigna automáticamente. Si la API aún no proporciona carga, se muestra «carga no disponible», sin convertirla en cero.

La búsqueda respeta el perfil: el analista consulta sus asignaciones, la EPS sus casos y fuentes permitidas, y ciudadanía solo el caso publicado. La conversación se reinicia al cambiar de usuario o expediente, no cuando termina de cargar el título de una pantalla. Una consulta general no se convierte en el ID de conversación de un caso.

Ejemplos: «Busca el oficio 76321», «¿Dónde está CPI-2026-0001?», «Busca documentos sobre abrazaderas» y «¿Qué analista tiene menos expedientes asignados?». Las preguntas sobre el contenido de un caso se hacen dentro del expediente; allí se conservan las citas y su visor.

Requiere el backend `feature/agente-busqueda-carga`, con `/api/agente/buscar` y `/api/asignaciones/carga`. El diseño utiliza los mismos cinco servicios Railway; la imagen backend fija el commit de este frontend. Primero revisar en QA.

Validación: `npm run lint`, `npm run test:contract`, `npm run build` y `npm run test:e2e -- e2e/agente-carga.spec.ts`. El navegador necesita los archivos privados QA y `QA_BASE_URL` local descritos en `docs/integracion_qa_d3.md`. El escenario añade `caso_carga`, `analista_inicial`, `analista_recomendado` y `documento_busqueda`; estos identificadores son exclusivamente de práctica.

Los tests verifican que `/health` informe inferencia deshabilitada antes de enviar preguntas. La búsqueda y la carga son GET sin modelo; la consulta de expediente comprueba la respuesta extractiva con página y enlace, no la calidad de una generación real. No ejecutar las escrituras de las pruebas contra producción.

## Recorrido de solicitud a resolución

Recepción admite registrar una solicitud sin asignarla todavía; Jefatura acredita la derivación y Coordinación asigna después. Se puede marcar el material ficticio de práctica. La confirmación ofrece enlace directo al expediente creado.

En Documentos incorporados, Jefatura y Coordinación pueden revisar el acceso de la EPS, con motivo y control de versión. El lector EPS permite abrir sus fuentes y PDF autorizados. Compartir con partes es distinto de publicar para ciudadanía. El analista registra un informe sin atribuirse firmas externas; el resultado permite distinguir una autorización parcial. La EPS debe informar su respuesta con referencia/fecha y SUNASS incorpora y verifica un documento distinto del oficio del requerimiento.

La [guía UFI por rol](https://github.com/Lexim1/YakuKhipu-Backend/blob/feature/agente-busqueda-carga/docs/demo_ufi_paso_a_paso.md) utiliza la solicitud de las páginas 2–5 del PDF original `UFI-2024-0001.pdf`, sin redactar una nueva. Excluye expresamente `Solicitud_UFI_SIMULADO`. Los respaldos sin PDF individual se transcriben de DS10 con procedencia y rótulo de práctica.

`e2e/flujo-ufi.spec.ts` recibe `QA_UFI_MANIFEST` y una cuenta EPS07 en `QA_SCENARIO_FILE`; crea un caso nuevo y recorre cuatro sesiones hasta leer la RCD del mismo caso. `e2e/integracion.spec.ts` conserva las comprobaciones de módulos, OCR, exportación y publicación. Estas escrituras se limitan a QA local.
