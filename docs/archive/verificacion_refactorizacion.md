> HISTÓRICO: corresponde a una etapa anterior. Consultar ../correccion_backend.md y ../../backend/README.md para el estado vigente.

# Verificación y pendientes de datos

## Comprobaciones realizadas

- La aplicación importa y genera OpenAPI con 24 rutas, incluido login con credenciales y contexto por expediente.
- Ocho pruebas unitarias pasan: identidad por origen, reconocimiento CSV con extensión XLSX, tipos y valores ausentes, escape SQL, scrypt, falta de regla, suspensión/calendario incompleto y rechazo de documento ajeno.
- Los DDL y consultas estáticas pasan por el analizador de sintaxis PostgreSQL.
- Los INSERT finales también pasaron por ese analizador (prueba adicional: 1 aprobada). La validación sintáctica no equivale a una instalación PostgreSQL comprobada.
- La compilación Python no detectó errores de sintaxis.
- No se ejecutó SQL sobre la base del usuario ni se creó una base desde Python.

## Calidad de archivos

DS01: 20 EPS y 53 localidades. DS02: 481 procedimientos y 1825 hitos. DS03: 1114 filas. DS04: 5056 filas originales; 5034 operativas y 22 en cuarentena. DS05: 3202 filas. DS06: 100. DS07: 1330. DS08: 452. DS09: 68.

La cuarentena comprende las seis variantes de tres claves duplicadas y 16 referencias a proyectos ausentes. Se conservan originales, fila y motivo. El archivo de catálogo con extensión XLSX contiene CSV.

Los tres ZIP reúnen 31 PDF y 729 páginas. EMAPA Pasco tiene 21 páginas con texto insuficiente para la recuperación documental, marcadas para OCR. El manifiesto local contiene los resultados efectivos de cada ejecución.

## Verificación pendiente de ejecución del usuario

Después de instalar los SQL en PostgreSQL 15 o posterior, ejecutar las consultas de `07_validation_queries.sql` y la prueba de solo lectura con `VERIFY_DATABASE_URL`. La repetición de INSERT se diseñó con claves deterministas y ON CONFLICT, pero debe confirmarse en esa instalación. No se considera verificada una transacción real sin esa prueba.

## Revisión documental pendiente

Actores, relaciones entre documentos, fechas faltantes, reglas legales, calendario y visibilidad requieren evidencia acreditada. La API permite validar el estado del caso con un documento del mismo expediente. No hay publicaciones automáticas, conexión SIA ni SSO institucional. Las pantallas de Figma necesitan validación de integración cuando se incorpore el frontend a esta rama.

Las pruebas históricas ligadas a semillas se conservaron y se excluyeron de colección, por lo que los resultados actuales no afirman cobertura de aquellas pruebas. Las pruebas nuevas no borran datos ni crean tablas.
