# Acuerdo inicial de la API

Propuesta para acordar entre frontend y backend antes de programar las pantallas. El backend publicará el contrato implementado en `/docs`. Los cambios se coordinan mediante PR y se actualizan en los tipos del frontend.

## Portal y perfiles

El mismo portal contiene las rutas SUNASS y EPS. La API identifica al usuario autenticado y verifica el acceso a cada trámite, documento y conversación. El perfil elegido en una pantalla de demostración debe identificarse como simulación hasta conectarlo con una sesión real.

## Operaciones iniciales

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/tramites` | Expedientes visibles para el perfil SUNASS autorizado |
| GET | `/api/tramites/{id}` | Ficha interna con responsable y etapa |
| GET | `/api/tramites/{id}/flujo` | Nodos y transiciones del proceso, con estado |
| GET | `/api/tramites/{id}/eventos` | Historial autorizado |
| GET | `/api/tramites/{id}/acciones` | Acciones permitidas al usuario actual |
| POST | `/api/tramites/{id}/eventos` | Registrar actuación y aplicar una transición permitida |
| GET | `/api/eps/tramites` | Lista propia de la EPS autenticada |
| GET | `/api/eps/tramites/{id}` | Ficha comprensible y siguiente acción de esa EPS |
| POST | `/api/eps/tramites/{id}/respuestas` | Informar presentación y guardar referencia del cargo |
| GET | `/api/documentos/{id}/contenido` | Documento autorizado para abrir una cita |
| POST | `/api/agente/chat` | Respuesta con fuentes accesibles para el usuario |

## Ejemplo de ficha EPS

```json
{
  "id": "CPI-2026-0007",
  "procedimiento": "CPI",
  "titulo": "Cambio del programa de inversiones",
  "estado": "requiere_respuesta",
  "estado_texto": "Necesitamos tu respuesta",
  "resumen": "Revisa los puntos solicitados en el Oficio 156.",
  "simulado": true,
  "siguiente_accion": {
    "tipo": "informar_presentacion",
    "texto": "Preparar respuesta",
    "canal": "Mesa de Partes de SUNASS",
    "fecha_limite": "2026-08-14",
    "fecha_texto": "14 de agosto",
    "dias_restantes": 2,
    "fuente_documento_id": "oficio-162",
    "requisitos": [
      {"id": "r1", "texto": "Sustento solicitado", "preparado": false}
    ]
  },
  "documentos": [
    {"id": "oficio-156", "titulo": "Oficio 156", "pagina": 1}
  ]
}
```

Cuando la EPS esté al día, `siguiente_accion` vale `null` y el texto explica que SUNASS está evaluando. Los ejemplos del frontend conservan esta estructura. El listado EPS usa un objeto con `items` y `total`.

## Plazos y transiciones

El backend entrega fecha, días restantes, estado y fuente. La revisión periódica informa la etapa activa. Cada transición exige el estado de origen, el permiso y los documentos necesarios. Una respuesta informada por la EPS queda pendiente de verificación hasta que SUNASS confirme su incorporación.

Al registrar un evento, la actualización del trámite y la tarea asociada se guarda en una transacción. El backend define cómo tratar reintentos y cambios simultáneos para evitar duplicar respuestas o perder movimientos.

## Errores y presentación

El frontend contempla 401 para sesión vencida, 403 para acceso denegado, 404 para expediente inexistente o inaccesible según la política del backend, 409 para un estado que cambió y 422 para datos inválidos. La API acuerda un formato de error estable. El cliente muestra un mensaje comprensible y permite recuperar el trabajo cuando corresponda.

El asistente recibe el contexto de la pantalla y el identificador del trámite. El backend valida ambos con la sesión y controla el acceso al hilo de conversación.
