> HISTÓRICO: corresponde a una etapa anterior. Consultar ../correccion_backend.md y ../../backend/README.md para el estado vigente.

# Auditoría y base final de cuatro perfiles

Fecha de revisión: 23 de noviembre de 2026. Alcance: backend restaurado, fuentes locales, vistas acordadas y SQL final. En esta entrega se añaden SQL y herramientas de empaquetado/provisión; no se reinstalan los cambios de autenticación de la API que se habían revertido.

## Dictamen del proyecto actual

La persistencia fuente y la trazabilidad documental tienen una base utilizable. La API restaurada todavía no cumple la separación de cuatro perfiles: distingue SUNASS, EPS y público. El SQL final prepara identidad, facultades y ámbitos, pero debe conectarse al backend antes de afirmar autorización completa en el sistema.

| Prioridad | Hallazgo en código | Resolución en BD y trabajo pendiente en API |
|---|---|---|
| Alta | app/core/sesion.py deriva únicamente perfil/EPS; no hay cargo interno ni permiso por operación | seguridad.rol, permiso y rol_permiso; API debe cargar rol_id y autorizar cada operación |
| Alta | app/repositories/tramites.py permite todo a SUNASS | asignacion_tramite y seguridad.puede_tramite; aplicar el filtro también a documentos, alertas, reportes y agente |
| Alta | La sesión HMAC actual no usa un registro revocable; el logout borra la cookie | seguridad.sesion y sesion_valida permiten revocación; API debe verificar la sesión persistente y gestionar renovación/logout |
| Alta | Registrar una resolución depende solo de ser SUNASS | Exigir acto_externo.registrar y evidencia en backend; no implementar una aprobación institucional ni usuarios de Consejo/Gerencia |
| Media | Recepción y publicación usan un control genérico SUNASS | Facultades separadas para Coordinación/Jefatura; API debe comprobarlas |
| Media | La API lista procedimientos adicionales del dataset | v_expedientes_portal delimita CPI/UFI/RP sin eliminar datos fuente; API debe utilizarla o aplicar idéntico filtro |
| Media | asignado_a es texto de responsable documental | Asignación formal a cuenta activa, historial y unicidad; incorporar operaciones de asignar/reasignar en la API |
| Media | No existen endpoints completos de dashboard, ficha 360, encargos, reportes y configuración del nuevo alcance | BD incluye soporte de vistas, permisos, asignaciones y encargos; faltan contratos/servicios frontend para esas vistas |
| Media | El script usuario_sql anterior no solicita rol | Usar usuario_sql_final para esta instalación nueva; no asignar un cargo por defecto |

No se encontró una aplicación frontend en esta rama. El agente existente ya comprueba el expediente antes de recuperar sus fuentes; cuando se cambie la autorización hay que pasar el nuevo ámbito a ese mismo punto y mantener aisladas conversaciones y cachés.

## Perfiles y vistas acordadas

| Perfil autenticado | Consulta y trazabilidad | Operaciones del portal |
|---|---|---|
| Analista SRT | Solo expedientes asignados; ficha, línea de tiempo, documentos, comparador, plazos, alertas, contexto EPS y agente | Validar datos/vínculos, registrar requerimientos acreditados, verificar respuestas y actualizar seguimiento con evidencia |
| Coordinación DRE | Cartera DRE de los tres procedimientos; recepción, dashboard, bandeja, trazabilidad, ficha 360, encargos y reportes | Incorporar/asignar, registrar actos externos, gestionar encargos y publicaciones revisadas |
| Jefatura DRE | Toda la cartera y configuración | Supervisión, validación, gestión y control; registrar no equivale a aprobar un acto regulatorio |
| Responsable EPS | Solo expedientes de su propia empresa y documentos permitidos; seguimiento y agente | Informar presentación por el canal oficial, pendiente de verificación por SUNASS |

Los tres perfiles SUNASS tienen permiso de trazabilidad; cambia su ámbito y las escrituras permitidas. Ciudadanía es acceso público, sin un quinto usuario autenticado. Gerencia, Consejo, OAJ, DU, ODS y Mesa de Partes son intervinientes documentales. No se crean cuentas para ellos por figurar en un flujograma.

## Conciliación con datasets y casos

Se compararon los SHA-256 de los 15 archivos entregados con el manifiesto de carga: no hubo archivos nuevos, modificados ni ausentes. No se modificaron los originales. Se incluye su SQL de carga actual, con procedencia, lote, revisiones y cuarentena.

| Fuente | Cobertura conservada |
|---|---|
| DS01 | 20 EPS y 53 localidades |
| DS02 | 481 procedimientos y 1 825 hitos |
| DS03 | 1 114 registros de programa de inversiones |
| DS04 | 5 034 ejecuciones válidas de 5 056; 22 en cuarentena |
| DS05–DS09 | 3 202 fondos, 100 estados financieros, 1 330 metas, 452 inversiones MEF y 68 IPM |
| Casos reales | 3 expedientes, 31 PDF y 729 páginas; 21 pendientes de OCR |

De DS02, únicamente 9 CPI, 4 UFI y 20 RP corresponden al portal: 33 en total. Sumando los tres casos reales, v_expedientes_portal contiene 36 expedientes. Los otros 448 procedimientos se conservan como datos fuente; no se les inventa un flujo operativo.

DS10 y DS11 no se recibieron. Los datos de muestra siguen siendo simulados. Ni la aprobación ni el monto autorizado prueban ejecución o beneficio comprobado. Los documentos reales se importan internos y sus metadatos candidatos requieren validación humana.

## Entrega SQL

La guía es backend/sql/final/README.md. Los archivos completos se generan en backend/sql/local/final mediante scripts.construir_bd_final. Ese programa solo escribe archivos, sin abrir conexiones ni ejecutar DDL. La base se crea manualmente con PostgreSQL.

El paquete incluye todas las tablas originales, INSERT de fuentes, constraints, índices y vistas, además del catálogo de cuatro perfiles, permisos por vista/operación, cuentas scrypt, sesiones revocables, historial de asignaciones, intervinientes externos y encargos con evidencia del mismo expediente.

Hay dos niveles distintos: facultades de personas del portal y privilegios de la conexión PostgreSQL. yakukhipu_final_api es un rol técnico NOLOGIN, sin DDL ni modificación de cuentas/permisos o borrado del historial. Crear una cuenta LOGIN propia y concederle ese rol; usar otra cuenta para administración e importación. [Referencia oficial de privilegios PostgreSQL](https://www.postgresql.org/docs/17/ddl-priv.html).

Las funciones de autorización devuelven decisiones para un usuario autenticado; no son RLS ni validan una contraseña/token por sí mismas. La API debe derivar el usuario de una sesión verificada, aplicar la función antes de consultar y no aceptar usuario_id o rol desde parámetros manipulables como autoridad.

Se entrega una instalación NUEVA en yakukhipu_final. No se borra ni se migra automáticamente una base anterior. No se generan cuentas ni contraseñas de prueba en los entregables.

## Validaciones

Se ejecutó el SQL completo en PostgreSQL 17, en un contenedor temporal sin conexión de red ni puertos publicados. La instalación terminó sin errores. Se verificaron los cuatro perfiles, 481 procedimientos fuente, 36 expedientes del portal, 31 PDF y 729 páginas.

Las pruebas transaccionales comprobaron: trazabilidad de los tres perfiles SUNASS, restricción del analista por asignación, aislamiento EPS, visibilidad documental, ausencia de publicación automática, rechazo de un quinto perfil, incompatibilidad perfil/rol, rechazo de contraseña plana, asignación solo a analista activo, unicidad de asignación activa, revocación inmediata al desactivar/reactivar una cuenta y evidencia de encargos del mismo expediente. También se permitió cerrar correctamente una asignación histórica después de desactivar al analista.

Con SET ROLE yakukhipu_final_api se rechazaron DDL, administración de usuarios, modificación de permisos, borrado de actuaciones y borrado de asignaciones. Los usuarios y sesiones de prueba se revirtieron: cero cuentas ficticias persistidas. Se comprobó además la sintaxis con pglast y la compilación de los dos scripts Python nuevos.

El backend restaurado tenía 74 pruebas aprobadas y una prueba PostgreSQL omitida; ese resultado no demuestra la integración de los cuatro perfiles nuevos, que continúa pendiente en API. Esta entrega acredita por separado la instalación y los controles SQL. Los hashes y resultados de la entrega se conservan en sql/local/final/manifiesto_final.json y validacion_postgres.json.
