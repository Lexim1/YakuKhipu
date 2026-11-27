import assert from 'node:assert/strict'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

process.env.VITE_USAR_EJEMPLOS = 'false'
process.env.VITE_API_URL = ''
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const fixtures = new Map()
const requests = []
globalThis.fetch = async (url, options = {}) => {
  const path = String(url)
  assert(path.startsWith('/api/'), 'Solo se permiten respuestas API simuladas; ninguna llamada externa')
  assert(!/chat|completions/.test(path), 'No se permite inferencia en las pruebas')
  const method = options.method ?? 'GET'
  requests.push({ path, method, ...options })
  const response = fixtures.get(`${method} ${path}`)
  assert(response, `Petición inesperada: ${method} ${path}`)
  return new Response(response.status === 204 ? null : JSON.stringify(response.body), response)
}
const mock = (method, path, body, status = 200, headers = {}) => fixtures.set(`${method} ${path}`, { body, status, headers })

try {
  const api = await server.ssrLoadModule('/src/services/api.ts')
  assert.equal(api.usarEjemplos, false)
  const session = await server.ssrLoadModule('/src/services/sesion.ts')
  mock('GET', '/api/sesion', { perfil: 'sunass', permisos: ['expediente.consultar'] })
  assert.equal((await session.obtenerSesion()).perfil, 'sunass')
  assert.equal(requests.at(-1).credentials, 'include')
  mock('DELETE', '/api/sesion', null, 204, { 'X-Logout-URL': 'https://identidad.example/logout' })
  assert.equal(await session.cerrarSesion(), 'https://identidad.example/logout')

  const publicService = await server.ssrLoadModule('/src/services/publico.ts')
  const dto = { id: 'qa-publica', eps: 'EPS QA', localidad: 'Localidad QA', procedimiento: 'CPI', titulo: 'Decisión QA',
    resumen_ciudadano: 'Resumen revisado', estado_publico: 'decision_publicada', cifra: null, nota_estado: null,
    fecha_actualizacion: null, simulado: true, documentos: [] }
  mock('GET', '/api/publico/decisiones/qa-publica', dto)
  const decision = await publicService.obtenerDecision('qa-publica')
  assert.equal(requests.at(-1).credentials, 'omit')
  assert.deepEqual(decision.impacto, [])
  assert.deepEqual(decision.fuentes, [])
  assert.equal(decision.autorizado, null)
  assert.equal(decision.ejecutado, null)
  const { FichaDecision } = await server.ssrLoadModule('/src/pages/ciudadania/Decision.tsx')
  const { MemoryRouter } = await server.ssrLoadModule('react-router')
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(FichaDecision, { d: decision })))
  assert.match(html, /No disponible/)
  assert.equal(decision.fecha_actualizacion, '')
  assert.match(html, /Cantidad no publicada/)
  assert(!html.includes('NaN') && !html.includes('Invalid Date'))
  const { LineaArea } = await server.ssrLoadModule('/src/components/Graficos.tsx')
  const zeroGraph = renderToStaticMarkup(React.createElement(LineaArea, { puntos: [{ x: '2026-T3', y: 0 }], formato: String, etiqueta: 'Ejecución cero' }))
  assert(!zeroGraph.includes('NaN') && !zeroGraph.includes('Infinity'), 'Los reportes con cero deben ser graficables')

  const finance = await server.ssrLoadModule('/src/services/finanzas.ts')
  assert.equal(finance.soles(null), 'Sin dato publicado')
  assert.notEqual(finance.soles(0), finance.soles(null))
  mock('GET', '/api/finanzas/resumen?corte=2026-11-20&eps_id=EPS+A', { total: { ejecutado: null } })
  assert.equal((await finance.consultarFinanzas(undefined, '2026-11-20', 'EPS A')).total.ejecutado, null)

  const cases = await server.ssrLoadModule('/src/services/tramites.ts')
  mock('POST', '/api/recepcion/incorporaciones', null, 204)
  await cases.incorporarDocumento({ documento_id: 'doc-qa', tramite_id: 'caso-qa', tipo_actuacion: 'Informe', asignado_a: null, avisar: false, version: 1 })
  mock('GET', '/api/recepcion/catalogos', { empresas: [{ id: 'eps-qa', nombre: 'EPS QA' }], analistas: [{ id: 'analista-qa', nombre: 'Analista QA' }] })
  mock('GET', '/api/recepcion/destinos', { items: [] })
  assert.equal((await cases.obtenerCatalogosRecepcion()).asignables[0].id, 'analista-qa')
  assert.equal((await cases.obtenerCatalogosRecepcion()).asignables[0].carga_activa, undefined, 'La API antigua no debe convertirse en carga cero')
  const candidates = [{ id: 'a', nombre: 'Ana', carga_activa: 0, menor_carga: true, recomendado: true, asignacion_actual: false, ultima_asignacion: null }, { id: 'b', nombre: 'Beto', carga_activa: 3, menor_carga: false, recomendado: false, asignacion_actual: false, ultima_asignacion: null }]
  mock('GET', '/api/asignaciones/carga', candidates)
  assert.match(cases.textoCandidato(candidates[0]), /0 expedientes activos.*menor carga/)
  mock('GET', '/api/recepcion/catalogos', { empresas: [], analistas: candidates })
  const catalog = await cases.obtenerCatalogosRecepcion()
  assert.equal(catalog.asignables[0].menor_carga, true)
  assert.equal(catalog.asignables[1].carga_activa, 3)
  const assistant = await server.ssrLoadModule('/src/services/asistente.ts')
  const loadReply = await assistant.preguntarAlAgente({ caso: { tipo: 'tramite', id: 'caso-qa' }, pregunta: '¿Qué analista tiene menos carga?', preguntas: [], conversacionId: null })
  assert.match(loadReply.respuesta, /Ana: 0 expedientes abiertos/)
  assert.equal(requests.at(-1).path, '/api/asignaciones/carga')
  const searchQuery = 'Busca abrazaderas'
  const found = { tramite_id: 'caso-qa', referencia: 'EXP-123', eps: 'EPS QA', titulo: 'Prueba', etapa: 'Evaluación', estado: 'en_evaluacion', enlace_expediente: '/sunass/expedientes/caso-qa', fuentes: [{ documento_id: 'doc-qa', fragmento_id: 'doc-qa-p2', pagina_pdf: 2, titulo: 'Oficio', extracto: 'Abrazaderas', enlace: '/api/documentos/doc-qa/contenido?pagina=2', tipo: 'texto' }] }
  mock('GET', '/api/agente/buscar?' + new URLSearchParams({ q: searchQuery, limite: '5' }), { items: [found], limite: 5, parcial: false, sin_inferencia: true, nota: 'Fuentes autorizadas' })
  const searchReply = await assistant.preguntarAlAgente({ cartera: true, pregunta: searchQuery, preguntas: [], conversacionId: null })
  assert.equal(searchReply.expedientes[0].referencia, 'EXP-123')
  assert.equal(searchReply.fuentes[0].pagina_pdf, 2)
  assert.equal(searchReply.conversacion_id, 'cartera')

  mock('GET', '/api/conflicto', { detail: 'El expediente fue actualizado por otra persona.' }, 409)
  await assert.rejects(api.pedirJson('/api/conflicto'), /actualizado por otra persona/)
  console.log(`Contratos verificados: sesión, 204, ficha pública incompleta, datos ausentes, finanzas, recepción y conflictos. ${requests.length} peticiones simuladas; 0 llamadas de IA.`)
} finally {
  await server.close()
}
