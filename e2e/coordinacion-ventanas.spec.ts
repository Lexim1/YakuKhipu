import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expedienteDeEjemplo } from '../src/mocks/tramites'

test('Coordinación asigna, reabre y reconoce asignación vigente', async ({ page }) => {
  let asignado = false
  const caso = { ...expedienteDeEjemplo('CPI-2026-0007')!, version: 1, documentos: [] }
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith('/api/')) {
      let body: unknown = { items: [], total: 0 }
      if (url.pathname === '/api/sesion') body = { usuario_id: 'qa', nombre: 'Coordinación DRE', perfil: 'sunass', rol_id: 'coordinacion_dre', eps_id: null, eps: null, simulado: false, permisos: ['expediente.consultar', 'asignacion.gestionar'] }
      else if (url.pathname.endsWith('/candidatos')) body = [{ id: 'analista', nombre: 'Analista SRT', carga_activa: 2, recomendado: !asignado, menor_carga: true, asignacion_actual: asignado }]
      else if (url.pathname.endsWith('/asignaciones')) { asignado = true; caso.version++; body = { version: caso.version } }
      else if (url.pathname === '/api/tramites/CPI-2026-0007') body = caso
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
    }
    const archivo = url.pathname.startsWith('/assets/') || url.pathname === '/logo.png' ? url.pathname.slice(1) : 'index.html'
    const tipos: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' }
    await route.fulfill({ contentType: tipos[path.extname(archivo)] ?? 'application/octet-stream', body: await readFile(path.join(process.cwd(), 'dist', archivo)) })
  })
  await page.goto('/sunass/expedientes/CPI-2026-0007')
  const abrir = page.getByRole('button', { name: 'Asignar expediente', exact: true })
  await abrir.click()
  const modal = page.getByRole('dialog', { name: 'Asignar expediente', exact: true })
  await expect(modal).toHaveCount(1)
  await expect(modal.getByRole('combobox')).toHaveValue('analista')
  await modal.getByRole('textbox').fill('Derivación con sustento de práctica')
  await modal.getByRole('button', { name: 'Confirmar asignación' }).click()
  await expect(modal).toHaveCount(0)
  await abrir.click()
  await expect(modal).toHaveCount(1)
  await expect(modal.getByText(/ya está asignado al único analista/)).toBeVisible()
  await modal.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await abrir.click()
  await modal.press('Escape')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.clock.install()
  await page.route('**/asignaciones/candidatos', () => { /* Simula una consulta que no termina. */ })
  await abrir.click()
  await expect(modal.getByText('Cargando analistas…')).toBeVisible()
  await page.clock.fastForward(31_000)
  await expect(modal.getByText(/La consulta está tardando demasiado/)).toBeVisible()
  await expect(modal.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await modal.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
})
