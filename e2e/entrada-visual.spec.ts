import { test, expect } from '@playwright/test'

test('landing: diseño adaptable y enlaces existentes', async ({ page }, info) => {
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Sin sesión"}' }))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cada decisión sobre el agua, con un camino claro.')
  await expect(page.getByRole('link', { name: 'Ingresar al Portal' })).toHaveAttribute('href', '/api/auth/login')
  await expect(page.getByRole('link', { name: /Consultar decisiones sin iniciar/ })).toHaveAttribute('href', '/ciudadania/decisiones')
  await expect(page.locator('.entrada__tarjetas article')).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('landing.png'), fullPage: true })
  await page.goto('/?acceso=fallido')
  await expect(page.getByText(/No se completó el ingreso/)).toBeVisible()
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
