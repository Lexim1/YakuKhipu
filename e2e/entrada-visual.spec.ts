import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('landing: diseño adaptable y enlaces existentes', async ({ page }, info) => {
  // Permite revisar dist sin servidor local; no consulta ni modifica servicios en nube.
  if (process.env.QA_LOCAL_DIST === 'true') {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Sin sesión"}' })
      const archivo = url.pathname.startsWith('/assets/') || url.pathname === '/logo.png' ? url.pathname.slice(1) : 'index.html'
      const tipos: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
      await route.fulfill({ contentType: tipos[path.extname(archivo)] ?? 'application/octet-stream', body: await readFile(path.join(process.cwd(), 'dist', archivo)) })
    })
  }
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Sin sesión"}' }))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿En qué se invierte el agua de tu ciudad?')
  await expect(page.getByRole('link', { name: /Iniciar sesión/ })).toHaveAttribute('href', '/api/auth/login')
  await expect(page.locator('.inicio-procesos article')).toHaveCount(3)
  await expect(page.locator('.inicio-khipu li')).toHaveCount(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('landing.png'), fullPage: true })
  await page.getByRole('searchbox').fill('Tacna')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page).toHaveURL(/\/ciudadania\/decisiones\?q=Tacna$/)
  await expect(page.getByRole('link', { name: /Iniciar sesión/ })).toHaveAttribute('href', '/api/auth/login')
  await page.goto('/?acceso=fallido')
  await expect(page.getByText(/No se completó el ingreso/)).toBeVisible()
  await page.goto('/?volver=%2Fsunass%2Fexpedientes')
  await expect(page.getByRole('link', { name: 'Ingresar al Portal' })).toHaveAttribute('href', '/api/auth/login')
})

test('tema: vista previa con formulario nativo, sin cambiar Keycloak', async ({ page, request }, info) => {
  // Solicitud sin credenciales: obtiene la plantilla del cliente existente, no cambia configuración.
  const respuesta = await request.get('https://portal-production-bd3a7ffd.up.railway.app/api/auth/login')
  expect(respuesta.status()).toBe(200)
  let html = await respuesta.text()
  expect(html).toContain('kc-form-login')
  html = html.replaceAll('href="/resources/', 'href="https://keycloak-production-e95e3b8d.up.railway.app/resources/')
    .replaceAll('src="/resources/', 'src="https://keycloak-production-e95e3b8d.up.railway.app/resources/')
  const base = new URL(process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173').origin
  html = html.replace('</head>', `<link rel="stylesheet" href="${base}/keycloak/themes/yakukhipu/login/resources/css/yakukhipu.css"></head>`)
  await page.setContent(html, { waitUntil: 'networkidle' })
  // El servicio actual puede usar el tema keycloak clásico; la entrega hereda v2.
  // Se verifica visibilidad y carga de marca sin enviar el formulario.
  await expect(page.locator('#username')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.locator('#kc-login')).toBeVisible()
  expect(await page.locator('#kc-login').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(16, 52, 44)')
  expect(await page.locator('#kc-header-wrapper').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(16, 52, 44)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('keycloak-preview.png'), fullPage: true })
})
