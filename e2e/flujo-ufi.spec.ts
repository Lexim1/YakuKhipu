import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'

test.skip(!process.env.QA_UFI_MANIFEST || !process.env.QA_ACCOUNTS_JSON || !process.env.QA_SCENARIO_FILE, 'Requiere copia QA local y paquete UFI ficticio')
const cuentas = process.env.QA_ACCOUNTS_JSON ? JSON.parse(fs.readFileSync(process.env.QA_ACCOUNTS_JSON, 'utf8')).accounts : []
const escenario = process.env.QA_SCENARIO_FILE ? JSON.parse(fs.readFileSync(process.env.QA_SCENARIO_FILE, 'utf8')) : {}
const manifiesto = process.env.QA_UFI_MANIFEST ? JSON.parse(fs.readFileSync(process.env.QA_UFI_MANIFEST, 'utf8')) : { archivos: {} }
const base = process.env.QA_BASE_URL ?? 'https://127.0.0.1:5445'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo se permiten escrituras en QA local')

test('solicitud UFI nueva → jefatura → coordinación → analista → EPS → resolución del mismo caso', async ({ browser }, info) => {
  test.setTimeout(360_000)
  const run = `${info.project.name}-${Date.now()}`
  const errores: string[] = []; const pasos: { rol: string; accion: string; etapa: string; estado: string }[] = []
  const contextos: BrowserContext[] = []
  async function entrar(rol: string, id?: string) {
    const contexto = await browser.newContext({ ...info.project.use, ignoreHTTPSErrors: true })
    contextos.push(contexto); contexto.setDefaultTimeout(20_000)
    await contexto.route('**/*', (route) => {
      const url = new URL(route.request().url())
      return !['localhost', '127.0.0.1'].includes(url.hostname) || /\/chat$/.test(url.pathname) ? route.abort('blockedbyclient') : route.continue()
    })
    expect((await (await contexto.request.get(base+'/health')).json()).asistente).toBe('deshabilitado')
    const page = await contexto.newPage(); page.on('pageerror', e => errores.push(e.message))
    page.on('response', r => { if (r.status() >= 500) errores.push(`${r.status()} ${new URL(r.url()).pathname}`) })
    const cuenta = cuentas.find((c: { id: string; role: string }) => id ? c.id === id : c.role === rol)
    expect(cuenta).toBeTruthy()
    await page.goto(base+'/api/auth/login'); await page.locator('#username').fill(cuenta.id)
    await page.locator('#password').fill(cuenta.password); await page.locator('#kc-login').click()
    await expect(page).toHaveURL(/\/(sunass|eps)\//)
    return { contexto, page }
  }
  let tid = ''
  const endpoint = () => base+'/api/tramites/'+encodeURIComponent(tid)
  const rutaCaso = () => base+'/sunass/expedientes/'+encodeURIComponent(tid)
  async function cargar(persona: { contexto: BrowserContext; page: Page }, key: string, nuevo=false) {
    console.log('UFI · cargando documento', key)
    const { contexto, page } = persona; const dato = manifiesto.archivos[key]
    await page.goto(base+'/sunass/recepcion'); await page.getByRole('button', { name: 'Cargar PDF recibido', exact: true }).click()
    await page.getByLabel('Título', { exact: true }).fill(dato.referencia+' · Demo '+run)
    await page.getByLabel('Referencia o hoja de trámite').fill(dato.referencia+' · DEMO-'+run)
    await page.getByLabel('Fecha del documento').fill(dato.fecha)
    await page.locator('select[name="eps_id"]').selectOption(escenario.ufi_eps_id)
    await page.locator('input[type="file"]').setInputFiles(dato.archivo)
    await page.getByRole('checkbox', { name: 'Material ficticio de práctica' }).check()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual((page.viewportSize()?.width ?? 1365)+2)
    const received = page.waitForResponse(r => r.url().endsWith('/api/recepcion/pdf') && r.request().method()==='POST')
    await page.locator('form').getByRole('button', { name: 'Cargar PDF', exact: true }).click()
    const response = await received; expect(response.status()).toBe(202); let did = ''
    await expect.poll(async () => {
      const lista = (await (await contexto.request.get(base+'/api/recepcion')).json()).items
      const documento=lista.find((d: { referencia: string })=>d.referencia===dato.referencia+' · DEMO-'+run)
      did=documento?.id ?? ''
      return documento?.procesamiento_pdf?.estado
    }, { timeout: 90_000, intervals: [500,1000,2000] }).toBe('listo')
    console.log('UFI · PDF procesado', key)
    await page.reload()
    await page.locator(`article[aria-labelledby="doc-${did}"]`).getByRole('button', { name:'Vincular o registrar expediente' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Incorporar documento', exact: true })
    if (nuevo) {
      await dialogo.getByRole('combobox', { name:'Destino', exact:true }).selectOption('nuevo')
      await dialogo.getByRole('combobox', { name:'Procedimiento', exact:true }).selectOption('UFI')
      await dialogo.getByLabel('Fecha de ingreso según el cargo de Mesa de Partes').fill(dato.fecha)
      const created = page.waitForResponse(r=>r.url().endsWith('/api/recepcion/expedientes') && r.request().method()==='POST')
      await dialogo.getByRole('button', { name:'Registrar solicitud', exact:true }).click()
      const r=await created;expect(r.status()).toBe(201);tid=(await r.json()).tramite_id
    } else {
      await dialogo.getByRole('combobox', { name:'Expediente', exact:true }).selectOption(tid)
      const added=page.waitForResponse(r=>r.url().endsWith('/api/recepcion/incorporaciones') && r.request().method()==='POST')
      await dialogo.getByRole('button', { name:'Incorporar documento', exact:true }).click()
      expect((await added).status()).toBe(204)
    }
    await expect(dialogo).not.toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual((page.viewportSize()?.width ?? 1365)+2)
    console.log('UFI · documento incorporado', key)
    return did as string
  }
  async function compartir(persona: { contexto: BrowserContext; page: Page }, did: string) {
    await persona.page.goto(rutaCaso())
    const docs=(await (await persona.contexto.request.get(endpoint()+'/documentos')).json()).items
    const titulo=docs.find((d: { id: string })=>d.id===did).titulo
    await persona.page.getByRole('button',{name:'Revisar acceso EPS: '+titulo,exact:true}).click()
    const d=persona.page.getByRole('dialog',{name:'Revisar acceso de la EPS',exact:true})
    await d.getByRole('combobox',{name:'Acceso del documento',exact:true}).selectOption('partes')
    await d.getByLabel('Motivo de la revisión').fill('Documento de práctica revisado para la EPS titular del expediente')
    const updated=persona.page.waitForResponse(r=>r.url().endsWith('/visibilidad') && r.request().method()==='PUT')
    await d.getByRole('button',{name:'Guardar acceso revisado'}).click();expect((await updated).status()).toBe(200)
    await expect(d).not.toBeVisible()
    expect(await persona.page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual((persona.page.viewportSize()?.width ?? 1365)+2)
  }
  async function actuar(persona: { contexto: BrowserContext; page: Page }, rol: string, tipo: string, did: string, fecha: string, extra?: 'requerimiento'|'resolucion') {
    console.log('UFI · actuación', rol, tipo, fecha)
    await persona.page.goto(rutaCaso());await persona.page.getByRole('button',{name:'Registrar actuación con sustento',exact:true}).click()
    const d=persona.page.getByRole('dialog',{name:'Registrar actuación con sustento',exact:true})
    await d.getByRole('combobox',{name:'Actuación',exact:true}).selectOption(tipo)
    await d.getByRole('combobox',{name:'Documento de sustento',exact:true}).selectOption(did)
    await d.getByLabel('Fecha acreditada',{exact:true}).fill(fecha)
    await d.getByLabel('Detalle de la evidencia').fill('Reconstrucción ficticia UFI-2024-0001 basada en el PDF o hito DS10 seleccionado; sin emitir actos oficiales.')
    if(extra==='requerimiento') {
      await d.getByLabel('Días señalados expresamente en el oficio').fill('10')
      await d.getByLabel('Requisitos documentados (uno por línea)').fill('Sustento de los costos unitarios\nCronograma coherente con el programa de inversiones\nAcuerdo de Directorio que aprueba la solicitud')
    }
    if(extra==='resolucion') await d.getByLabel('Resultado acreditado').selectOption('autorizado_parcial')
    const response=persona.page.waitForResponse(r=>r.url().endsWith('/eventos') && r.request().method()==='POST')
    await d.getByRole('button',{name:'Confirmar actuación documentada'}).click();const r=await response
    expect(r.status(),await r.text()).toBe(200);const ficha=await r.json()
    await expect(d).not.toBeVisible();pasos.push({rol,accion:tipo,etapa:ficha.etapa,estado:ficha.estado})
    return ficha
  }
  try {
    const jefa=await entrar('jefatura_dre')
    const solicitud=await cargar(jefa,'solicitud',true)
    const inicial=await (await jefa.contexto.request.get(endpoint())).json()
    expect(inicial.simulado).toBe(true);expect(inicial.flujo.pasos[0].estado).toBe('actual')
    expect((await (await jefa.contexto.request.get(endpoint()+'/asignaciones/candidatos')).json()).some((c: { asignacion_actual: boolean })=>c.asignacion_actual)).toBe(false)
    await compartir(jefa,solicitud)
    const proveido=await cargar(jefa,'derivacion');await actuar(jefa,'jefatura','avanzar_paso',proveido,'2024-06-11')
    const coord=await entrar('coordinacion_dre')
    const asignacion=await cargar(coord,'asignacion')
    await coord.page.goto(rutaCaso());await coord.page.getByRole('button',{name:'Asignar expediente',exact:true}).click()
    const asignar=coord.page.getByRole('dialog',{name:'Asignar expediente',exact:true})
    await asignar.getByRole('combobox',{name:'Analista SRT',exact:true}).selectOption(escenario.analista_recomendado)
    await asignar.getByLabel('Motivo',{exact:true}).fill('Derivación de práctica a analista según carga abierta y disponibilidad')
    const assigned=coord.page.waitForResponse(r=>r.url().endsWith('/asignaciones')&&r.request().method()==='POST')
    await asignar.getByRole('button',{name:'Confirmar asignación'}).click();expect((await assigned).status()).toBe(201)
    await actuar(coord,'coordinacion','avanzar_paso',asignacion,'2024-06-12')
    const tupa=await cargar(coord,'tupa')
    const analista=await entrar('analista_srt',escenario.analista_recomendado)
    expect((await analista.contexto.request.get(base+'/api/recepcion')).status()).toBe(403)
    await actuar(analista,'analista','avanzar_paso',tupa,'2024-06-17')
    const oficio=await cargar(coord,'oficio');await compartir(coord,oficio)
    await actuar(analista,'analista','requerir_subsanacion',oficio,'2024-06-20','requerimiento')
    const eps=await entrar('eps',escenario.ufi_eps_usuario)
    expect((await eps.contexto.request.get(base+'/api/documentos/'+encodeURIComponent(proveido)+'/contenido')).status()).toBe(404)
    await eps.page.goto(base+'/eps/tramites/'+encodeURIComponent(tid))
    await expect(eps.page.getByText(/Responde el OF-2024-0013/).first()).toBeVisible()
    await eps.page.getByRole('button',{name:/Leer OF-2024-0013/}).click()
    await expect(eps.page.getByRole('dialog').getByRole('link',{name:'Abrir PDF autorizado'})).toBeVisible()
    await eps.page.getByRole('dialog').getByRole('button',{name:'Cerrar',exact:true}).click()
    await eps.page.goto(base+'/eps/tramites/'+encodeURIComponent(tid)+'/respuesta')
    await eps.page.getByRole('button',{name:/Ya presenté/}).click()
    const respuesta=eps.page.getByRole('dialog')
    await respuesta.getByLabel('Documento con que respondiste').fill('CARTA N. 007-2024-EPS07/GG')
    await respuesta.getByLabel('Fecha de presentación').fill('2024-06-24');await respuesta.getByRole('checkbox').check()
    const avisada=eps.page.waitForResponse(r=>r.url().endsWith('/respuestas')&&r.request().method()==='POST')
    await respuesta.getByRole('button',{name:'Informar presentación'}).click();expect((await avisada).status()).toBe(200)
    const carta=await cargar(coord,'respuesta');await compartir(coord,carta)
    await actuar(analista,'analista','verificar_respuesta',carta,'2024-06-24')
    const evaluacion=await cargar(coord,'evaluacion');await actuar(analista,'analista','avanzar_paso',evaluacion,'2024-06-28')
    const informe=await cargar(coord,'informe');await actuar(analista,'analista','registrar_informe',informe,'2024-07-08')
    expect((await eps.contexto.request.get(base+'/api/documentos/'+encodeURIComponent(informe)+'/contenido')).status()).toBe(404)
    const firmas=await cargar(jefa,'firmas');await actuar(jefa,'jefatura','avanzar_paso',firmas,'2024-07-15')
    const memo=await cargar(jefa,'memo');await actuar(jefa,'jefatura','avanzar_paso',memo,'2024-07-16')
    const elevacion=await cargar(coord,'elevacion');await actuar(coord,'coordinacion','avanzar_paso',elevacion,'2024-07-19')
    const resolucion=await cargar(jefa,'resolucion');await compartir(jefa,resolucion)
    await actuar(jefa,'jefatura','avanzar_paso',resolucion,'2024-07-25')
    const final=await actuar(jefa,'jefatura','resolver',resolucion,'2024-07-25','resolucion')
    expect(final.estado).toBe('autorizado');expect(final.flujo.pasos.every((p:{estado:string})=>p.estado==='hecho')).toBe(true)
    await eps.page.goto(base+'/eps/tramites/'+encodeURIComponent(tid))
    await expect(eps.page.getByText('Autorizado parcialmente',{exact:true}).first()).toBeVisible()
    await expect(eps.page.getByText('Te avisaremos cuando se publique',{exact:true})).toHaveCount(0)
    await eps.page.getByRole('button',{name:/Leer RCD-2024-0011/}).click()
    await expect(eps.page.getByRole('dialog').locator('pre')).toContainText('254,485.44')
    const pdf=await eps.contexto.request.get(base+'/api/documentos/'+encodeURIComponent(resolucion)+'/contenido?formato=pdf')
    expect(pdf.status()).toBe(200);expect((await pdf.body()).subarray(0,5).toString()).toBe('%PDF-')
    await eps.page.screenshot({path:`${process.env.QA_SCREENSHOTS}/ufi-resolucion-${info.project.name}.png`,scale:'css',animations:'disabled'})
    expect(await eps.page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual((eps.page.viewportSize()?.width ?? 1365)+2)
    expect(errores).toEqual([])
    fs.writeFileSync(`${process.env.QA_SCREENSHOTS}/ufi-recorrido-${info.project.name}.json`,JSON.stringify({tramite_id:tid,perfil_eps:'EPS07',simulado:true,solicitud,oficio,respuesta:carta,informe,resolucion,pasos,inferencia:0,estado:'autorizado_parcialmente'},null,2))
  } finally { for(const contexto of contextos) await contexto.close() }
})
