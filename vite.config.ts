import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, Vite reenvía la API al backend para que el portal y la API compartan origen,
// igual que en la nube (ver deploy/nginx.conf.template). Así funcionan la cookie de sesión y el
// ingreso institucional (OIDC), que vuelve a /api/auth/callback y redirige a rutas del portal.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_PROXY_API || 'http://localhost:8000'
  const reenviar = { target: api, changeOrigin: false }
  return {
    plugins: [react()],
    server: {
      proxy: { '/api': reenviar, '/health': reenviar },
    },
    preview: {
      proxy: { '/api': reenviar, '/health': reenviar },
    },
  }
})
