# Interfaz QA conectada a D3

Esta rama integra el diseño de QA con la API del repositorio [YakuKhipu-Backend](https://github.com/Lexim1/YakuKhipu-Backend). Se valida en QA antes del pase a master. El Dockerfile del backend fija el commit del frontend; cambiar solo la rama frontend no actualiza automáticamente el portal Railway.

## Construcción

```powershell
npm ci
npm run lint
npm run test:contract
npm run build
```

Usar `VITE_API_URL=` y `VITE_USAR_EJEMPLOS=false`. El backend sirve `dist` como `frontend_dist` y comparte origen con `/api`, para cookies HttpOnly y OIDC. La vista SUNASS, EPS y ciudadanía consume permisos efectivos; no enviar tokens OIDC ni claves de proveedores desde React.

El dashboard consulta `/api/finanzas/resumen`, la ficha EPS `/api/finanzas/eps/{id}` y seguimiento `/api/seguimiento/*`. Los montos ausentes se muestran como ausentes. El CSV incluye corte, cobertura y archivos fuente. Las cifras de ejecución acumulada, datos ficticios y promedios de días calendario conservan sus límites de interpretación.

Los expedientes permiten leer PDF/texto por página, consultar contexto D3, registrar actuaciones autorizadas con evidencia y publicar mediante selección expresa de documentos. La EPS informa el oficio presentado por Mesa de Partes; SUNASS debe vincular y revisar el documento antes de verificarlo. La ciudadanía solo lee la publicación y sus documentos aprobados.

Actos, encargos y configuración muestran los registros disponibles: no se inventan obligaciones ni reglas para completar el diseño. Los documentos que solo existen en DS11 se identifican como índices sin PDF. Las tablas tienen desplazamiento propio; formularios y diálogos se adaptan a pantallas pequeñas.

## Pruebas locales con OIDC y OCR

`npm run test:contract` usa respuestas simuladas y no permite inferencia ni peticiones externas. Para Playwright preparar el QA aislado descrito en `docs/integracion_d3_qa.md` del backend. Configurar estas variables fuera de Git:

- `QA_BASE_URL`: por defecto `https://localhost:5444`, solo localhost o 127.0.0.1.
- `QA_ACCOUNTS_JSON`: archivo privado `{ "accounts": [{ "role": "coordinacion_dre", "id": "...", "password": "..." }, ...] }` con coordinacion_dre, analista_srt, jefatura_dre y eps.
- `QA_SCENARIO_FILE`: `{ "qa_eps_id": "...", "public_case_id": "..." }`. La EPS debe coincidir con su cuenta. El caso público debe ser ficticio y concluido.
- `QA_TEST_PDF`: PDF sintético con una página digital y otra de imagen para OCR.
- `QA_TEST_OUTPUT`, `QA_TEST_REPORT`, `QA_SCREENSHOTS`: destinos locales de resultados fuera del repositorio.

Ejecutar `npm run test:e2e`. En Windows usa Edge instalado. En otros sistemas instalar el Chromium de Playwright. Los tests crean recepciones, expedientes y una publicación ficticia en QA; bloquean hosts externos y endpoints de chat. No guardan trazas ni contraseñas. No ejecutar contra producción.

La comprobación cubre escritorio y móvil, los cuatro roles, extracción digital/OCR, asignación, requerimiento, presentación EPS, verificación, publicación, lectura autorizada y exportación CSV. Incluye navegación y ausencia de desbordamiento de las vistas operativas a 320 px.
