# Contrato para integración del frontend

El contrato técnico exportado está en `openapi.json`. Swagger se sirve en `/docs`; el JSON vivo está en `/openapi.json`. Se genera sin conectarse a PostgreSQL con `python -m scripts.exportar_openapi`, desde backend.

## Sesiones y permisos

Toda petición del navegador usa `credentials: 'include'`. `POST /api/sesion` recibe `usuario_id` y `password`. Devuelve perfil, EPS y nombre; guarda una cookie HttpOnly firmada con vencimiento de ocho horas. El cliente nunca elige perfil o EPS en las consultas del agente. `GET /api/sesion` recupera la sesión; `DELETE /api/sesion` devuelve 204 y la cierra.

Los códigos 401 indican sesión ausente, inválida, vencida o usuario inactivo; 403 significa perfil no permitido; 404 se usa también para un expediente ajeno o un documento reservado. No se distingue la existencia de recursos privados en los mensajes.

SUNASS reúne al personal interno del prototipo. EPS tiene acceso solo a su empresa. Ciudadanía consulta sin iniciar sesión institucional, exclusivamente publicaciones activas y sus documentos públicos. El SSO institucional y la separación interna por cargos no forman parte de esta autenticación local.

## Endpoints de SUNASS y compartidos con EPS

| Método y ruta | Actor | Uso |
| --- | --- | --- |
| GET `/api/tramites` | SUNASS | Expedientes, estado, responsable y plazo |
| GET `/api/tramites/{id}` | SUNASS | Ficha completa con versión |
| GET `/api/tramites/{id}/flujo` | SUNASS | Pasos operativos del procedimiento |
| GET `/api/tramites/{id}/eventos` | SUNASS/EPS propia | Historial autorizado |
| GET `/api/tramites/{id}/acciones` | SUNASS/EPS propia | Acciones disponibles en ese estado |
| GET `/api/tramites/{id}/documentos` | SUNASS/EPS propia | Documentos visibles para ese perfil |
| GET `/api/tramites/{id}/plazos` | SUNASS/EPS propia | Regla, fuente, cálculo y validación |
| GET `/api/tramites/{id}/contexto` | SUNASS/EPS propia | Proyectos, ejecución, fondos, finanzas y metas |
| POST `/api/tramites/{id}/eventos` | SUNASS | Actuación y transición auditada |
| POST `/api/tramites/{id}/vinculos` | SUNASS | Confirmación de un vínculo propuesto existente |
| GET `/api/recepcion` | SUNASS | Recepciones pendientes |
| POST `/api/recepcion` | SUNASS | Registrar metadatos y texto de un documento recibido |
| POST `/api/recepcion/incorporaciones` | SUNASS | Incorporar el documento a un expediente de la misma EPS |
| GET `/api/alertas` | SUNASS | Avisos sustentados con regla y fuente |
| PUT `/api/tramites/{id}/publicacion` | SUNASS | Publicar decisión y seleccionar documentos públicos |
| DELETE `/api/tramites/{id}/publicacion` | SUNASS | Retirar publicación; 204 sin cuerpo |

En POST de eventos, respuestas e incorporaciones se exige `version`, tomada del GET más reciente. Con 409, recargar la ficha y mostrar que hubo un cambio; no reenviar automáticamente con otra versión. En eventos, usar un `Idempotency-Key` nuevo por operación y reutilizarlo solo para reintentar el mismo cuerpo. La misma clave con otro contenido responde 409.

Acciones de SUNASS: `validar_expediente`, `avanzar_paso`, `requerir_informacion`, `requerir_subsanacion`, `verificar_respuesta`, `resolver`, `confirmar_vinculo`. La lista efectiva se obtiene de `/acciones`: no habilitar botones únicamente por el nombre del estado. Para acciones con sustento se exigen documento del caso y fecha acreditada; los requerimientos exigen el plazo escrito en el oficio, sin valor supuesto. No se avanza mientras una respuesta esté por verificar. Resolver exige resultado explícito `autorizado` o `no_autorizado`.

`POST /api/recepcion` requiere `Idempotency-Key` y recibe `titulo`, `referencia`, `fecha_documento`, `eps_id` y `texto`. Es captura de información verificada de Mesa de Partes, no una integración SIA ni un cargador de archivos PDF. La incorporación conserva ese texto y su procedencia. El listado de recepciones no devuelve el texto completo.

Publicar exige decisión final, versión actual, título, localidad, resumen ciudadano revisado y una lista no vacía `documentos_publicos`. La selección revisada habilita esos documentos y retira la visibilidad pública de documentos anteriores no seleccionados. Retirar bloquea tanto la consulta pública como su agente.

## EPS

| Método y ruta | Uso |
| --- | --- |
| GET `/api/eps/tramites` | Trámites propios |
| GET `/api/eps/tramites/{id}` | Tarea, documentos, seguimiento y versión |
| POST `/api/eps/tramites/{id}/respuestas` | Informar presentación con documento existente, fecha, canal, cargo opcional y versión |

Informar una presentación no significa validación de SUNASS. La respuesta queda por verificar. No enviar el número del oficio como si fuera un ID: usar el identificador canónico devuelto por documentos. No se acepta un documento de otra empresa o expediente.

## Ciudadanía

| Método y ruta | Uso |
| --- | --- |
| GET `/api/publico/decisiones` | Consulta con `q`, `eps_id`, `localidad`, `page` y `page_size` |
| GET `/api/publico/decisiones/{caso_id}` | Resumen ciudadano y documentos expresamente publicados |
| GET `/api/publico/cifras` | Conteos calculados de publicaciones, no indicadores sectoriales inventados |
| GET `/api/publico/documentos/{documento_id}/contenido` | Texto o PDF público |

Si aún no se publicó ninguna decisión, una lista vacía es un resultado válido. Los datos de muestra entregados conservan `simulado=true`; no son datos oficiales de producción.

## Agente para los tres actores

| Método y ruta | Cuerpo |
| --- | --- |
| POST `/api/agente/chat` | `{ "tramite_id": "ID_CANONICO", "pregunta": "...", "conversacion_id": "UUID_OPCIONAL" }` |
| POST `/api/publico/asistente/chat` | `{ "caso_id": "ID_PUBLICACION", "pregunta": "...", "conversacion_id": "UUID_OPCIONAL" }` |

La primera ruta utiliza la sesión de SUNASS o EPS. La segunda no requiere login: crea una cookie de visitante para proteger la propiedad de la conversación. Mantener `credentials: 'include'` también en consultas ciudadanas. Un visitante no puede continuar el hilo de otro visitante aunque conozca su UUID. Las conversaciones institucionales están ligadas a persona, perfil, EPS y expediente.

Una respuesta 200 contiene `estado` (`ok` o `sin_fuentes`), `respuesta`, `fuentes`, `advertencias`, `conversacion_id`, `modelo`, `duracion_ms` y `desde_cache`. Renderizar el texto como texto, sin insertarlo como HTML. Cada fuente incluye documento, página, extracto y enlace autorizado. Las citas FICHA y PLAZOS aparecen como referencias a datos estructurados y no como archivos PDF.

El proveedor se configura con `LLM_ENABLED`, `LLM_BASE_URL`, `LLM_API_KEY` y `LLM_MODEL`. La validación automatizada usa un proveedor sustituido y transporte HTTP simulado: no gasta cuota ni prueba una clave real. Con proveedor caído o deshabilitado, el chat responde 503 y las consultas del portal siguen disponibles. El error incluye `conversacion_id` cuando el hilo ya se creó, para reintentar conservando contexto. Con 429 respetar `Retry-After`; el límite ciudadano es por IP y proceso. Si se usan varios workers, requiere un contador compartido antes del despliegue.

El servidor filtra las fuentes antes de llamar al modelo; ciudadanía solo recibe la proyección publicada. Citas inexistentes, ausencia de citas, cifras sin sustento o formato inválido se reintentan una vez y se descartan si no se pueden verificar. La validación automática no demuestra por sí sola la corrección semántica de toda afirmación; se conserva la evidencia y no se sustituye la decisión humana.

## Errores, archivos y disponibilidad

Errores JSON: `{ "detail": "Mensaje legible", "codigo": "codigo_estable" }`. Códigos: `sin_sesion`, `acceso_denegado`, `no_encontrado`, `conflicto`, `datos_invalidos`, `demasiadas_consultas`, `no_disponible`, `error_interno`, `metodo_no_permitido`. Puede haber `estado` y `conversacion_id` en fallos del agente. Las excepciones no exponen SQL, rutas locales, claves ni mensajes crudos del proveedor.

`GET /api/documentos/{id}/contenido` y su equivalente público aceptan `formato=texto|pdf` y `pagina` positiva. Texto devuelve JSON; PDF disponible devuelve `application/pdf`. Si no existe archivo, responde 404, sin cambiar silenciosamente a JSON de contenido con 200. Las páginas fuera de rango responden 404. Revisar `pdf_disponible` antes de ofrecer abrir PDF.

`/live` prueba el proceso sin BD. `/health` muestra el estado de dependencias. `/ready` exige conexión y tabla de expedientes disponibles; devuelve 503 mientras PostgreSQL no esté preparado. CORS admite el origen `FRONTEND_ORIGIN` con credenciales y métodos GET, POST, PUT y DELETE.

`dias_usados`, `dias_totales`, `fecha_limite`, cifras y algunos bloques pueden ser null. Mostrar “pendiente de validación” o “sin evidencia”; no reemplazar null por cero ni por una fecha calculada en el navegador. Solicitado, autorizado, ejecutado y beneficio comprobado son conceptos distintos.

## Preparación de PostgreSQL para la siguiente validación

En instalación nueva usar los SQL de la guía backend actualizada. Si ya se instaló un esquema anterior, `sql/10_validacion_api.sql` añade manualmente las columnas de visitante e idempotencia. No ejecutar DDL desde el backend. Las pruebas de esta fase sustituyen la persistencia; no acreditan todavía restricciones, transacciones, índices ni conexiones del PostgreSQL real.
