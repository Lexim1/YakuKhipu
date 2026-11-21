# YakuKhipu

Portal para seguir tres procedimientos de SUNASS y coordinar las respuestas de las EPS. Un mismo frontend contiene las vistas SUNASS y EPS, conectado a una API FastAPI y PostgreSQL.

## Empezar

- [Guía del frontend](docs/guia_frontend.md)
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

Paola y Camila construyen el frontend. Lexim1 y Aracelly desarrollan el backend. Este repositorio inicia con las guías, el acuerdo de integración y las plantillas. La primera tarea frontend crea la aplicación Vite siguiendo la guía.

## Ramas

`master` conserva la versión aprobada. `qa` reúne cambios para revisión. Cada tarea usa `feature/<numero>-<descripcion>`, creada desde `master`.

Primero se abre un PR de la rama feature a qa. Después de la validación en QA se abre otro PR de la misma feature a master. Ambos requieren revisión de otra integrante. Se conserva la feature hasta completar ambos pases.

## Entornos

| Entorno | Estado inicial |
| --- | --- |
| Local | Se prepara en la primera tarea frontend |
| QA | Despliegue pendiente de configurar |
| Demo aprobada | Despliegue pendiente de configurar |

El enlace de QA se añadirá cuando exista un despliegue verificado. El portal usará rutas como `/sunass/expedientes` y `/eps/tramites` bajo el mismo sitio.

## Alcance funcional

Los procedimientos son cambio del programa de inversiones, uso excepcional del fondo y revisión periódica. SUNASS consulta responsable, tareas, documentos, historial y plazos. La EPS consulta sus trámites, su siguiente acción, su fecha límite y sus documentos relevantes.

Las cifras de demostración se identifican como simuladas. Las reglas de cómputo y las fechas deben quedar sustentadas antes de emplearse en casos reales.
