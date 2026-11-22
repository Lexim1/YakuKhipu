# Guía del frontend del portal YakuKhipu

Esta guía está dirigida a Paola y Camila. Les permite construir las vistas SUNASS, EPS y Ciudadanía del mismo portal, coordinarse con Lexim1 y Aracelly en el backend y entregar cambios mediante ramas y aprobación. El primer objetivo es abrir un trámite, entender su estado y completar una acción con información que persista en la API. Lexim1 es la única persona cuya aprobación autoriza los pases a qa y master.

## Quién desarrolla y quién aprueba

Paola usa la cuenta parisa539 y Camila usa CamiMori. Ambas desarrollan en sus propias ramas, prueban sus pantallas y se apoyan con comentarios. Lexim1 revisa la entrega, solicita correcciones y concede la aprobación requerida para integrar en qa y master. Aracelly usa vAlp092 y coordina el backend con Lexim1.

Las compañeras pueden comentar y revisar el código. Sus revisiones complementan la entrega y la aprobación obligatoria corresponde a Lexim1. En GitHub, seleccionar Lexim1 en Reviewers. Cada persona utiliza su propia cuenta.

## Un portal con tres vistas

Las páginas SUNASS, EPS y Ciudadanía comparten tipografía, colores, botones, mensajes y componentes. SUNASS y EPS utilizan sesión y navegación según sus permisos. Ciudadanía tiene acceso público de consulta, con datos preparados por el backend para su publicación.

| Ruta propuesta | Lo que permite hacer |
| --- | --- |
| `/sunass/expedientes` | Buscar y abrir un expediente |
| `/sunass/expedientes/:id` | Consultar flujo, responsable, documentos y plazos |
| `/sunass/recepcion` | Revisar documentos por incorporar |
| `/sunass/alertas` | Consultar alertas y su motivo |
| `/eps/tramites` | Consultar los trámites de la EPS |
| `/eps/tramites/:id` | Entender el estado y el siguiente paso |
| `/eps/tramites/:id/respuesta` | Preparar la respuesta e informar su presentación |
| `/ciudadania/decisiones` | Buscar casos públicos por EPS o localidad |
| `/ciudadania/decisiones/:id` | Entender la decisión, su avance y sus fuentes |

Las rutas representan pantallas de una aplicación. Paola y Camila trabajan sobre la misma carpeta frontend y comparten los componentes.

## Stack que van a utilizar

| Herramienta | Qué aprender para esta entrega |
| --- | --- |
| React | Componentes, props, listas, eventos, useState y useEffect |
| TypeScript | Tipos sencillos para props y respuestas de la API |
| Vite | Arrancar el proyecto, compilarlo y configurar la URL del backend |
| React Router | Enlaces y rutas del portal en modo declarativo |
| CSS | Variables, Flexbox, Grid y adaptación a celular |
| fetch | Consultar la API desde servicios compartidos |

La primera entrega usa esta base. Los componentes compartidos facilitan aplicar el diseño del Figma. Las incorporaciones de bibliotecas se acuerdan cuando una necesidad concreta lo justifique.

Un componente es una parte reutilizable de pantalla. Sus props son los datos que recibe. El estado contiene valores que cambian durante la interacción, por ejemplo el filtro seleccionado. Un servicio es una función que conversa con la API.

## Reparto del frontend

| Persona | Primera responsabilidad | Entrega verificable |
| --- | --- | --- |
| Paola | Base, navegación, SUNASS y buscador ciudadano | Abrir un expediente y encontrar una ficha pública |
| Camila | Vista EPS, ficha ciudadana y adaptación a celular | Informar una respuesta y consultar una decisión pública |
| Ambas | Componentes, fuentes, asistente por contexto e integración | Tres vistas coherentes y accesibles |

Paola prepara la aplicación base una sola vez. Camila empieza su rama cuando esa base esté aprobada en master. Mientras tanto puede acordar el contrato, ordenar los textos y definir los datos de los tres procedimientos. Lexim1 y Aracelly entregan reglas, permisos, fuentes y endpoints, incluida una respuesta específica para la consulta pública.

## Preparar la computadora

Instalar Git, un editor como VS Code y una versión LTS de Node.js compatible con los requisitos actuales de Vite. Aceptar la invitación al repositorio con la cuenta indicada por el equipo. Comprobar en una terminal los siguientes comandos.

```bash
git --version
node --version
npm --version
git clone https://github.com/Lexim1/YakuKhipu.git
cd YakuKhipu
```

La autenticación de Git se realiza mediante el mecanismo seguro que ofrezca GitHub o el editor. Cada integrante trabaja con su propia cuenta.

## Crear la base una sola vez

Paola crea primero la issue de inicialización y utiliza su número real en la rama. Los comandos siguientes usan el número 1 como ejemplo.

```bash
git switch master
git pull --ff-only origin master
git switch -c feature/1-base-frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router
npm run dev
```

Abrir la dirección que aparece en la terminal. Conservar package-lock.json en el commit para que ambas instalen las mismas dependencias. Antes del PR ejecutar npm run lint y npm run build. La compilación del template react-ts comprueba los tipos de TypeScript.

La inicialización termina mediante los dos pases del flujo de ramas. Después, cada integrante actualiza master y, desde frontend, ejecuta npm ci y npm run dev. npm ci instala lo registrado en package-lock.json.

## Organizar los archivos

Crear esta estructura al implementar las primeras pantallas. Los archivos se añaden cuando tienen uso en una tarea.

| Ubicación | Contenido |
| --- | --- |
| `src/app/` | Rutas, sesión y navegación compartida |
| `src/pages/sunass/` | Expedientes, recepción y alertas |
| `src/pages/eps/` | Mis trámites, detalle y respuesta |
| `src/pages/ciudadania/` | Buscador, listado y ficha pública de la decisión |
| `src/components/` | Botones, estados, historial y resumen del flujo |
| `src/services/` | Acceso a la API y carga de ejemplos |
| `src/types/` | Tipos compartidos de los datos |
| `src/mocks/` | Ejemplos explícitamente simulados |
| `src/styles/` | Variables y estilos comunes |

Acuerden los nombres y las props de los componentes antes de reutilizarlos. Una sola integrante edita las rutas y los estilos globales en cada tarea. Un PR explica los cambios en archivos compartidos para que Lexim1 pueda comprobar el efecto sobre las otras pantallas.

## Construir una pantalla

1. Revisar la pantalla del Figma y escribir qué necesita resolver su usuaria.
2. Identificar los datos que requiere y acordar su forma con el backend.
3. Montar el diseño con componentes compartidos y un ejemplo de datos.
4. Añadir carga, error, resultado vacío y resultado correcto.
5. Conectar el servicio real y comprobar qué pasa después de una acción.
6. Probar con teclado y en celular. Adjuntar evidencia al PR.

Ejemplos de componentes compartidos son EstadoTramite, TarjetaAccion, ListaDocumentos, Historial y ResumenFlujo. El texto del estado acompaña al color. Los botones usan etiquetas concretas como Ver expediente o Informar presentación.

## Qué necesita cada perfil

En SUNASS, el expediente muestra procedimiento, etapa, responsable, siguiente actuación, historial, documentos y plazo. Los tres procesos incluyen sus decisiones y retornos. La revisión periódica presenta el reloj de la etapa activa. Los días y las fechas provienen del backend.

En EPS, la pantalla responde dónde está el trámite, si la EPS debe hacer algo y hasta cuándo. Una tarea pendiente muestra el oficio, sus requisitos, el canal y la fecha límite. Al informar una presentación, aparece su estado pendiente de verificación. Durante la evaluación, la pantalla informa que la EPS está al día.

La lista y el detalle se actualizan después de guardar. La EPS accede a información relevante de su expediente mediante endpoints autorizados. El historial interno completo corresponde al perfil SUNASS.

El comparador de cifras conserva fuente y página. El impacto social se muestra como información complementaria con el estado del dato. Las pantallas diferencian los ejemplos simulados de los documentos verificados.

## Implementar la vista de ciudadanía

La consulta ciudadana forma parte del MVP. En el Figma está en la sección Ciudadanía consulta pública, con las pantallas Decisiones, Ficha de la decisión, Asistente y sus versiones móviles. Utilizar el mismo proyecto React y componentes compartidos.

El recorrido mínimo permite entrar sin iniciar sesión, buscar una EPS o localidad, abrir un caso público y entender qué se solicitó, qué se autorizó y qué se ejecutó. La ficha muestra estado, fecha de actualización y fuentes públicas. Una autorización no prueba que la inversión se haya ejecutado. Si falta el reporte de avance, mostrar Sin dato de ejecución y conservar el último dato con su fecha.

La información de impacto explica a quién podría beneficiar la inversión cuando exista un sustento. Mostrar su fuente y distinguir datos verificados, estimaciones y ejemplos simulados. Un dato ausente aparece como No disponible. Los avisos de consulta o audiencia incluyen fecha y enlace al canal oficial cuando estén publicados.

El asistente se abre desde el listado o la ficha y explica el contexto en lenguaje sencillo. Sus citas abren únicamente fuentes públicas. Si todavía no existe una decisión, debe indicar el estado público disponible. La ciudadanía consulta la información y utiliza los canales oficiales enlazados para participar.

## Tareas para completar la consulta pública

- Paola crea la issue [FRONT] Crear buscador ciudadano. Entrega búsqueda por EPS o localidad, listado de resultados, estado público y navegación al detalle. Incluye carga, error y búsqueda sin resultados.
- Camila crea la issue [FRONT] Crear ficha pública de la decisión. Entrega resumen, solicitado, autorizado, ejecutado, fecha, impacto con sustento y enlaces a fuentes. Comprueba la versión móvil.
- Lexim1 y Aracelly preparan [BACK] Entregar datos públicos de decisiones. La API devuelve solo campos, documentos y casos habilitados para consulta pública.
- Ambas coordinan [FRONT] Conectar asistente ciudadano cuando esté disponible el endpoint público. Reutilizan el panel visual y comprueban el contexto y las citas.

El listado puede incluir los estados En evaluación, En consulta o Decisión publicada cuando el caso esté habilitado para publicación. Si aún no existe autorización, su valor permanece vacío y el texto lo explica. La vista ciudadana no recibe documentos privados, observaciones internas, responsables internos ni acciones de modificación. El backend aplica esta separación antes de enviar la respuesta.

## Conectar frontend y backend

El archivo docs/contrato_api.md contiene el acuerdo inicial. La documentación implementada se consulta en /docs de FastAPI. Un cambio de nombre o tipo se coordina con ambas parejas antes de integrar los PR.

Crear frontend/.env.local con la URL que entregue el equipo backend. En el entorno local de ejemplo puede utilizarse esta dirección.

```text
VITE_API_URL=http://localhost:8000
```

Copiar la variable sin credenciales a frontend/.env.example y registrar ese archivo en Git. Reiniciar Vite al cambiar la configuración. Las variables con prefijo VITE_ son visibles en el navegador. Las claves del modelo y de PostgreSQL se configuran en el servidor.

El backend debe aceptar el origen del frontend mediante la configuración CORS acordada. Para publicar, se configura una URL HTTPS de la API y la reescritura de rutas del portal hacia index.html. Probar que recargar una ruta de detalle funciona.

## Ejemplo de servicio de lectura

Este ejemplo muestra una consulta con sesión de cookie. Acordar la sesión con el backend antes de usarlo. Si el equipo utiliza tokens, ajustar las credenciales y cabeceras en este módulo compartido. El componente recibe el resultado y gestiona la carga y los mensajes.

```ts
// src/services/tramites.ts
export async function consultarTramitesEPS(signal?: AbortSignal) {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new Error("Falta configurar la URL de la API");
  }
  const response = await fetch(`${baseUrl}/api/eps/tramites`, {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new Error("No se pudieron cargar tus trámites");
  }
  return response.json();
}
```

El tipo de respuesta se define según el contrato confirmado y se valida en la API. Un nombre de tipo en TypeScript ayuda durante el desarrollo. El frontend también comprueba los datos opcionales que necesita mostrar.

Preparar datos de ejemplo con la misma forma que el contrato. Seleccionar el modo de ejemplo explícitamente en desarrollo y señalarlo en la interfaz. Ante un fallo de la API real, mostrar el error y permitir reintentar. Después de una escritura confirmada, consultar de nuevo la lista y el detalle afectados.

## Nombres fáciles para las issues

Usar el área entre corchetes y una acción concreta. GitHub asigna el número automáticamente.

| Área | Ejemplo de título |
| --- | --- |
| Frontend | `[FRONT] Crear pantalla de mis trámites` |
| Backend | `[BACK] Calcular días hábiles del trámite` |
| General | `[GENERAL] Preparar los datos de la demo` |

Una issue incluye responsable, resultado esperado y criterios para comprobar que terminó. Si la issue recibe el número 12, la rama puede llamarse feature/12-mis-tramites. Mantener el número en el commit y enlazar la issue en el PR.

## Trabajo diario con ramas

El flujo conserva las ramas master y qa del manual. Cada nueva feature parte de master actualizado. Sustituir el número 12 por el de la issue real.

```bash
git switch master
git pull --ff-only origin master
git switch -c feature/12-mis-tramites
```

Desarrollar, comprobar el resultado y añadir los archivos concretos de la tarea. Después registrar y subir los cambios.

```bash
git status
git add frontend/src/pages/eps/MisTramites.tsx
git commit -m "feat #12 mostrar mis tramites de EPS"
git push -u origin feature/12-mis-tramites
```

El primer PR usa base qa y compare feature/12-mis-tramites. En GitHub, abrir Pull requests, elegir New pull request y seleccionar esas ramas. Completar la plantilla y seleccionar Lexim1 en Reviewers. La compañera puede probar la pantalla y comentar. Cuando el cambio afecta datos, permisos o plazos, coordinar también el contrato con el backend.

Esperar la aprobación de Lexim1 antes de integrar en qa mediante Create a merge commit. Si solicita cambios, corregir en la misma feature, hacer commit y push, y pedirle una nueva revisión. Un cambio posterior invalida la aprobación anterior.

Después de integrar, registrar la validación en el entorno QA. La misma feature se propone a master mediante un segundo PR enlazado al de QA. Ese segundo PR requiere otra aprobación de Lexim1. Conservar la rama hasta completar ambos pases. Los detalles sobre correcciones y conflictos están en CONTRIBUTING.md.

GitHub impide aprobar un PR propio. Paola y Camila deben abrir sus entregas desde sus respectivas cuentas para que Lexim1 las revise. Los PR creados por Lexim1 necesitan resolver esta limitación antes de integrarse. No compartir cuentas ni desactivar las protecciones para avanzar.

## Comprobar antes de pedir aprobación

Ejecutar npm run lint y npm run build cuando exista la aplicación. Comprobar las rutas afectadas, la recarga del navegador y la navegación hacia atrás. Verificar una pantalla de 390 píxeles de ancho y otra de escritorio. Los contenidos largos deben poder desplazarse y los controles deben conservar su foco visible.

Probar los estados de carga, error y ausencia de tareas. En una respuesta EPS, comprobar que guardar dos veces por accidente tiene una respuesta coherente del servidor y que el detalle refleja el estado resultante. Abrir las fuentes del asistente y verificar documento y página. En Ciudadanía, probar una sesión sin autenticar, la búsqueda por EPS o localidad, una ficha sin ejecución informada y los enlaces a fuentes públicas. Comprobar que la API pública no devuelve campos ni documentos internos.

Cada PR adjunta el caso utilizado, la ruta, el perfil y una captura cuando hay cambios visibles. Lexim1 comprueba esos pasos antes de conceder la aprobación requerida.

## Orden de entrega antes del presencial

| Entrega | Resultado que se debe poder revisar |
| --- | --- |
| Base | Portal ejecutable, navegación y componentes compartidos |
| Primer recorrido | Lista de expedientes y detalle conectado de un caso CPI |
| Vista EPS | Tarea pendiente, respuesta informada y estado actualizado |
| Vista Ciudadanía | Búsqueda, ficha pública y fuente de una decisión en celular y escritorio |
| Tres procesos | Casos CPI, UFI y RP con etapas y retornos correctos |
| Integración | Fuentes y asistente con acceso acorde a cada una de las tres vistas |

Revisar diariamente un recorrido de las tres vistas entre ambos equipos. Dashboard, gráficos y mejoras visuales se incorporan después de comprobar la navegación y las acciones principales. El enlace QA debe existir antes de la validación final del pase a master.

## Referencias para consultar

- [Vista de ciudadanía en Figma](https://www.figma.com/design/t4Lro34dvKshsTg5KWIJho/YakuKhipu?node-id=213-361)
- [React y sus componentes](https://react.dev/learn)
- [Inicio de Vite](https://vite.dev/guide/)
- [React Router declarativo](https://reactrouter.com/start/declarative/installation)
- [Usar fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [Variables de entorno de Vite](https://vite.dev/guide/env-and-mode)
- [Protección de ramas de GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
