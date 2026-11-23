# Frontend de YakuKhipu

Portal en React, TypeScript y Vite con tres vistas: SUNASS, EPS y Ciudadanía.

## Arrancar

```bash
cd frontend
npm ci
cp .env.example .env.local   # en Windows: copy .env.example .env.local
npm run dev
```

Abrir la dirección que muestra la terminal (normalmente http://localhost:5173).

## Configuración

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL de la API FastAPI, por ejemplo `http://localhost:8000` |
| `VITE_USAR_EJEMPLOS` | `true` usa los datos simulados de `src/mocks`; `false` consulta la API real |

Reiniciar `npm run dev` después de cambiar `.env.local`. Las variables `VITE_` son visibles en el navegador: no guardar claves aquí.

## Sesión

La entrada del portal (`/`) es el ingreso. Cada cuenta abre la vista de su perfil: SUNASS va a `/sunass/te-toca`
y una EPS a `/eps/tramites`. Las rutas `/sunass` y `/eps` piden sesión; si la cuenta es de otro perfil, se
redirige a su propia vista. Ciudadanía (`/ciudadania`) es pública. El backend vuelve a comprobar cada permiso.

- Con `VITE_USAR_EJEMPLOS=true` se usan las cuentas de `src/mocks/sesion.ts` (mismos identificadores que la semilla del
  backend) con la contraseña de demostración que muestra la pantalla de ingreso.
- Con la API real: `POST /api/sesion` con `{ usuario, clave }` (por acordar con backend), `GET /api/sesion` y
  `DELETE /api/sesion`. Una respuesta 401 en cualquier pantalla devuelve al ingreso.

## Asistente y fuentes

Cada pantalla registra su contexto con `useContextoAgente({ espacio, preguntas, caso, publico })`.

- Con `caso: { tipo: 'tramite', id }` (SUNASS y EPS) el panel pregunta a `POST /api/agente/chat`; con
  `caso: { tipo: 'publico', id }` (ciudadanía) a `POST /api/publico/asistente/chat`. La conversación sigue con
  `conversacion_id` mientras no cambie el caso.
- Cada cita trae un `enlace` que arma el backend según el acceso: el panel abre ahí el texto de la página citada y
  resalta el fragmento; si hay PDF, ofrece abrirlo. En ciudadanía solo llegan fuentes públicas.
- Sin caso (listados) o con `VITE_USAR_EJEMPLOS=true`, responde las preguntas preparadas de la pantalla.
- Si el servicio de IA responde 503, una pregunta sugerida se responde con los datos de la pantalla (con aviso); una
  pregunta escrita muestra el error y «Volver a preguntar». El 429 del asistente ciudadano se muestra tal cual.

## Comprobar antes de un PR

```bash
npm run lint
npm run build
```

## Organización

| Carpeta | Contenido |
| --- | --- |
| `src/app/` | Rutas, cabeceras y menús |
| `src/pages/sunass/`, `src/pages/eps/`, `src/pages/ciudadania/` | Pantallas de cada vista |
| `src/components/` | Componentes compartidos: `Chip` (estado con color y texto), `Fuente` (documento y página), `Barra` (plazo), `Dialogo` (ventanas), `PanelAccesibilidad`, `Iconos`, `AvisoSimulado` y mensajes de carga, error y vacío (`Mensajes`) |
| `src/agente/` | Botón y panel «Preguntar al agente» y visor de la fuente citada. Cada pantalla le indica su contexto con `useContextoAgente` |
| `src/services/` | `api.ts` (fetch compartido), `useConsulta.ts` y un servicio por vista |
| `src/types/` | Tipos según `docs/contrato_api.md` |
| `src/mocks/` | Ejemplos simulados con la forma del contrato |
| `src/styles/` | Variables de color y espacio, estilos comunes |

## Cómo construir una pantalla

1. Usar `useConsulta` con una función de `src/services/`.
2. Envolver el resultado en `<Contenido>`: muestra carga, error con «Reintentar» y el contenido.
3. Contemplar el resultado vacío con `<SinResultados>`.
4. Si los datos son simulados, mostrar `<AvisoSimulado />` o un `<Chip tono="morado">Simulado</Chip>`.
5. Los estados siempre llevan texto además del color: usar `<Chip>`.

## Diseño

Las pantallas siguen el Figma «YakuKhipu · OFICIAL» (página «Prototipo v2»). Fuente: Inter (`@fontsource-variable/inter`). Colores en `src/styles/variables.css`.
