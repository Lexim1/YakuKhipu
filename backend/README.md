# Backend de YakuKhipu

API FastAPI + PostgreSQL con el asistente LangGraph. Sigue `docs/guia_backend_agente.md` y `docs/contrato_api.md`.
Los datos marcados `simulado` son de demostración; la sesión también es una **simulación** hasta conectar la institucional.

## Arranque local (Windows, desde `backend/`)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env        # completar DATABASE_URL, SECRET_KEY y, si se usa IA, LLM_*
powershell -ExecutionPolicy Bypass -File scripts\iniciar_postgres.ps1   # PostgreSQL portátil local
python -m alembic upgrade head
python -m scripts.semilla --reiniciar       # datos de demostración y fichas de los casos reales
python -m scripts.ingesta_fuentes           # opcional: texto de los PDF locales (DOCUMENTOS_DIR)
python -m uvicorn app.main:app --reload
```

Abrir http://127.0.0.1:8000/docs. Para probar como un perfil: `POST /api/sesion/demo` con
`{"usuario_id": "sunass-srt"}`, `"eps-tacna"`, `"eps-rio-claro"`, `"eps-epssmu"` o `"eps-emapa-pasco"`
(`GET /api/sesion/demo/usuarios` los lista). El frontend usa la misma cookie con `credentials: 'include'`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `app/main.py`, `app/core/` | Aplicación, configuración (`pydantic-settings`), base de datos, sesión firmada y errores estables |
| `app/models/`, `alembic/` | Entidades y migraciones: EPS, usuario, trámite, actuación, regla de plazo, documento, fragmento, conversación, mensaje, caché, publicación, recepción y alerta |
| `app/repositories/tramites.py` | **Único punto de lectura** de trámites y documentos, con el filtro de acceso aplicado |
| `app/services/` | Transiciones (`tramites.py`), vista EPS (`eps.py`), plazos (`plazos.py`), ciudadanía, documentos y fuentes del agente |
| `app/api/` | Routers del sistema (SUNASS, EPS, Ciudadanía, documentos, sesión) y del asistente |
| `app/agent/` | `graph.py` (flujo), `prompts.py`, `retrieval.py` (BM25), `llm.py` (httpx asíncrono), `cache.py`, `fuentes.py` (interfaz) |
| `app/schemas/` | Formatos Pydantic de entrada y del asistente |
| `scripts/` | Semilla, ingesta de PDF, chat por terminal, evaluación y primera llamada al modelo |
| `tests/` | pytest con una base aparte y el modelo simulado (sin llamadas reales a IA) |

## Reglas que el código garantiza

- **Accesos:** SUNASS ve todo; una EPS solo sus trámites y los documentos `partes` o `publica` (un trámite ajeno responde 404, igual que uno inexistente); Ciudadanía solo casos publicados y documentos `publica`. El perfil sale de la sesión, nunca del cuerpo.
- **Transiciones:** cada actuación y el nuevo estado se guardan en una transacción. Se rechaza la acción no permitida en el estado (409), la versión desactualizada (409) y el reenvío con otra clave cuando ya no hay tarea (409). El mismo `Idempotency-Key` devuelve el mismo resultado sin duplicar.
- **Presentación de la EPS:** queda «por verificar» hasta que SUNASS registra `verificar_respuesta`.
- **Plazos:** días hábiles con feriados (calendario por validar). RP mide la etapa activa. Toda regla sin validar por la DRE devuelve `pendiente_de_validacion` y su motivo. El modelo recibe el resultado; no calcula.
- **Asistente:** autoriza → caché → recupera solo fragmentos visibles → `sin_fuentes` sin llamar al modelo si no hay evidencia → genera → comprueba citas y cifras contra las fuentes → entrega con enlaces autorizados. Si el proveedor falla: 503 con mensaje estable y el resto del portal sigue funcionando.
- **Caché:** por perfil, EPS, trámite, versión de sus fuentes y fecha. Solo guarda respuestas verificadas; vence en `CACHE_HORAS`.
- **Memoria:** los últimos 4 turnos de la conversación, guardados en PostgreSQL y ligados a su dueño, perfil y trámite.
- **Control de uso:** el asistente ciudadano admite `LIMITE_PUBLICO_POR_HORA` preguntas por IP (429).

## Endpoints

Los de `docs/contrato_api.md` más los que el frontend ya consume: `POST /api/tramites/{id}/vinculos`, `GET /api/recepcion`,
`POST /api/recepcion/incorporaciones`, `GET /api/alertas`, `GET /api/publico/cifras` y la sesión de demostración.
Errores: `{"detail": "...", "codigo": "sin_sesion|acceso_denegado|no_encontrado|conflicto|datos_invalidos|no_disponible"}`.

## Pruebas

```powershell
python -m pytest
```

Usan `TEST_DATABASE_URL` (se borra y se recrea) y texto ficticio. `python -m scripts.evaluar` mide el agente con el modelo
real (gasta cuota) y escribe `scripts/salidas/evaluacion.md`, que no se sube.

## Datos y privacidad (repositorio público)

- No se suben `.env`, claves, PDF, texto extraído, caché ni salidas de evaluación.
- `scripts/semillas/casos_reales.json` contiene fichas (eventos y cifras con su fuente) con identificadores anonimizados.
- `scripts/semillas/demo_portal.json` son los ejemplos del frontend; las EPS distintas de Tacna son simuladas.
- La capa gratuita de algunos proveedores puede usar los datos enviados: usar documentos públicos o de demostración.

## Pendiente

- Sesión institucional real (reemplaza `app/core/sesion.py` y `SESION_DEMO=false`).
- Validar con la DRE las reglas de plazo, el calendario y la visibilidad de cada documento.
- OCR de las páginas escaneadas de EMAPA Pasco (21 páginas marcadas).
- Elegir un solo «momento» del caso Tacna: hoy la vista SUNASS, la EPS y la pública muestran fechas distintas del mismo expediente.
- Tablas propias para los bloques de presentación que aún viven en JSON (línea de tiempo, comparador, impacto).
