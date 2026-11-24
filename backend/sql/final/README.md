# Base final de YakuKhipu

Instalación nueva en PostgreSQL 15 o posterior. No ejecutar sobre una base existente ni mezclar con los SQL de los intentos JWT/OIDC revertidos. No crea usuarios ficticios ni incluye contraseñas predeterminadas.

Desde backend:

```powershell
python -m scripts.construir_bd_final
```

El empaquetador comprueba los hashes de los archivos de DATASETS y Casos reales contra el manifiesto. Si alguno cambió, se detiene: regenerar primero con scripts.generar_sql y volver a empaquetar. No ejecuta SQL desde Python.

Los entregables completos están en sql/local/final, fuera del versionado público porque incluyen datos y texto de expedientes:

- 00_crear_base.sql: creación de yakukhipu_final, conectado a postgres y fuera de transacción.
- 01_yakukhipu_final.sql: conectado a yakukhipu_final, estructura, constraints, índices, vistas, INSERT y seguridad.
- instalar_todo_psql.sql: archivo autónomo para psql, incluye creación y conexión. No usar sus directivas en Query Tool de pgAdmin.
- manifiesto_final.json: archivos de entrada, conteos y SHA-256 de los entregables.

En psql:

```powershell
psql -U postgres -d postgres -f sql/local/final/instalar_todo_psql.sql
```

En pgAdmin: ejecutar primero 00_crear_base.sql conectado a postgres; abrir una conexión a yakukhipu_final y ejecutar 01_yakukhipu_final.sql con detención ante errores. Los scripts se ejecutan una vez. No borran bases anteriores.

## Identidad y autorización

Cuatro perfiles: analista_srt, coordinacion_dre, jefatura_dre y eps. Ciudadanía no requiere una cuenta. El rol técnico PostgreSQL yakukhipu_final_api no es un perfil adicional de personas.

usuario conserva password_hash scrypt compatible con Python, activo y una versión de credenciales. rol_id y perfil tienen una FK conjunta para impedir cuentas EPS con cargo SUNASS. No hay rol por defecto ni promoción automática.

seguridad.rol_permiso declara las facultades y seguridad.v_usuario_vistas permite construir el menú. Los tres perfiles SUNASS tienen trazabilidad.consultar. El analista consulta únicamente expedientes asignados; Coordinación y Jefatura, la cartera DRE. EPS consulta solo su propia empresa y documentos de partes/públicos.

Funciones para el backend, con parámetros vinculados:

```sql
SELECT seguridad.tiene_permiso(:usuario_autenticado, 'recepcion.gestionar');
SELECT seguridad.puede_tramite(:usuario_autenticado, :tramite_id, 'trazabilidad.consultar');
SELECT seguridad.puede_documento(:usuario_autenticado, :documento_id);
SELECT * FROM seguridad.v_usuario_vistas WHERE usuario_id=:usuario_autenticado;
SELECT seguridad.sesion_valida(:sesion_uuid);
```

El identificador debe derivarse de una identidad autenticada por el servidor, nunca del cuerpo de la petición. Estas funciones no sustituyen la validación de contraseña o firma/expiración de un token. Tampoco activan RLS: una conexión SQL privilegiada no queda filtrada automáticamente al consultar tablas. El backend debe aplicar las funciones antes de devolver datos o llamar al agente. El backend restaurado todavía necesita esa integración; el informe de auditoría detalla los pendientes.

seguridad.sesion admite renovación y revocación mediante hash del refresh; no guardar tokens originales. Desactivar o cambiar contraseña, rol o EPS revoca las sesiones de la cuenta por trigger. La aplicación debe consultar sesion_valida en cada petición si adopta estas sesiones. También debe rotar el refresh y registrar los eventos de acceso.

Crear la cuenta LOGIN de conexión con contraseña propia, sin SUPERUSER ni propiedad de tablas, y concederle yakukhipu_final_api. El rol no tiene DDL ni administración de cuentas/permisos ni UPDATE/DELETE del historial. Los importadores y administradores usan otra cuenta.

Provisionar cuentas reales:

```powershell
python -m scripts.usuario_sql_final --id IDENTIFICADOR_REAL --nombre 'Nombre real' --rol analista_srt
python -m scripts.usuario_sql_final --id RESPONSABLE_REAL --nombre 'Responsable EPS' --rol eps --eps-id ID_CANONICO_EPS
```

Ejecutar el INSERT generado como administrador. La contraseña se pide de forma oculta. Un ID existente no se modifica. El script anterior usuario_sql es del esquema restaurado y no asigna rol: para esta BD usar usuario_sql_final.

## Trazabilidad y alcance

asignacion_tramite conserva asignaciones anteriores y permite una sola activa por expediente; el asignador debe tener permiso y el destinatario ser un analista activo. Reasignar cierra la anterior y registra la nueva dentro de una transacción.

interviniente_documental representa OAJ, Mesa de Partes, Gerencia, Consejo, DU y ODS sin darles cuentas. actuacion.usuario_id identifica quién registró en el portal; interviniente_id identifica al actor documental acreditado. v_trazabilidad_portal muestra ambas dimensiones.

encargo y encargo_evento permiten seguimiento con evidencia del mismo expediente y sin cuenta para el responsable externo. El backend debe exigir permiso, versión actual y documento antes de cambiar su estado.

v_expedientes_portal limita el producto a CPI, UFI y RP. Se conservan los 481 procedimientos fuente; 33 son prioritarios y hay otros tres expedientes de casos reales. Los 448 procedimientos adicionales del dataset no se eliminan. El backend debe consultar esta vista o aplicar el mismo filtro.

Las publicaciones permanecen desactivadas hasta revisión expresa. Los datos de muestra siguen marcados como simulados. Las 22 ejecuciones con incidencias quedan en cuarentena; DS10/DS11 no se recibieron y 21 páginas requieren OCR. No se precargan calendarios legales ni fechas inferidas como verificadas.
