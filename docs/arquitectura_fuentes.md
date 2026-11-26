# Arquitectura y cobertura

## Recorrido de datos

Archivos originales → generación offline → SQL revisable → ejecución manual PostgreSQL → API FastAPI → vistas de Figma.

El generador no importa el motor ORM, no se conecta a PostgreSQL ni ejecuta DDL. La API no carga semillas al arrancar. `sql/01_schema.sql` define las entidades operativas. `sql/local/01_dataset_schema.sql` define las tablas tipadas conservando todas las columnas entregadas. `manifiesto.json` contiene la correspondencia de cada archivo, sus columnas, tipos, llaves, conteos y errores.

`fuente` identifica archivo y hash. `registro_fuente` identifica registro, hash y lote. `registro_revision` conserva contenido de versiones anteriores. Las claves se separan por ámbito, por lo que coincidencias de números entre casos reales y el dataset no unen expedientes.

La tabla `tramite` es la entidad operativa. Las tablas de contexto conservan granularidad: proyecto/año, proyecto/trimestre, fondo/mes, EPS/año, meta/año e IPM/mes. `proyecto_inversion` impide asociar ejecuciones a proyectos de otra EPS. No se suman avances acumulados ni poblaciones repetidas por año.

## Cobertura respecto a las fuentes y Figma

| Necesidad | Implementación | Límite |
| --- | --- | --- |
| Listado y ficha SUNASS | Entidades PostgreSQL y procedencia | No hay frontend en esta rama |
| Línea de tiempo | Hitos DS02 y actuaciones registradas | Fechas documentales sin validar se mantienen desconocidas |
| Comparador | Solicitado/aprobado de DS02 | Ejecución de una decisión no se deduce del monto aprobado |
| Inversiones y metas | Tablas tipadas y endpoint contexto por EPS | Coincidencia por EPS no prueba relación causal |
| DS08/DS09 | Conservación tipada y rastreable | No se deducen vínculos por parecido de nombre |
| Fondos y finanzas | Contexto DS05/DS06 por EPS | No diagnóstico financiero automático |
| Casos PDF | 31 documentos, 729 páginas, acceso desde ZIP | OCR y revisión semántica pendientes |
| Estado de casos reales | Validación humana auditada con documento | No se reutilizan los estados inconsistentes de las semillas |
| Plazos y alertas | Tres capas, calendario y excepciones acreditadas | Sin evidencia devuelve pendiente; no hay calendario legal precargado |
| EPS y ciudadanía | Filtros por sesión y visibilidad | Publicación requiere revisión expresa |
| Acceso | Contraseña local scrypt y cookie con vencimiento | SSO institucional pendiente |
| DS10 y DS11 | Actuaciones/documentos/vínculos preparados | No existen archivos de esos datasets |

Figma es referencia de las vistas y recorridos. La compatibilidad visual y del frontend necesita verificarse cuando esa aplicación exista. Los JSON antiguos pueden seguir presentes como referencia histórica, pero ya no se importan en el flujo de datos.

## Actualizaciones

Cada generación produce un lote determinista a partir de los hashes de entrada. Los INSERT son repetibles. Un registro ausente queda fuera de las consultas operativas, pero no se borra. Los cambios de fuentes no sobreescriben expedientes con actuaciones registradas. Se concilian mediante historial y procedencia. El DDL se aplica una vez a una base nueva y no se ejecuta de nuevo durante actualizaciones de datos.

## Información que exige revisión

Las fechas candidatas provienen de encabezados, y los números candidatos de nombres de archivos. No se validan como metadatos oficiales automáticamente. Actores, relaciones entre documentos y la clasificación final de visibilidad se acreditan con lectura humana. La carga deja todas las páginas disponibles para esa revisión.

Los duplicados y ejecuciones de proyectos inexistentes se conservan en registro_fuente bajo cuarentena, con archivo, fila y motivo en error_calidad_datos. No se elige una variante por orden de aparición. El diccionario se conserva como fuente y hash; el mapeo efectivo de columnas queda en el manifiesto generado.
