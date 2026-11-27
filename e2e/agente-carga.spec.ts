import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'
test.skip(!process.env.QA_ACCOUNTS_JSON || !process.env.QA_SCENARIO_FILE, 'Requiere copia QA local aislada y datos sintéticos')
const accounts = process.env.QA_ACCOUNTS_JSON ? JSON.parse(fs.readFileSync(process.env.QA_ACCOUNTS_JSON, 'utf8')).accounts : []
const scenario = process.env.QA_SCENARIO_FILE ? JSON.parse(fs.readFileSync(process.env.QA_SCENARIO_FILE, 'utf8')) : {}
const base = process.env.QA_BASE_URL ?? 'https://127.0.0.1:5445'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('No ejecutar escrituras fuera de QA local')
async function login(page: Page, role: string) {
  const user = accounts.find((u: { role: string }) => u.role === role)
  await page.goto(base + '/api/auth/login')
  await page.locator('#username').fill(user.id); await page.locator('#password').fill(user.password)
  await page.locator('#kc-login').click(); await expect(page).toHaveURL(/\/(sunass|eps)\//)
}
async function protect(context: BrowserContext) {
  await context.route('**/*', (route) => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'))
  const health = await (await context.request.get(base + '/health')).json()
  expect(health.asistente).toBe('deshabilitado') // La respuesta extractiva no puede contactar al proveedor.
}
async function preguntar(page: Page, question: string) {
  const dialog = page.getByRole('dialog', { name: 'Agente YakuKhipu' })
  await dialog.getByLabel('Escribe tu pregunta sobre el caso').fill(question)
  await dialog.getByRole('button', { name: 'Enviar pregunta' }).click()
  return dialog
}

test('búsqueda, citas y reparto por carga con datos QA reales', async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, ignoreHTTPSErrors: true }); await protect(context)
  const page = await context.newPage(); const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message))
  await login(page, 'coordinacion_dre')
  const casePath = base + '/api/tramites/' + encodeURIComponent(scenario.caso_carga)
  let current = await (await context.request.get(casePath)).json()
  let candidates = await (await context.request.get(casePath + '/asignaciones/candidatos')).json()
  if (!candidates.find((p: { id: string; asignacion_actual: boolean }) => p.id === scenario.analista_inicial)?.asignacion_actual) {
    const reset = await context.request.post(casePath + '/asignaciones', { headers: { Origin: base }, data: { usuario_id: scenario.analista_inicial, version: current.version, motivo: 'Preparación del caso sintético QA' } })
    expect(reset.status()).toBe(201)
  }
  await page.goto(base + '/sunass/expedientes/' + scenario.caso_carga)
  await page.getByRole('button', { name: 'Asignar expediente', exact: true }).click()
  const assign = page.getByRole('dialog', { name: 'Asignar expediente', exact: true })
  await expect(assign.getByText(/Menor carga:.*QA Beto \(0 activos\)/)).toBeVisible()
  await assign.getByRole('combobox', { name: 'Analista SRT', exact: true }).selectOption(scenario.analista_recomendado)
  await assign.getByLabel('Motivo', { exact: true }).fill('Distribución de práctica según carga real')
  await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/agente-carga-${info.project.name}.png`, scale: 'css', animations: 'disabled' })
  const assigned = page.waitForResponse((r) => r.url().endsWith('/asignaciones') && r.request().method() === 'POST')
  await assign.getByRole('button', { name: 'Confirmar asignación' }).click(); expect((await assigned).status()).toBe(201)
  candidates = await (await context.request.get(base + '/api/asignaciones/carga')).json()
  expect(candidates.find((p: { id: string }) => p.id === scenario.analista_recomendado).carga_activa).toBe(1)
  await page.goto(base + '/sunass/expedientes?q=' + encodeURIComponent('hidroanclajeQA'))
  await expect(page.locator(`a[href="/sunass/expedientes/${scenario.caso_carga}"]`)).toBeVisible()
  await page.getByRole('button', { name: 'Ver fuentes con el agente' }).click()
  const dialog = page.getByRole('dialog', { name: 'Agente YakuKhipu' })
  await expect(dialog.getByText(/QA-AGENTE-CPI-001/)).toBeVisible()
  await expect(dialog.getByText('Analista asignado: QA Beto', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: /Oficio QA 76321.*abrir la fuente/ }).first().click()
  await expect(dialog.getByText('Página 1', { exact: true })).toBeVisible()
  await expect(dialog.locator('mark')).toContainText('hidroanclajeQA')
  await dialog.getByRole('button', { name: 'Volver a la conversación' }).click()
  await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/agente-busqueda-${info.project.name}.png`, scale: 'css', animations: 'disabled' })
  await dialog.getByRole('link', { name: 'Abrir expediente', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(scenario.caso_carga))
  await page.getByRole('button', { name: 'Preguntar a Yaku', exact: true }).click()
  const response = page.waitForResponse((r) => r.url().endsWith('/api/agente/chat') && r.request().method() === 'POST')
  const caseDialog = await preguntar(page, '¿Qué dice sobre hidroanclajeQA?')
  const r = await response; expect(r.status()).toBe(200)
  const answer = await r.json(); expect(answer.modelo).toBeNull(); expect(answer.fuentes[0].pagina_pdf).toBe(1)
  await expect(caseDialog.getByText(/Encontré estos extractos/)).toBeVisible()
  expect(errors).toEqual([]); await context.close()
})

test('la búsqueda EPS conserva el ámbito y los controles caben a 320 px', async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, viewport: { width: 320, height: 800 }, ignoreHTTPSErrors: true }); await protect(context)
  const page = await context.newPage(); await login(page, 'eps')
  const r = await context.request.get(base + '/api/agente/buscar?' + new URLSearchParams({ q: 'hidroanclajeQA' }))
  expect(r.status()).toBe(200); const result = await r.json()
  expect(result.items[0].tramite_id).toBe(scenario.caso_carga)
  expect(result.items[0].analista).toBeNull(); expect(result.items[0].responsable).toBeNull()
  expect((await context.request.get(base + '/api/asignaciones/carga')).status()).toBe(403)
  await page.getByRole('button', { name: /Preguntar al agente/ }).click()
  const dialog = await preguntar(page, 'Busca hidroanclajeQA')
  await expect(dialog.getByRole('link', { name: 'Abrir expediente', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(322)
  await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/agente-eps-320-${info.project.name}.png`, scale: 'css', animations: 'disabled' })
  await context.close()
})
