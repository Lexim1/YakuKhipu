# Tema visual YakuKhipu

Contenido del entregable:

```
themes/yakukhipu/login/
  theme.properties
  resources/css/yakukhipu.css
  resources/img/logo.png
  resources/fonts/inter-latin-wght-normal.woff2
  resources/fonts/OFL.txt
```

El tema hereda `keycloak.v2` (servicio actual: Keycloak 26.8.2), conserva su CSS
original y añade las reglas de marca al final. No reemplaza formularios FTL,
JavaScript, acciones, campos, validaciones ni mensajes de Keycloak. Aplica al
ingreso, errores y pasos adicionales mediante las clases del tema nativo.

El logo y la tipografía son copias de los recursos existentes del frontend.
No hay dependencias de Google Fonts, del dominio del portal ni de CDN externos.
El nombre visible sigue siendo el del realm existente.

## Estado de publicación

Los archivos están versionados en el repositorio frontend. La landing se publica
por el flujo de PR del frontend → PR automático del backend → Railway ya existente.
Este cambio no edita dicho workflow, el Dockerfile, variables, API ni OIDC.

El tema de Keycloak NO se instala automáticamente con el frontend. Keycloak es
otro servicio y su imagen actual no contiene esta carpeta. Activarlo requiere
incluir `themes/yakukhipu` en `/opt/keycloak/themes/yakukhipu` del servicio Keycloak
y seleccionar `yakukhipu` como Login theme del realm. Ambos son cambios de
despliegue/configuración que la restricción de este encargo no autoriza.
Por ello se entrega listo para instalar y NO se cambia el tema activo en nube.
No basta con aprobar el PR frontend para personalizar el servicio Keycloak.

## Verificación visual

Comprobar escritorio y móvil: ingreso, error por credenciales inválidas,
visibilidad de contraseña, navegación por teclado, actualización de perfil y
cambio de contraseña. Mantener visibles las acciones y mensajes nativos.
El enlace de ingreso del frontend sigue usando `URL_INGRESO_INSTITUCIONAL` y su
ruta actual; no se construye una URL alternativa hacia Keycloak.

Guía oficial: https://www.keycloak.org/ui-customization/themes
