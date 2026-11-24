# Validación de API y agente previa a PostgreSQL

## Alcance

Se validó la capa HTTP de FastAPI, la lógica de servicios, los permisos de los tres perfiles, la ejecución del grafo LangGraph y el transporte del proveedor IA. Los tests sustituyen persistencia y HTTP externo. No se creó ninguna base, no se ejecutó DDL en PostgreSQL ni se llamó a un proveedor con cuota real.

Esta validación habilita la siguiente fase de integración. No demuestra todavía integridad transaccional, planes de consulta, concurrencia o disponibilidad del PostgreSQL real. Tampoco demuestra la corrección semántica universal de las respuestas de un modelo real.

## Correcciones

- Errores uniformes para negocio, validación, 404, 405, SQLAlchemy y errores imprevistos. Se preservan 401, 403, 404, 409, 422, 429, 500 y 503 sin exponer consultas, claves ni excepciones internas.
- Rollback de la sesión ante excepciones; conflicto de integridad o versión responde 409.
- Versiones obligatorias en escrituras y huella de petición para impedir reutilizar una clave de idempotencia con otro contenido.
- Requerimientos y subsanaciones exigen plazo del oficio y fecha acreditada. Las respuestas de EPS no permiten avanzar hasta verificación de SUNASS. RP contempla consulta pública.
- Recepción de metadatos/texto, incorporación con documento y fragmento persistentes, y control de EPS compatible. El registro no sustituye una integración SIA ni permite subir un PDF.
- Publicación explícita de decisiones finales y documentos revisados. Retirar la publicación bloquea las consultas y el agente ciudadano.
- Contratos de salida en OpenAPI para fichas, listados, acciones, eventos, documentos, publicaciones, recepciones y sesión. Cookies de autenticación documentadas como esquema de seguridad.
- Conversación ciudadana vinculada a una cookie de visitante firmada. No puede compartirse entre visitantes ni entre perfiles institucionales. La cookie se conserva también en un error 503 para poder reintentar.
- Fuentes del agente filtradas antes del modelo: ciudadanía solo recibe la proyección publicada; EPS no recibe documentos ni detalles internos.
- Caché separada por persona/visitante, perfil, EPS, historial completo, pregunta, versión y contexto actual. No se eliminan negaciones ni el orden de la pregunta.
- Citas inexistentes, cifras ajenas a la evidencia citada, ausencia de citas o formato inválido se reintentan y luego se descartan; no se entregan como respuesta verificada.
- Fallos y respuestas malformadas del proveedor devuelven una indisponibilidad controlada. Los errores HTTP permanentes no se reintentan; 429 y fallos transitorios tienen un reintento.
- PDF inexistente o página inválida responde 404; no se devuelve silenciosamente otro tipo de contenido con 200. El indicador de disponibilidad comprueba archivo o miembro de ZIP.
- Lecturas de datos retirados del origen respetan la marca de presencia. Fechas operativas usan America/Lima.
- `/live` verifica proceso; `/health` informa degradación; `/ready` responde 503 si falta conexión o esquema.

## Pruebas

Resultado final de `python -m pytest`: **74 aprobadas y 1 omitida**. La omitida es la integración PostgreSQL sin VERIFY_DATABASE_URL. Las pruebas históricas dependientes de semillas siguen excluidas de colección.

OpenAPI exportado: **29 rutas y 34 operaciones HTTP**. El chat institucional declara seguridad por cookie; el ciudadano no exige login institucional.

Cobertura comprobada mediante peticiones HTTP:

- Login, cierre, cookie vencida o manipulada, ausencia de sesión, permisos SUNASS/EPS y aislamiento entre empresas.
- Lecturas de expediente, flujo, eventos, acciones, contexto, documentos, plazos, alertas y recepción.
- Requerimiento, respuesta EPS, verificación, avance, resolución, publicación, consulta ciudadana y retirada.
- Reintento de recepción y actuación sin duplicar, rechazo de la misma clave con otra petición y rollback ante conflicto simulado.
- Agente de SUNASS, agente de EPS y agente ciudadano, enlaces autorizados y memoria aislada.
- Rechazo de inyección de perfil, preguntas vacías, expediente ajeno y publicación inexistente, antes de llamar al modelo.
- Ausencia de evidencia, modelo malformado, citas inventadas, cifras sin sustento, caída del proveedor y limitación 429.
- CORS con credenciales, preflight PUT, errores 500 legibles por el navegador y ausencia de detalles sensibles.
- Transporte HTTP del modelo con éxito, 401, 429, 503 y estructuras inválidas, sin conexión externa.
- Sintaxis de Python y de los scripts PostgreSQL mediante analizador.

Los resultados ejecutados se informan en la entrega de la tarea. La prueba `tests/test_postgres_fuentes.py` queda omitida sin VERIFY_DATABASE_URL.

## Siguiente fase

Ejecutar los SQL manualmente en PostgreSQL 15 o posterior, aplicar `10_validacion_api.sql` si el esquema ya existía, provisionar usuarios reales y configurar SECRET_KEY, DATABASE_URL y DOCUMENTOS_DIR. Luego validar restricciones, cargas repetidas, concurrencia, rutas con datos importados y lectura de ZIP reales. Configurar el proveedor IA y ejecutar consultas reales de los tres perfiles con documentos publicados revisados.

Publicar el servicio con varios workers requiere un contador compartido para el límite ciudadano. El login sigue siendo local; el SSO y la autorización interna por cargo no se han conectado.
