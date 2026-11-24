# Configuración de aprobaciones

## Regla del equipo

Lexim1 es el único aprobador obligatorio para integrar cambios en qa y master. Paola, Camila y Aracelly conservan el trabajo en ramas y pueden aportar comentarios.

GitHub puede mostrar aprobaciones de colaboradoras con escritura. La combinación de revisión obligatoria de Code Owners y la regla `* @Lexim1` hace que esas aprobaciones no sustituyan la de Lexim1. Este archivo también queda protegido por esa propiedad.

## Activar la configuración

1. Conservar en las reglas de qa y master el PR obligatorio, una aprobación, revisión de Code Owners, descarte de aprobaciones antiguas, resolución de conversaciones y aplicación a administradores.
2. Incorporar .github/CODEOWNERS en qa y master. GitHub toma ese archivo de la rama destino del PR, por lo que su presencia exclusiva en la feature todavía no activa la aprobación específica.
3. Verificar en un PR abierto por otra integrante que GitHub solicita a Lexim1 y bloquea la integración mientras falta su aprobación.

## Resolver el primer pase

El PR inicial número 1 fue creado por Lexim1. GitHub impide aprobar un PR propio.

Para mantener el control de aprobación, una compañera debe revisar de forma independiente los cambios preparados, abrir su propia propuesta y solicitar la revisión de Lexim1. Puede usar una rama nueva creada desde feature/configuracion-inicial después de esa revisión. Una vez abierta la propuesta sustituta, cerrar el PR anterior como reemplazado y enlazar ambos.

Lexim1 revisa y aprueba el PR de la compañera para qa. Tras la validación, ella abre el segundo pase de la misma rama a master y solicita una nueva aprobación de Lexim1. Conservar la rama hasta completar ambos pases.

No compartir cuentas ni desactivar las protecciones. Los PR futuros que se creen desde la cuenta Lexim1 seguirán teniendo la misma limitación y deberán esperar a que el equipo acuerde cómo obtener una revisión independiente.

## Referencias

- [Propietarios del código](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Aprobaciones y PR propios](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)
