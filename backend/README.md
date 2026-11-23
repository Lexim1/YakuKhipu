# Backend YakuKhipu sobre archivos fuente

Contrato actual para el frontend: `../docs/contrato_frontend.md` y `../docs/openapi.json`. La validación HTTP utiliza persistencia sustituida; la conexión PostgreSQL se verifica en la fase siguiente. Para una base ya creada con el esquema anterior, ejecutar manualmente `sql/10_validacion_api.sql` antes de usar conversaciones ciudadanas e idempotencia.

La API consulta PostgreSQL. Los CSV, XLSX y ZIP se leen únicamente durante la generación de SQL. Python no crea bases ni tablas, y la aplicación no ejecuta DDL al arrancar. SQLAlchemy conserva el mapeo de las entidades centrales; los scripts SQL son la definición oficial.

## Preparación

Desde `backend`, crea el entorno, instala dependencias y genera los SQL:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m scripts.generar_sql --datasets 'C:\Users\USER\Downloads\DATASETS' --casos 'C:\Users\USER\Downloads\Casos reales'
```

Los resultados están en `sql/local/`: DDL de tablas fuente, INSERT de los datasets, INSERT de los casos, incidencias y manifiesto con mapeo de columnas, hashes y conteos. Contienen texto documental y se excluyen de Git. Los originales no se modifican. `ds01_catalogo_eps.xlsx` se reconoce por su contenido CSV.

## Ejecución manual de PostgreSQL

Requiere PostgreSQL 15 o posterior (`UNIQUE NULLS NOT DISTINCT`). Usa una base nueva para conservar la instalación anterior. Con tu cuenta administradora, ejecuta primero `00_create_database.sql` conectado a `postgres`, sin abrir una transacción. En pgAdmin, cambia luego la conexión a `yakukhipu_fuentes`. Cada archivo posterior es SQL estándar y puede ejecutarse en Query Tool, en este orden:

1. `sql/01_schema.sql`
2. `sql/local/01_dataset_schema.sql`
3. `sql/02_constraints_indexes.sql`
4. `sql/03_reference_data.sql`
5. `sql/local/04_dataset_inserts.sql`
6. `sql/local/05_real_cases_inserts.sql`
7. `sql/local/08_calidad.sql`
8. `sql/09_integridad_dataset.sql`
9. `sql/06_views.sql`
10. `sql/07_validation_queries.sql`

Alternativa con psql, desde `backend` (usuario y servidor según tu instalación):

```powershell
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f sql/00_create_database.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/01_schema.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/local/01_dataset_schema.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/02_constraints_indexes.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/03_reference_data.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/local/04_dataset_inserts.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/local/05_real_cases_inserts.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/local/08_calidad.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/09_integridad_dataset.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/06_views.sql
psql -U postgres -d yakukhipu_fuentes -v ON_ERROR_STOP=1 -f sql/07_validation_queries.sql
```

El esquema se ejecuta una sola vez. Para actualizar datos, vuelve a generar y ejecuta solamente 04, 05 y 08. `ON CONFLICT` evita duplicados. Los hashes conservan revisiones; las filas ausentes quedan `presente=false` y se conserva su historial. No se eliminan actuaciones. Los expedientes modificados por una persona (`version>1`) conservan su estado operativo; sus nuevas fuentes quedan disponibles para conciliación. No hay sincronización automática en segundo plano.

## Conexión y acceso

Copia `.env.example` a `.env`. Configura `DATABASE_URL`, una `SECRET_KEY` aleatoria de al menos 32 caracteres y `DOCUMENTOS_DIR` con la carpeta que contiene los ZIP. Usa una cuenta de aplicación con permisos DML, sin permiso de crear tablas. Mantén `SESION_DEMO=false` y `FECHA_DEMO` vacío.

No se insertan usuarios ficticios. Para provisionar una persona real, genera su INSERT; la contraseña se pide de forma oculta y se almacena con scrypt:

```powershell
python -m scripts.usuario_sql --id IDENTIFICADOR_REAL --nombre 'Nombre real' --perfil sunass
```

Para EPS añade `--perfil eps --eps-id ID_CANONICO_DE_EPS`. Ejecuta el INSERT mostrado en PostgreSQL. Inicia sesión con `POST /api/sesion` y cuerpo `{"usuario_id":"...","password":"..."}`. El perfil y la EPS salen de la base. La cookie firmada vence en ocho horas. Es una autenticación local; no constituye conexión al SSO institucional.

```powershell
python -m uvicorn app.main:app --reload
```

## Procedencia y documentos

Se separan `dataset`, `caso_real`, `sistema` y `sintetico`. Los identificadores canónicos incluyen dominio y hash determinista. El ID original queda en `registro_fuente`. El dataset entregado es de muestra: cargarlo no lo convierte en información oficial. `simulado=true` identifica sus registros en la API, aunque ya no se usan las semillas antiguas.

Los 31 PDF se guardan por página con hash, referencia de ZIP y marca de OCR. Su visibilidad inicial es interna. Las fechas y números extraídos son candidatos, pendientes de validación. La clasificación de actores y las relaciones entre documentos requieren revisión; no se inventan cuando falta evidencia. El texto solo se envía a un proveedor de IA si se habilita expresamente el asistente y se realiza una consulta.

Para validar el estado de un caso documental, SUNASS registra `validar_expediente` en `/api/tramites/{id}/eventos` con `documento_id`, `fecha_acreditada`, `estado_validado`, `paso_validado` y la `version` observada. El documento debe pertenecer al caso. Este paso permite acreditar la resolución histórica sin convertir una inferencia del nombre de archivo en decisión oficial.

## Plazos y publicación

`plazo` separa normativo, gestión y oficio. `suspension`, `prorroga` y `calendario_dia` conservan evidencia. Los días del calendario deben estar cargados y validados, incluidos fines de semana y feriados. El reloj suma las prórrogas y excluye la unión de suspensiones. Si falta evidencia, no declara un vencimiento. Los agregados DS02 se muestran como datos fuente, sin interpretarlos como calendario legal. El semáforo operativo utiliza el plazo normativo de la etapa; las otras capas quedan disponibles para revisión en la base. El umbral de aviso es 75 % del tiempo utilizado, una política de gestión, no una regla legal.

No hay publicaciones automáticas. Para habilitar una decisión deben revisarse `tramite.publicable`, `publicacion.publicada`, su resumen público y la visibilidad de cada documento. La ciudadanía solo accede al contenido expresamente publicado.

## Pruebas

```powershell
python -m pytest
```

Las pruebas históricas que dependían de semillas están excluidas de colección y se conservan para referencia. Las nuevas prueban HTTP, roles, transiciones, agente y transporte IA con dobles aislados; no crean ni destruyen tablas. La prueba PostgreSQL es de solo lectura y se habilita después de tu instalación:

```powershell
$env:VERIFY_DATABASE_URL='postgresql://USUARIO:CLAVE@localhost:5432/yakukhipu_fuentes'
python -m pytest tests/test_postgres_fuentes.py
```

El analizador `pglast` comprueba sintaxis; no reemplaza la ejecución en PostgreSQL. La prueba de integración queda omitida mientras no exista esa conexión explícita.
