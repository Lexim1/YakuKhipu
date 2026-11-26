# YakuKhipu

La instalación vigente del backend y el orden de ejecución manual de PostgreSQL están en [backend/README.md](backend/README.md). El esquema SQL sustituye el arranque con Alembic y las semillas antiguas. La arquitectura y sus límites están en [docs/arquitectura_fuentes.md](docs/arquitectura_fuentes.md). El contenido que sigue describe la planificación inicial.

Portal para seguir tres procedimientos de SUNASS y coordinar las respuestas de las EPS. Un mismo frontend contiene las vistas SUNASS, EPS y Ciudadanía, conectado a una API FastAPI y PostgreSQL.

## Empezar

- [Guía del frontend](docs/guia_frontend.md)
- [Guía del backend y del agente](docs/guia_backend_agente.md)
- [Trabajo con ramas y aprobaciones](CONTRIBUTING.md)
- [Acuerdo inicial de la API](docs/contrato_api.md)
- [Tareas del equipo](https://github.com/Lexim1/YakuKhipu/issues)
- [Prototipo en Figma](https://www.figma.com/design/t4Lro34dvKshsTg5KWIJho/YakuKhipu/?node-id=138-3654)

## Stack de arranque

| Parte | Tecnología |
| --- | --- |
| Portal | React y TypeScript con Vite |
| Navegación | React Router en modo declarativo |
| Estilos | CSS compartido con variables de color y espacio |
| Comunicación | fetch mediante un módulo de servicios |
| API | FastAPI y Pydantic |
| Persistencia | PostgreSQL con SQLAlchemy y Alembic |
| Asistente | LangGraph y OpenRouter desde el backend |

Paola y Camila construyen el frontend. Lexim1 y Aracelly desarrollan el backend. Este repositorio inicia con las guías, el acuerdo de integración y las plantillas. La primera tarea frontend crea la aplicación Vite siguiendo la guía. Paola desarrolla el buscador ciudadano y Camila la ficha pública, junto con sus responsabilidades SUNASS y EPS.

## Ramas

`master` conserva la versión aprobada. `qa` reúne cambios para revisión. Cada tarea usa `feature/<numero>-<descripcion>`, creada desde `master`.

Primero se abre un PR de la rama feature a qa. Después de la validación en QA se abre otro PR de la misma feature a master. Ambos requieren la aprobación de Lexim1. Las compañeras pueden revisar y comentar. La exigencia técnica de esa aprobación queda operativa cuando .github/CODEOWNERS está en ambas ramas destino y sus reglas exigen revisión de Code Owners. Véase [configuración de aprobaciones](docs/configuracion_aprobaciones.md). Se conserva la feature hasta completar ambos pases.

## Entornos

| Entorno | Estado inicial |
| --- | --- |
| Local | Se prepara en la primera tarea frontend |
| QA | Despliegue pendiente de configurar |
| Demo aprobada | Despliegue pendiente de configurar |

El enlace de QA se añadirá cuando exista un despliegue verificado. El portal usará rutas como `/sunass/expedientes`, `/eps/tramites` y `/ciudadania/decisiones` bajo el mismo sitio.

## Conexión con el backend

El backend vive en [Lexim1/YakuKhipu-Backend](https://github.com/Lexim1/YakuKhipu-Backend). Portal y API comparten origen: el navegador llama a `/api/...` del propio portal y un proxy lo reenvía a FastAPI. Así viaja la cookie de sesión (HttpOnly, sin tokens en el navegador) y funciona el ingreso institucional.

- **Desarrollo:** copiar `.env.example` como `.env.local` (`VITE_API_URL` vacío). `npm run dev` reenvía `/api` y `/health` a `VITE_PROXY_API` (por defecto `http://localhost:8000`).
- **Ingreso:** «Ingresar con cuenta institucional» lleva a `/api/auth/login` → Keycloak → `/api/auth/callback`. El portal no solicita ni almacena contraseñas. Cerrar sesión también cierra Keycloak si el backend devuelve `X-Logout-URL`.
- **Permisos:** el menú y las acciones siguen la lista `permisos` de `GET /api/sesion`; el backend los vuelve a exigir en cada petición.
- **PDF:** si `GET /health` → `carga_pdf` es `habilitada`, Recepción permite cargar PDF; el worker del backend extrae el texto y el agente propone un análisis que SUNASS revisa en la ficha del expediente.

## Despliegue en Railway

El `Dockerfile` compila el portal y lo sirve con nginx (`deploy/nginx.conf.template`), que reenvía `/api` y `/health` al backend por la red privada.

1. Crear un servicio desde este repositorio (rama conectada) con el `Dockerfile` de la raíz.
2. Variable `BACKEND_URL`: dirección privada del servicio del backend, por ejemplo `http://portal.railway.internal:8080` (sin barra final). Railway define `PORT`.
3. Generar el dominio HTTPS del portal y usarlo en el backend como `PORTAL_ORIGIN` y `FRONTEND_ORIGIN`, y en Keycloak como Redirect URI `https://<portal>/api/auth/callback`, post logout `https://<portal>/` y Web origin `https://<portal>`.
4. El resto (PostgreSQL, Keycloak, bucket y worker) está en `infra/railway/README.md` del backend.

## Alcance funcional

Los procedimientos son cambio del programa de inversiones, uso excepcional del fondo y revisión periódica. SUNASS consulta responsable, tareas, documentos, historial y plazos. La EPS consulta sus trámites, su siguiente acción, su fecha límite y sus documentos relevantes. Ciudadanía consulta sin sesión los casos habilitados para publicación, busca por EPS o localidad y abre una ficha con solicitado, autorizado, ejecutado, impacto sustentado y fuentes públicas. El asistente ciudadano utiliza exclusivamente información pública. El backend entrega una respuesta pública específica que excluye la información interna.

Las cifras de demostración se identifican como simuladas. Las reglas de cómputo y las fechas deben quedar sustentadas antes de emplearse en casos reales.
