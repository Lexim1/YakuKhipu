# Trabajo con ramas y aprobaciones

El equipo adapta el manual de flujo de trabajo a YakuKhipu. Cada tarea tiene una issue, una rama propia y dos pases revisados. Los enlaces de despliegue se registran en el README cuando estén disponibles.

## Nombres de las issues

Escribir el área entre corchetes y después una acción concreta. Al crear una issue se puede elegir la plantilla Frontend, Backend o General, que completa el prefijo del título.

| Plantilla | Ejemplo de título |
| --- | --- |
| Frontend | `[FRONT] Crear pantalla de mis trámites` |
| Backend | `[BACK] Calcular días hábiles del trámite` |
| General | `[GENERAL] Preparar los datos de la demo` |

GitHub asigna el número de la issue. Ese número relaciona la tarea con su rama y su commit. Por ejemplo, la issue `#12 [FRONT] Crear pantalla de mis trámites` usa la rama `feature/12-mis-tramites` y un commit como `feat #12 mostrar mis tramites de EPS`.

Elegir un título que indique qué se hará, como Crear, Conectar, Calcular o Corregir. El responsable, la prioridad y el estado se registran en los campos de la issue.

## Responsables y ramas

| Elemento | Uso |
| --- | --- |
| `master` | Versión aprobada para la demo |
| `qa` | Integración y validación compartida |
| `feature/12-mis-tramites` | Una tarea concreta, creada desde master |
| Autora del PR | Explica el cambio, lo comprueba y resuelve observaciones |
| Revisora | Otra integrante con acceso de escritura que valida el resultado |

La aprobación corresponde a una integrante distinta de la autora. La administración verifica que las dos revisiones y la validación en QA estén completas.

## Preparar una tarea

1. Abrir una issue y acordar su criterio de aceptación.
2. Actualizar master y crear la rama de trabajo. Sustituir `12` por el número real de la issue.

```bash
git switch master
git pull --ff-only origin master
git switch -c feature/12-mis-tramites
```

3. Realizar el cambio y comprobarlo localmente. Cada PR debe representar una tarea que pueda revisarse por separado.
4. Revisar los archivos y registrar el cambio.

```bash
git status
git add frontend/src/pages/eps/MisTramites.tsx
git commit -m "feat #12 mostrar mis tramites de EPS"
git push -u origin feature/12-mis-tramites
```

El archivo es un ejemplo. Añadir las rutas concretas que correspondan a la tarea. El número de issue en el commit enlaza el trabajo con su contexto.

## Primer pase a QA

1. Abrir Pull requests y New pull request.
2. Elegir `base: qa` y `compare: feature/12-mis-tramites`.
3. Completar la plantilla e indicar ruta, perfil y pasos para probar.
4. Pedir revisión a otra integrante. Resolver los comentarios en la misma feature y volver a subir los cambios.
5. Tras la aprobación, integrar mediante Create a merge commit. Conservar la feature.
6. Comprobar el resultado en QA y registrar la evidencia en el PR.

Si todavía se está configurando el despliegue de QA, registrar la revisión local y mantener pendiente la validación del entorno compartido.

## Segundo pase a master

1. Con la versión final validada en QA, abrir otro PR con `base: master` y la misma feature en `compare`.
2. Enlazar el PR de QA y su evidencia. Pedir aprobación a otra integrante.
3. Integrar con Create a merge commit después de la aprobación.
4. Verificar la publicación cuando exista el despliegue y cerrar la issue al cumplir sus criterios.
5. Actualizar el equipo local.

```bash
git switch master
git pull --ff-only origin master
```

Si se modifica la feature después de validarla, llevar la versión nueva a QA y repetir la comprobación antes del pase a master. Mantener la feature hasta que ambos destinos incluyan sus cambios finales.

## Resolver diferencias entre ramas

Si master avanzó durante la tarea, actualizar la feature con master y resolver allí los conflictos con su autora. Un conflicto exclusivo con qa se revisa con quien administra la integración. Para resolverlo se puede preparar una rama temporal desde la feature y combinar qa en esa rama temporal, conservando la feature original para el pase a master. Registrar la correspondencia de ambos PR y repetir la validación.

## Protección y revisión

Las reglas de master y qa deben exigir PR, al menos una aprobación de otra integrante, nueva revisión cuando cambie el código y resolución de conversaciones. También deben aplicarse a la administración. Los commits de integración conservan la historia necesaria para los dos pases del manual.

La configuración inicial de documentos se realiza durante la creación del repositorio. Las tareas de desarrollo posteriores siguen este flujo. Los checks automáticos de compilación se incorporarán con la primera aplicación funcional.

## Fuentes

Manual de flujo de trabajo aportado por el equipo, versión 2 de noviembre de 2026, páginas 7 a 17.

- [Protección de ramas en GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Métodos de integración en GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github)

