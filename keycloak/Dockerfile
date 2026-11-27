# La misma imagen que ejecutaba Keycloak antes de instalar la apariencia YakuKhipu.
# No modifica variables, proveedores, realm, clientes ni opciones de autenticación.
FROM quay.io/keycloak/keycloak:26.8.2@sha256:7e66a96e4739239070aeaf72e4c5decf0f7f682cfc725b9f7ea2b336eaba38b3
COPY --chown=1000:0 themes/yakukhipu /opt/keycloak/themes/yakukhipu
