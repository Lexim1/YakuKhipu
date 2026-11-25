# Corrección y organización del backend

Fecha: 24 de noviembre de 2026. Cambios limitados al backend, documentación e infraestructura local. El frontend y el único SQL versionado, backend/sql/yakukhipu_final.sql, se conservan sin modificaciones.

## Correcciones

- Usuario y Actor incluyen rol_id. Los permisos se consultan en seguridad.rol_permiso en cada petición.
- Sesión opaca aleatoria persistida en seguridad.sesion y transportada con cookie HttpOnly firmada. Logout revoca en BD; credenciales_version y activo invalidan sesiones. No es JWT ni SSO institucional.
- Analista consulta solo asignaciones activas; Coordinación/Jefatura consultan cartera CPI/UFI/RP. EPS conserva aislamiento por empresa; ciudadanía solo consulta publicaciones habilitadas de esos tres procedimientos.
- Recepción, actuaciones, publicación, asignación y asistente exigen facultades específicas. La lista de acciones también aplica permisos.
- POST /api/tramites/{id}/asignaciones incorpora versión, motivo, verificación de Analista activo e historia de reasignación; no equivale al responsable textual del dataset.
- Alertas, documentos y fuentes del agente reutilizan ámbito de expediente. La caché incorpora rol y permisos.
- Sin endpoints de login demo. Se mantiene un solo provisionador real: scripts.usuario_sql_final.
- Configuración de BD corregida a yakukhipu_final; cookie segura configurable para HTTPS.

## Organización y residuos

app/auth reúne autenticación y autorización; app/modules reúne lógica por dominio. app/api, repositories, models, schemas y agent mantienen sus fronteras. tests se separa en unit, api e integration. db documenta operación sin copiar ni dividir el SQL. El script local PostgreSQL pasa a infra/local. Los informes históricos se archivan bajo docs/archive y las guías vigentes se reescriben.

Se retiran Alembic y su dependencia, semillas JSON de demo, semilla.py, pruebas históricas excluidas, usuario_sql antiguo, ingesta_fuentes redundante, construir_bd_final (dependía de SQL eliminados) y evaluar.py (dependía de usuarios/IDs de demo). Su historial permanece en Git. scripts.generar_sql conserva las herramientas de importación y genera salidas locales ignoradas; no reemplaza automáticamente la instalación vigente.

## Verificación

El SQL conservado se analiza excluyendo exclusivamente los dos metacomandos conocidos de su encabezado psql. Los metacomandos no son errores PostgreSQL ni se eliminan líneas del texto documental.

La suite incluye HTTP con dobles, aislamiento por asignación, denegación de validación técnica a Coordinación, revocación/reutilización de cookies, cambio de credenciales, retiro de permisos, asignación/reasignación y rechazo de procedimientos ajenos.

La integración PostgreSQL se habilita con VERIFY_DATABASE_URL: prueba la carga fuente de solo lectura y un flujo API sobre el esquema real con cuentas temporales, cuatro roles, asignación, documentos, trazabilidad, aislamiento y logout. Las escrituras del flujo están dentro de una transacción externa que se revierte.

Resultados del 24/11/2026: suite completa con PostgreSQL 17, **84 aprobadas, cero omitidas** (154,44 s). Tras el último endurecimiento de cookies, selección de autorización e integración: **11 aprobadas** (23,49 s), incluido el caso adicional de cookie excesiva. Sintaxis Python comprobada y git diff --check sin incidencias. OpenAPI: 28 rutas, incluyendo asignaciones y sin login demo.

Instalación del único SQL completada sin errores en un contenedor temporal. Al terminar las transacciones de integración: cero usuarios, sesiones y asignaciones de prueba persistidos; 36 expedientes del portal, 31 documentos y 729 fragmentos conservados. El contenedor de validación se elimina al terminar. SQL y frontend sin diferencias respecto de HEAD.

## Límites de la entrega

El frontend sigue pendiente de integrar sesión, roles y vistas; su código no se cambió. No se crean endpoints ficticios para las vistas pendientes. El proveedor IA real no se consulta durante las pruebas. La configuración de producción (HTTPS, secretos, despliegue y administración de cuentas) corresponde a cada entorno.

Las bases antiguas no se migran automáticamente. Esta API exige el esquema de yakukhipu_final.sql; ese instalador solo debe ejecutarse sobre una base nueva.
