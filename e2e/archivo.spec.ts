import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
test.skip(!process.env.QA_ACCOUNTS_JSON || !process.env.QA_SCENARIO_FILE,'Requiere copia QA local')
const accounts=process.env.QA_ACCOUNTS_JSON ? JSON.parse(fs.readFileSync(process.env.QA_ACCOUNTS_JSON,'utf8')).accounts : []
const scenario=process.env.QA_SCENARIO_FILE ? JSON.parse(fs.readFileSync(process.env.QA_SCENARIO_FILE,'utf8')) : {}
const base=process.env.QA_BASE_URL ?? 'https://127.0.0.1:5445'
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Solo QA local')
async function login(page:Page,role:string){
 const a=accounts.find((a:{role:string})=>a.role===role)
 await page.goto(base+'/api/auth/login');await page.locator('#username').fill(a.id);await page.locator('#password').fill(a.password);await page.locator('#kc-login').click();await expect(page).toHaveURL(/\/(sunass|eps)\//)
}
test('archivo con evidencia, sin autorización ni etapas futuras completadas',async({browser},info)=>{
 const context=await browser.newContext({...info.project.use,ignoreHTTPSErrors:true})
 await context.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)&&!route.request().url().endsWith('/chat')?route.continue():route.abort('blockedbyclient'))
 try{
  expect((await(await context.request.get(base+'/health')).json()).asistente).toBe('deshabilitado')
  const p=await context.newPage();await login(p,'jefatura_dre')
  const headers={Origin:base,'Idempotency-Key':'qa-archivo-'+Date.now()}
  const received=await context.request.post(base+'/api/recepcion',{headers,data:{titulo:'Oficio técnico de archivo QA',referencia:headers['Idempotency-Key'],fecha_documento:'2026-11-20',eps_id:scenario.qa_eps_id,texto:'Documento sintético de prueba técnica: el oficio acredita el cierre y archivo por no subsanar. No es una solicitud ni un documento del dataset.'}})
  expect(received.status()).toBe(201);const did=(await received.json()).id
  const created=await context.request.post(base+'/api/recepcion/expedientes',{headers:{Origin:base},data:{documento_id:did,procedimiento:'CPI',fecha_ingreso:'2026-11-20'}})
  expect(created.status()).toBe(201);const tid=(await created.json()).tramite_id
  await p.goto(base+'/sunass/expedientes/'+encodeURIComponent(tid));await p.getByRole('button',{name:'Registrar actuación con sustento',exact:true}).click()
  const d=p.getByRole('dialog',{name:'Registrar actuación con sustento',exact:true})
  await d.getByRole('combobox',{name:'Actuación',exact:true}).selectOption('cerrar_expediente')
  await d.getByRole('combobox',{name:'Documento de sustento',exact:true}).selectOption(did)
  await d.getByLabel('Fecha acreditada',{exact:true}).fill('2026-11-20');await d.getByLabel('Detalle de la evidencia').fill('Archivo acreditado en el oficio técnico de práctica')
  const updated=p.waitForResponse(r=>r.url().endsWith('/eventos')&&r.request().method()==='POST')
  await d.getByRole('button',{name:'Confirmar actuación documentada'}).click();expect((await updated).status()).toBe(200)
  await expect(p.getByRole('heading',{name:'Procedimiento archivado',exact:true})).toBeVisible()
  await expect(p.getByRole('button',{name:/Paso 8: Resolución. No realizado/})).toBeVisible()
  await p.getByRole('button',{name:/Paso 2: Deriva a SRT. No realizado/}).click()
  await expect(p.getByText('Este paso se habilita cuando se registren los anteriores.',{exact:true})).toHaveCount(0)
  await p.screenshot({path:`${process.env.QA_SCREENSHOTS}/archivo-${info.project.name}.png`,scale:'css',animations:'disabled'})
 }finally{await context.close()}
})
