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
| `src/agente/` | Botón y panel «Preguntar al agente». Cada pantalla le indica su contexto con `useContextoAgente` |
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
