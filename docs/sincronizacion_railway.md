# Actualización del frontend en Railway

El despliegue conjunto utiliza cinco servicios. `portal` y `worker` observan
`Lexim1/YakuKhipu-Backend/master`; `portal` construye el `Dockerfile` de la raíz,
que descarga el SHA completo indicado por `FRONTEND_COMMIT` de `Lexim1/YakuKhipu`.
No hace falta crear otro servicio ni cambiar dominios, cookies, Keycloak o BD.

## Flujo automático y revisión

1. El equipo fusiona un PR del frontend en `master`.
2. Actions ejecuta pruebas de sincronización, lint, contratos y compilación.
3. Si pasan, crea `chore/frontend-<SHA completo>` desde backend/master y un PR
   que modifica únicamente el pin del Dockerfile. Cada versión tiene rama y PR.
4. Se solicita revisión de Lexim1, salvo que el token pertenezca a Lexim1
   (GitHub no permite autorrevisión; si la protección exige aprobación, usar
   identidad de automatización distinta mediante GitHub App o colaborador autorizado).
5. El equipo revisa y fusiona ese PR. No hay autofusión ni bypass de protecciones.
6. Railway reconstruye `portal` desde backend/master y descarga el frontend nuevo.
   `worker` también puede reconstruirse porque observa el mismo repositorio.
7. Confirmar SUCCESS en Deployments, comprobar el SHA del backend desplegado y
   abrir el dominio vigente del portal. La compilación correcta de Actions no
   garantiza por sí sola un despliegue exitoso.

Los PR contra `qa`/`master` validan pero no usan el token del backend.
El workflow ignora eventos de master que ya fueron reemplazados por otro commit,
reutiliza el PR existente si se reintenta y nunca fuerza una rama.
Si llegan varias versiones con PR pendientes, revisar y fusionar únicamente
la más reciente y cerrar los PR obsoletos para evitar retroceder de versión.
Un PR cerrado sin fusionar requiere reapertura/revisión humana.

## Activación por la administradora

Se necesita un acceso entre repositorios: el GITHUB_TOKEN propio del frontend
solo tiene alcance en ese repositorio.

1. En la cuenta que administrará la automatización, abrir GitHub → Settings →
   Developer settings → Personal access tokens → Fine-grained tokens → Generate.
2. Resource owner: Lexim1. Repository access: Only select repositories →
   `YakuKhipu-Backend`. Establecer vencimiento según la política del equipo.
3. Repository permissions: Contents **Read and write**, Pull requests **Read and
   write**, Metadata **Read** (automático). No necesita acceso a Railway, BD,
   bucket ni contraseñas del portal. La cuenta debe tener acceso al backend;
   GitHub limita el uso de tokens fine-grained por colaboradores externos.
4. En frontend → Settings → Secrets and variables → Actions → New repository
   secret, guardar el valor con nombre **BACKEND_PR_TOKEN**. No ponerlo en chats,
   archivos .env, commits o variables públicas de Railway.
5. Fusionar el PR de este workflow, luego abrir Actions → «Validar frontend y
   preparar despliegue». Si faltaba el secreto durante el primer intento,
   usar Run workflow en **master** después de configurarlo.
6. Abrir el enlace al PR del backend mostrado en el resumen de Actions.
   Revisar, fusionar y verificar el despliegue de Railway.

Si Actions informa HTTP 401/403, comprobar vencimiento, repositorio permitido,
permisos y aprobación del token. Si informa que falta el secreto, configurar el
nombre exacto. Si falla lint/contratos/build, corregir el frontend primero.
No se publica una versión que falle estas validaciones.

Para una automatización institucional duradera, una GitHub App instalada solo en
el backend evita depender de un token personal y permite a Lexim1 revisar los PR
del bot. Requiere configurar esa App; no se crea ni se presupone aquí.

Documentación oficial: [alcance de GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)
y [tokens con permisos específicos](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

## Comprobaciones locales

`npm ci --no-audit --no-fund`, `npm run test:sync`, `npm run lint`,
`npm run test:contract` y `npm run build`.
Las pruebas de sincronización utilizan respuestas API controladas: no abren PR
ni necesitan secretos. La prueba real se completa al fusionar el workflow,
configurar el secreto y revisar el PR generado en GitHub.
