import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('Ficha EPS conserva sus fuentes y simula impacto sin escrituras', async ({ page }, info) => {
  const escrituras: string[] = []
  const empresas = [{ id: 'eps-uno', nombre: 'EPS de práctica Uno' }, { id: 'eps-dos', nombre: 'EPS de práctica Dos' }]
  if (process.env.QA_LOCAL_DIST === 'true') {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/')) return route.fallback()
      const archivo = url.pathname.startsWith('/assets/') || url.pathname === '/logo.png' ? url.pathname.slice(1) : 'index.html'
      const tipos: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
      await route.fulfill({ contentType: tipos[path.extname(archivo)] ?? 'application/octet-stream', body: await readFile(path.join(process.cwd(), 'dist', archivo)) })
    })
  }
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') escrituras.push(request.method() + ' ' + request.url())
    const url = new URL(request.url())
    let body: unknown = {}
    if (url.pathname === '/api/sesion') body = { usuario_id: 'jefatura-qa', nombre: 'Jefatura DRE', perfil: 'sunass', rol_id: 'jefatura_dre', eps_id: null, eps: null, simulado: false }
    else if (url.pathname === '/api/finanzas/resumen') body = { eps_disponibles: empresas }
    else if (url.pathname.startsWith('/api/finanzas/eps/')) {
      const eps = empresas.find((e) => url.pathname.endsWith(e.id))!
      body = { eps, corte: '2026-11-20', simulado: false, nota: 'Datos documentales de prueba', tramites: [{ id: 'caso-qa', titulo: 'Expediente con fuente', procedimiento: 'UFI', etapa: 'Solicitud', estado: 'en_evaluacion' }], datos: { fondo_inversion: [{ anio_mes: '2026-10', tipo_fondo: 'Inversiones', saldo_final: 12345, source_file: 'ds05_fondo.csv', source_hash: 'huella-qa' }] } }
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto('/sunass/ficha-eps')
  const panel = page.getByRole('region', { name: 'Impacto social y equidad de género' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('EPS de práctica Uno')
  await expect(panel.getByRole('status').filter({ hasText: 'Nivel:' })).toContainText('Nivel: Alerta')
  const control = panel.getByRole('slider')
  await expect(control).toHaveValue('8')
  await expect(panel.getByTestId('impacto-horas')).toHaveText(/\+3[.,]5 h/)
  await control.focus()
  await control.press('Home')
  await expect(control).toHaveValue('1')
  await expect(panel.getByRole('status').filter({ hasText: 'Nivel:' })).toContainText('Nivel: Manejable')
  await control.press('End')
  await expect(control).toHaveValue('30')
  await expect(panel.getByRole('status').filter({ hasText: 'Nivel:' })).toContainText('Nivel: Crítico')
  await expect(panel).toContainText('Déficit crítico')
  await page.getByRole('combobox').selectOption('eps-dos')
  await expect(panel).toContainText('EPS de práctica Dos')
  await expect(control).toHaveValue('8')
  await expect(page.getByRole('heading', { name: 'Fondos y reservas', exact: true })).toBeVisible()
  await expect(page.getByText('12345', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Expediente con fuente' })).toHaveAttribute('href', '/sunass/expedientes/caso-qa')
  await expect(page.getByText('ds05_fondo.csv', { exact: true })).toBeVisible()
  expect(escrituras).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await panel.screenshot({ path: info.outputPath('impacto-eps.png') })
})
