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
otro servicio. La autorización posterior del usuario permite exclusivamente
empaquetar estos recursos y seleccionar `yakukhipu` como Login theme.
`Dockerfile` conserva la imagen 26.8.2 y su digest previo; su única instrucción
adicional copia el tema a `/opt/keycloak/themes/yakukhipu`.

La raíz de construcción de este servicio debe ser `/keycloak`; el Dockerfile
principal del frontend construye React y NO debe utilizarse para Keycloak.
Se conserva `/opt/keycloak/bin/kc.sh start`, las variables de entorno existentes,
la base KeycloakDB y la configuración de red. Para seguir cambios de temas desde
GitHub, conectar el servicio a frontend/master con esa raíz después de aprobar
el PR del empaquetado. No seleccionar una rama que carezca de este Dockerfile.

En el realm se cambia únicamente `loginTheme`. No importar otro realm, ni cambiar
clientes OIDC, callbacks, flujos, usuarios, contraseñas o roles. Comparar las
huellas de esos valores antes y después del despliegue; verificar ingreso,
recursos de tema, mensajes y cierre de sesión desde el portal.

## Verificación visual

Comprobar escritorio y móvil: ingreso, error por credenciales inválidas,
visibilidad de contraseña, navegación por teclado, actualización de perfil y
cambio de contraseña. Mantener visibles las acciones y mensajes nativos.
El enlace de ingreso del frontend sigue usando `URL_INGRESO_INSTITUCIONAL` y su
ruta actual; no se construye una URL alternativa hacia Keycloak.

Guía oficial: https://www.keycloak.org/ui-customization/themes
