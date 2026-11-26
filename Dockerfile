# Portal YakuKhipu: compila el frontend y lo sirve con nginx, que reenvía /api al backend.
# Variables en Railway: BACKEND_URL (p. ej. http://portal.railway.internal:8080) y PORT (la pone Railway).

FROM node:24-alpine AS compilar
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Mismo origen: la API se consulta en /api del propio portal.
ENV VITE_API_URL= VITE_USAR_EJEMPLOS=false
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=8080
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=compilar /app/dist /usr/share/nginx/html
EXPOSE 8080
