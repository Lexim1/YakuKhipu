# Guía del backend y del agente de YakuKhipu

Esta guía organiza el trabajo de Lexim1 y Aracelly para construir la API del portal y su asistente antes del sprint presencial. El objetivo inicial es completar un recorrido con un caso CPI: consultar su estado, entender la siguiente actuación y obtener una explicación con fuentes. Después se amplía a UFI, RP y las vistas SUNASS, EPS y Ciudadanía.

La recomendación para empezar es FastAPI y PostgreSQL para el sistema, con un agente acotado en LangGraph y una conexión directa a una API de modelos. OmniRoute puede evaluarse después de que ese recorrido funcione. La elección de proveedor queda en configuración para cambiarla sin rehacer el portal.

## Qué aporta cada parte

| Parte | Responsabilidad en YakuKhipu |
| --- | --- |
| FastAPI | Recibir peticiones, comprobar sesión y permisos, ejecutar servicios y devolver datos al frontend |
| PostgreSQL | Guardar trámites, actuaciones, reglas, documentos y fuentes |
| Funciones del negocio | Determinar acciones permitidas, transiciones y cómputos de plazo con reglas verificadas |
| Agente | Consultar contexto autorizado, recuperar fuentes y explicar lo que estas sustentan |
| Modelo de lenguaje | Redactar una explicación a partir del contexto recibido |
| OpenRouter u otra API | Proporcionar acceso al modelo elegido |
| OmniRoute opcional | Intermediar entre el backend y proveedores mediante un endpoint compatible |

El agente propone y explica. Una actuación institucional se confirma mediante la acción explícita de una persona autorizada y un endpoint del negocio. Los cálculos y las transiciones se comprueban con código y datos del procedimiento.

## Reparto con Aracelly

| Responsable | Trabajo principal | Entrega que permite revisar el avance |
| --- | --- | --- |
| Aracelly | Base FastAPI, PostgreSQL, modelos y migraciones | API ejecutable con un caso CPI cargado |
| Aracelly | Sesión, acceso por EPS y proyección pública | Cada vista recibe los campos que le corresponden |
| Aracelly | Endpoints de trámites, actuaciones, documentos y respuestas EPS | Registrar una actuación y consultar el estado resultante |
| Aracelly | Transiciones y servicio de plazos | Regla aplicada, etapa activa, fuente y validación pendientes visibles |
| Lexim1 | Ordenar fuentes y acordar las reglas que sustentan los casos | Documentos y matriz de etapas revisables |
| Lexim1 | Extraer texto, recuperar fragmentos y conservar las citas | Cada fragmento conserva documento y página |
| Lexim1 | Conexión al modelo, flujo LangGraph y endpoints del asistente | Respuestas con contexto y fuentes autorizadas |
| Lexim1 | Evaluar respuestas y comportamiento ante errores del proveedor | Casos esperados, fallos encontrados y correcciones |
| Ambos | Contrato, recorrido completo, integración y despliegue | Frontend conectado y evidencia del caso probado |

Aracelly mantiene los cambios de modelos y Alembic. Lexim1 mantiene el agente y el adaptador del modelo. Una sola persona modifica cada migración y cada archivo compartido en una tarea. Acuerden antes de programar los identificadores, estados, formato de las fuentes y firmas de los servicios.

Lexim1 conserva la aprobación obligatoria del equipo. Aracelly abre sus PR y solicita revisión a Lexim1. GitHub impide aprobar un PR propio; las entregas creadas por Lexim1 necesitan acordar una revisión independiente antes de integrarse. La activación de CODEOWNERS pendiente se explica en docs/configuracion_aprobaciones.md.

## Primer acuerdo antes de escribir código

Reservar el primer bloque de trabajo para elegir un caso CPI del prototipo y confirmar sus documentos. Registrar estado inicial, siguiente actuación, quién actúa y cuáles son las fuentes. Añadir una pregunta de ejemplo para cada vista.

| Vista | Primera pregunta | Información que puede utilizar |
| --- | --- | --- |
| SUNASS | Qué falta revisar en este expediente | Contexto interno autorizado del expediente |
| EPS | Qué debo presentar y cuál es mi siguiente paso | Su trámite, requerimiento, documentos pertinentes y plazo validado |
| Ciudadanía | Qué se autorizó y qué avance está informado | Ficha y fuentes habilitadas para publicación |

El archivo docs/contrato_api.md es el acuerdo de integración. Aracelly entrega ejemplos JSON y las firmas de consulta; Lexim1 puede desarrollar contra esos ejemplos mientras se implementa la persistencia. Paola y Camila reciben el mismo contrato para construir sus pantallas.

## Stack inicial y preparación local

Usar Python 3.12, FastAPI, Pydantic, PostgreSQL, SQLAlchemy 2 y Alembic. Para el agente añadir LangGraph, httpx y pypdf. La recuperación inicial puede hacerse sobre texto almacenado en PostgreSQL y limitado al caso consultado. Un pequeño conjunto de documentos permite comprobar las citas antes de ampliar la búsqueda.

Desde el repositorio, crear backend en una rama de trabajo. En Windows pueden usar la terminal de VS Code. Crear el entorno virtual y activarlo con el comando que corresponda a su sistema.

```bash
mkdir backend
cd backend
python -m venv .venv
```

```powershell
.\.venv\Scripts\Activate.ps1
```

```bash
source .venv/bin/activate
```

Instalar las dependencias dentro del entorno activado.

```bash
python -m pip install "fastapi[standard]" "sqlalchemy>=2,<3"
python -m pip install "psycopg[binary]" alembic pydantic-settings
python -m pip install httpx python-dotenv langgraph pypdf pytest
python -m pip freeze > requirements.txt
```

Aracelly registra requirements.txt después de comprobar la instalación. El resto instala ese mismo archivo. Las actualizaciones de dependencias se hacen en una tarea acordada para que ambas computadoras utilicen las mismas versiones.

Crear backend/.env para las credenciales y backend/.env.example con nombres y valores de ejemplo. El repositorio es público: registrar únicamente datos de demostración permitidos, ejemplos anonimizados y configuración sin secretos.

```text
DATABASE_URL=postgresql+psycopg://usuario:clave@localhost/yakukhipu
FRONTEND_ORIGIN=http://localhost:5173
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=colocar_solo_en_env_local
LLM_MODEL=openrouter/free
LLM_ENABLED=false
```

LLM_ENABLED es una bandera de la aplicación que deben implementar. En modo desactivado, el portal puede mostrar los datos y fuentes del caso, indicando que el asistente no está disponible. Las claves se configuran en el backend y nunca en variables VITE_ del navegador.

## Orden de archivos que permite trabajar en paralelo

| Ubicación dentro de backend | Responsable y contenido |
| --- | --- |
| app/main.py y app/core/ | Aracelly configura aplicación, entorno, CORS y dependencias de sesión |
| app/models/ y alembic/ | Aracelly mantiene entidades y migraciones |
| app/repositories/ | Aracelly implementa consultas con filtros de acceso |
| app/services/tramites.py y plazos.py | Aracelly implementa reglas, actuaciones y cómputos |
| app/api/ | Ambos mantienen routers separados del sistema y del asistente |
| app/agent/graph.py y prompts.py | Lexim1 define el flujo y las instrucciones |
| app/agent/retrieval.py y llm.py | Lexim1 recupera fuentes y conecta el modelo |
| app/schemas/ | Ambos acuerdan los formatos Pydantic de entrada y salida |
| scripts/ y tests/ | Carga controlada de ejemplos y comprobaciones de cada módulo |

Crear app/__init__.py y app/main.py. Este contenido mínimo de main.py permite comprobar GET /health y abrir /docs antes de conectar la IA.

```python
from fastapi import FastAPI

app = FastAPI(title="YakuKhipu")

@app.get("/health")
def health():
    return {"estado": "ok"}
```

La aplicación debe arrancar aunque el proveedor de IA esté deshabilitado. Ejecutar desde backend y abrir http://127.0.0.1:8000/docs.

```bash
python -m uvicorn app.main:app --reload
```

Aracelly prepara una base PostgreSQL local llamada yakukhipu y su usuario, configura DATABASE_URL y define los modelos SQLAlchemy. Inicializa Alembic una sola vez y configura env.py para leer la URL desde el entorno e importar los modelos con target_metadata = Base.metadata. Después genera y revisa la migración antes de aplicarla.

```bash
python -m alembic init alembic
python -m alembic revision --autogenerate -m "crear tablas iniciales"
python -m alembic upgrade head
```

Las carpetas representan la estructura que van a implementar. El repositorio comienza con la documentación y el contrato; estas instrucciones no significan que los endpoints ya estén programados.

## La base de datos mínima

| Entidad | Datos que necesita el primer recorrido |
| --- | --- |
| Usuario y EPS | Identidad, perfil y EPS asociada cuando corresponda |
| Trámite | EPS, procedimiento CPI UFI RP, estado, etapa y versión |
| Actuación | Trámite, tipo de movimiento, fecha acreditada y documento de sustento |
| Documento | Trámite, título, referencia, ubicación, visibilidad y estado de validación |
| Fragmento | Documento, página PDF, texto, identificador y condición de acceso |
| Regla de plazo | Procedimiento, etapa, evento inicial, duración, calendario y fuente |
| Conversación | Propietario o sesión, ámbito, caso y mensajes autorizados |

Aracelly guarda una actuación, el nuevo estado y la tarea asociada en una transacción. El servidor comprueba el estado de origen y la versión para evitar aplicar dos veces una respuesta o perder cambios simultáneos. La EPS informa una presentación; SUNASS verifica su incorporación en una actuación posterior.

El cómputo distingue emisión, notificación y recepción según la regla que corresponda. RP utiliza el reloj de la etapa activa. Si una regla o fecha aún no está validada, devolver Pendiente de validación y su motivo. El modelo recibe el resultado del servicio de plazos para explicarlo.

## Cómo empezar la creación del agente

Comenzar con una pregunta y un solo caso, por ejemplo Qué pide este requerimiento y cuál es el siguiente paso. Elegir dos o tres documentos del caso que permitan comprobar la respuesta a mano. El primer objetivo es recibir una explicación breve con fuentes que realmente abran.

1. Preparar una ficha de contexto con el estado y la siguiente actuación. Aracelly entrega su forma JSON y Lexim1 la usa como ejemplo local.
2. Extraer el texto por página de los documentos elegidos. Guardar documento_id, fragmento_id, pagina_pdf y texto. Si el PDF es una imagen y no devuelve texto útil, marcarlo para extracción revisada u OCR antes de utilizarlo.
3. Comprobar una conexión al modelo con un texto ficticio o público. Esta prueba confirma la API, la clave y el modelo. Todavía no demuestra que el agente consulte el expediente correctamente.
4. Implementar la recuperación de fragmentos autorizados para ese caso. Incluir su referencia al preparar el contexto del modelo.
5. Construir el flujo LangGraph con autorización, recuperación, generación y comprobación de la salida. Devolver el mismo formato al frontend desde el primer día.
6. Probar preguntas con respuesta conocida, preguntas sin fuente y accesos fuera del perfil. Ampliar a UFI y RP cuando el caso CPI complete el recorrido.

Este patrón de recuperar información antes de generar una respuesta se conoce como RAG. El contenido de los documentos se trata como evidencia para responder, incluso cuando incluya instrucciones dirigidas al lector; las reglas del sistema y los permisos permanecen en el backend.

## Primera llamada al modelo

Crear backend/probar_modelo.py con este ejemplo y configurar una clave propia en .env. Utilizar únicamente el texto ficticio incluido durante esta primera comprobación. LLM_BASE_URL termina en /v1 y el cliente añade /chat/completions.

```python
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
base = os.environ["LLM_BASE_URL"].rstrip("/")
key = os.environ["LLM_API_KEY"]
model = os.environ["LLM_MODEL"]
messages = [
    {"role": "system", "content": (
        "Explica solo el dato recibido. "
        "Distingue autorizado de ejecutado.")},
    {"role": "user", "content": (
        "Ejemplo ficticio: se autorizaron 100 medidores. "
        "No existe reporte de instalacion. Que sabemos?")},
]
try:
    with httpx.Client(timeout=20) as client:
        response = client.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": model, "messages": messages,
                  "max_tokens": 300},
        )
        response.raise_for_status()
        data = response.json()
        print(data["choices"][0]["message"]["content"])
except (httpx.HTTPError, KeyError, IndexError, ValueError):
    print("No se obtuvo una respuesta util. Revisar proveedor y cuota.")
```

```bash
python probar_modelo.py
```

Una respuesta aceptable explica que hay una autorización y que falta información sobre la instalación. Si afirma que los 100 ya fueron instalados, registrar el fallo y revisar el contexto, las instrucciones y el modelo. No usar esta llamada como sustituto de las comprobaciones de acceso y de las fuentes.

openrouter/free sirve para comprobar la conexión y selecciona entre modelos gratuitos disponibles. Para evaluar el agente y preparar la demo, elegir un identificador concreto del catálogo, verificar su precio y capacidades y registrar los resultados con ese identificador. Configurar los reemplazos únicamente entre proveedores y modelos acordados.

## Flujo del agente que debe implementar Lexim1

| Paso | Qué hace el código |
| --- | --- |
| Autorizar | Deriva el actor de la sesión o del endpoint público y comprueba el acceso al caso |
| Recuperar | Consulta el estado, plazo validado y fragmentos visibles de ese caso |
| Resolver falta de evidencia | Devuelve sin_fuentes cuando el contexto no basta y evita gastar una llamada al modelo |
| Generar | Pide una respuesta breve basada en las evidencias y un listado de sus identificadores |
| Comprobar | Valida estructura, citas permitidas, fechas y cantidades que deban coincidir con datos estructurados |
| Entregar | Devuelve respuesta, fuentes, advertencias y estado al frontend |

Implementar primero estas funciones con entradas y salidas claras. El siguiente esquema muestra cómo conectarlas una vez que existan; no es una aplicación completa.

```python
from langgraph.graph import StateGraph, START, END

builder = StateGraph(EstadoAgente)
builder.add_node("autorizar", autorizar)
builder.add_node("recuperar", recuperar)
builder.add_node("sin_fuentes", sin_fuentes)
builder.add_node("generar", generar)
builder.add_node("comprobar", comprobar)
builder.add_edge(START, "autorizar")
builder.add_edge("autorizar", "recuperar")
builder.add_conditional_edges(
    "recuperar", elegir_salida,
    {"generar": "generar", "sin_fuentes": "sin_fuentes"},
)
builder.add_edge("generar", "comprobar")
builder.add_edge("comprobar", END)
builder.add_edge("sin_fuentes", END)
grafo = builder.compile()
```

EstadoAgente contiene pregunta, actor autorizado, caso, contexto, fragmentos y salida. elegir_salida devuelve generar o sin_fuentes según la evidencia recuperada. Una denegación de acceso interrumpe el flujo antes de generar. En el router asíncrono se utiliza await grafo.ainvoke(estado) y el cliente del modelo debe ser httpx.AsyncClient para no bloquear otras peticiones.

El flujo puede invocar tres funciones de lectura: consultar_tramite, consultar_plazo y buscar_fuentes. Cada una utiliza las consultas autorizadas de Aracelly. Acotar la primera versión al caso abierto y a pocos fragmentos relevantes permite revisar sus resultados. Las decisiones sobre transiciones se ejecutan por los servicios del negocio.

## Instrucciones y citas del agente

El mensaje de sistema debe definir su función de asistente de YakuKhipu, pedir español sencillo, limitarse al contexto, conservar el estado de validación y distinguir solicitado, autorizado y ejecutado. Debe reconocer la falta de sustento, citar los identificadores recibidos y evitar presentar una propuesta como una actuación ya realizada.

Los permisos no dependen de ese mensaje. Aracelly filtra los datos antes de recuperarlos y Lexim1 envía solo los fragmentos aprobados. La petición no acepta un perfil libre elegido por el navegador. Las conversaciones SUNASS y EPS quedan vinculadas a su propietario y ámbito; la conversación ciudadana recupera únicamente fuentes públicas.

Cada fragmento conserva documento_id, titulo, fragmento_id, pagina_pdf y texto. Guardar también la numeración impresa si difiere de la página del archivo. Si la fuente es un registro estructurado sin página, devolver pagina_pdf nula e identificar el registro o campo; nunca inventar una página para completar la cita.

El backend construye los enlaces a partir de documentos autorizados y comprueba que las citas correspondan al conjunto recuperado. Verificar un identificador de cita no demuestra que la afirmación esté sustentada: revisar el contenido de las respuestas con el conjunto de preguntas y respuestas esperadas antes de darlo por válido.

## Contrato del asistente para el frontend

Mantener los endpoints propuestos en docs/contrato_api.md. La siguiente ampliación de campos debe acordarse con Paola y Camila antes de conectarlos.

| Endpoint | Entrada y control |
| --- | --- |
| POST /api/agente/chat | pregunta, tramite_id y conversacion_id opcional. El servidor deriva usuario, EPS y perfil de la sesión |
| POST /api/publico/asistente/chat | pregunta, caso_id público y conversación pública cuando corresponda. Solo recupera datos habilitados para publicación |

La salida propuesta contiene estado, respuesta, fuentes y advertencias. Los estados son ok, sin_fuentes y no_disponible. Cada fuente identifica documento, fragmento, página cuando exista y enlace autorizado. Añadir modelo y duración a los registros técnicos del backend para evaluar el servicio.

Usar Pydantic para validar la salida. Si el modelo devuelve una estructura inválida o una cita desconocida, responder sin una afirmación no comprobada y registrar el motivo. El frontend muestra el aviso y permite reintentar. Las cifras y plazos se toman del servicio o registro que los sustenta.

Para las peticiones institucionales, contemplar 401 sin sesión, 403 o 404 según la política de acceso y 422 si la entrada no es válida. Si el proveedor se agota o no responde, devolver un error controlado como 503 con mensaje estable. El panel del asistente debe poder fallar mientras el usuario sigue consultando los trámites.

## Cómo conectar ambos trabajos

Aracelly entrega consultar_tramite(actor, tramite_id), consultar_plazo(actor, tramite_id) y listar_fuentes(actor, tramite_id). Para Ciudadanía entrega consultar_caso_publico(caso_id) y listar_fuentes_publicas(caso_id). Acordar los tipos de retorno en app/schemas/.

Lexim1 implementa los módulos del agente utilizando esas firmas y ejemplos con la misma forma. Cuando los servicios estén disponibles, cambia la fuente de datos del ejemplo por el repositorio real. El contrato HTTP que reciben las chicas del front permanece estable durante esa sustitución.

Probar juntos el recorrido completo cada día: abrir el caso, registrar una actuación permitida, actualizar el estado y preguntar al agente cuál es el siguiente paso. La explicación debe reflejar el estado actualizado y conservar las fuentes. Comprobar también la vista pública del mismo caso cuando esté habilitada.

## OmniRoute y la idea de miles de IAs gratuitas

OmniRoute es una pasarela de modelos con un endpoint compatible que incorpora enrutamiento y reemplazos. El README del enlace compartido combina opciones gratuitas, claves de API y suscripciones. Que la pasarela tenga licencia MIT no convierte en gratuitos los servicios de los proveedores ni garantiza su disponibilidad. [1]

El enlace es un fork. Su README y package.json remiten a otros orígenes del proyecto y el paquete consultado declara la versión 3.6.1. Una instalación por nombre desde npm no equivale necesariamente al código exacto de ese fork. Verificar origen y versión antes de adoptarlo. En la copia revisada, engines declara Node >=18 y <24. [1]

| Decisión | Conexión directa a OpenRouter | Con OmniRoute |
| --- | --- | --- |
| Operación inicial | Backend y una API externa | Backend, proceso de pasarela y proveedores configurados |
| Selección del modelo | Variable de entorno y catálogo de la API | Identificador y reglas de la pasarela |
| Coste | Depende del modelo y de la cuenta | Depende de cada proveedor y del alojamiento de la pasarela |
| Uso para este sprint | Ruta recomendada para el primer recorrido | Prueba opcional después de tener respuestas evaluadas |

Para experimentar con OmniRoute, ejecutarlo como un servicio separado del portal y configurar credenciales legítimas del proveedor elegido. La documentación sitúa su API local en http://localhost:20128/v1. El backend utilizaría esa URL como LLM_BASE_URL, una clave de la pasarela y un LLM_MODEL existente en su catálogo. En un despliegue compartido, localhost designa la máquina que ejecuta el backend; ajustar la URL según la red y el alojamiento. [1]

Probar con datos ficticios, confirmar una respuesta y conservar el acceso directo como configuración alternativa. El dashboard de OmniRoute es una herramienta de administración del equipo técnico y no una vista del portal. La rotación de cuentas o las promesas de acceso ilimitado no forman parte de la solución de YakuKhipu.

## Cuánto puede ofrecer una opción gratuita

La documentación de OpenRouter consultada el 21 de noviembre de 2026 indica, para las variantes :free, hasta 20 solicitudes por minuto y 50 por día. El límite diario puede subir a 1000 después de comprar al menos USD 10 en créditos; los intentos fallidos también cuentan. Revisar la cuota efectiva de la cuenta antes de la demo. Los modelos y su disponibilidad pueden cambiar. [2]

Una variante :free debe existir en el catálogo; añadir ese sufijo a cualquier nombre no crea una versión gratuita. Si se configura un reemplazo hacia un modelo de pago, ese uso puede facturarse. Para una prueba de coste cero, mantener todos los modelos de reemplazo dentro de las opciones gratuitas confirmadas. [3]

Limitar la primera versión a una llamada al modelo por pregunta, un contexto breve y reintentos controlados. Guardar metadatos como modelo, duración, resultado y consumo cuando el proveedor lo informe. Comparar calidad en español, citas, latencia y disponibilidad con el mismo conjunto de preguntas antes de elegir el modelo de la presentación.

Las políticas de los proveedores sobre entrenamiento y retención varían. OpenRouter permite controlar el enrutamiento según algunas de esas políticas. Durante el sprint, utilizar fuentes públicas o ejemplos autorizados y evitar enviar documentación interna a un proveedor que el equipo no haya revisado. Una pasarela adicional no elimina la participación del proveedor final. [4]

## Orden de trabajo hasta el sprint

| Bloque | Aracelly | Lexim1 | Resultado conjunto |
| --- | --- | --- | --- |
| Acuerdo inicial | Define entidades y consultas | Define preguntas, fuentes y flujo del agente | Caso CPI y contrato común |
| Base | API, migración y datos del caso | Primera conexión y recuperación local | /docs y explicación con evidencia |
| Integración CPI | Accesos, estados, respuesta EPS y plazo | Agente conectado a servicios autorizados | Recorrido SUNASS y EPS completo |
| Ciudadanía y ampliación | Proyección pública y casos UFI RP | Fuentes públicas y explicaciones por vista | Tres vistas con casos revisables |
| Presencial primer bloque | Integra frontend y corrige persistencia | Evalúa respuestas y corrige citas | Portal utilizable con evidencia |
| Presencial segundo bloque | Verifica despliegue y errores | Comprueba proveedor y recorrido de la demo | Versión aprobada y plan ante caída de IA |

La primera tarea que permite arrancar hoy es que Aracelly cree la base FastAPI y el ejemplo del caso CPI, mientras Lexim1 prepara los documentos de ese mismo caso y ejecuta probar_modelo.py. No esperar a tener todos los procedimientos para conectar el primer recorrido.

## Issues para repartir el trabajo

| Responsable | Issue | Se considera terminada cuando |
| --- | --- | --- |
| Aracelly | [BACK] Crear base de la API | /health y /docs responden con la IA deshabilitada |
| Aracelly | [BACK] Guardar trámites y actuaciones | El estado actualizado persiste y una transición inválida se rechaza |
| Aracelly | [BACK] Separar accesos de las tres vistas | Una EPS no ve otra y la API pública excluye campos internos |
| Aracelly | [BACK] Calcular plazos por etapa | La respuesta muestra regla, fuente y condición de validación |
| Lexim1 | [BACK] Preparar fuentes del caso CPI | Texto útil y referencias de página revisadas |
| Lexim1 | [BACK] Conectar el modelo de IA | Una llamada con un ejemplo ficticio devuelve respuesta útil |
| Lexim1 | [BACK] Crear agente con fuentes | Recupera evidencia, responde y abre citas permitidas |
| Lexim1 | [BACK] Evaluar respuestas del agente | Casos acordados revisados y fallos corregidos o declarados |

GitHub asigna el número de la issue. Una rama como feature/24-agente-con-fuentes utiliza el número real y parte de master actualizado. Primero se propone a qa y después a master, conservando la misma feature y la evidencia de validación según CONTRIBUTING.md. Los números son ejemplos.

## Comprobaciones que importan antes de la demo

| Caso de prueba | Resultado esperado |
| --- | --- |
| Pregunta sobre un requerimiento del CPI | Explica lo que pide el documento y abre su fuente |
| Falta una regla o fecha acreditada | Indica Pendiente de validación sin inventar un vencimiento |
| Revisión periódica cambia de fase | Muestra el plazo de la etapa activa |
| Autorización sin reporte de ejecución | Distingue lo aprobado de lo ejecutado y reconoce el dato ausente |
| EPS solicita un trámite de otra EPS | Se deniega antes de llamar al modelo |
| Ciudadanía intenta obtener una fuente interna | No se entrega el documento ni se envía su texto al modelo |
| Documento contiene instrucciones para ignorar permisos | Los filtros del backend siguen aplicándose |
| Modelo cita un fragmento que no recibió | La respuesta no se publica como verificada |
| Proveedor devuelve 429 o se demora | Error controlado y consulta normal del portal disponible |
| Se informa dos veces la misma presentación | El servicio evita duplicar la actuación según el criterio acordado |

Aracelly automatiza transiciones, autorización y acceso a documentos. Lexim1 automatiza validación de respuestas, pertenencia de citas, ausencia de fuentes y errores del proveedor; además revisa manualmente un conjunto inicial de unas 15 preguntas con sus fuentes esperadas. Ambos comprueban el contenido y la utilidad de la respuesta, no solo que el endpoint devuelva 200.

## Referencias consultadas

- [1 OmniRoute repositorio compartido](https://github.com/ChrisCompton/omniroute)
- [1 OmniRoute package json revisado](https://github.com/ChrisCompton/omniroute/blob/main/package.json)
- [1 OmniRoute licencia](https://github.com/ChrisCompton/omniroute/blob/main/LICENSE)
- [2 OpenRouter modelos gratuitos y límites](https://openrouter.ai/collections/free-models)
- [3 OpenRouter variantes gratuitas y reemplazos](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [4 OpenRouter políticas de los proveedores](https://openrouter.ai/docs/guides/privacy/provider-logging)
- [OpenRouter API de chat](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion)
- [LangGraph primeros pasos](https://docs.langchain.com/oss/python/langgraph/quickstart)
- [FastAPI primeros pasos](https://fastapi.tiangolo.com/tutorial/first-steps/)
- [SQLAlchemy consultas y modelos](https://docs.sqlalchemy.org/en/20/orm/quickstart.html)
- [Alembic migraciones](https://alembic.sqlalchemy.org/en/latest/tutorial.html)

Los comandos son un punto de partida. Una vez comprobado el entorno, registrar las versiones que realmente utiliza el equipo. Las cuotas y precios corresponden a la consulta del 21 de noviembre de 2026 y deben verificarse de nuevo antes de la demostración.
