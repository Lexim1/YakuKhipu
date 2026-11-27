import assert from 'node:assert/strict'
import test from 'node:test'
import { actualizarPin, sincronizar, FRONTEND } from '../scripts/sincronizar-portal.mjs'

const sha = 'a'.repeat(40)
const viejo = 'b'.repeat(40)
const dockerfile = `FROM node:24\nARG FRONTEND_COMMIT=${viejo}\nRUN npm ci\n`

function entorno({ head = sha, texto = dockerfile, pulls = [], ramas = [], autor = 'bot' } = {}) {
  const llamadas = []
  return {
    llamadas,
    fuente: async () => ({ object: { sha: head } }),
    backend: async (metodo, ruta, datos) => {
      llamadas.push({ metodo, ruta, datos })
      if (ruta.endsWith('/git/ref/heads/master')) return { object: { sha: viejo } }
      if (ruta.includes('/contents/Dockerfile')) return { content: Buffer.from(texto).toString('base64') }
      if (ruta.includes('/pulls?')) return pulls
      if (ruta.includes('/git/matching-refs')) return ramas
      if (ruta.includes('/git/commits/') && metodo === 'GET') return { tree: { sha: 'base-tree' } }
      if (ruta.endsWith('/git/blobs')) return { sha: 'blob' }
      if (ruta.endsWith('/git/trees')) return { sha: 'tree' }
      if (ruta.endsWith('/git/commits')) return { sha: 'commit' }
      if (ruta.endsWith('/git/refs')) return {}
      if (ruta.endsWith('/pulls')) return { number: 10, html_url: 'https://github.com/test/pull/10', user: { login: autor } }
      if (ruta.endsWith('/requested_reviewers')) return {}
      throw new Error(`Petición inesperada: ${metodo} ${ruta}`)
    },
  }
}

test('solo cambia el pin, preservando LF y CRLF; rechaza SHA y Dockerfile ambiguos', () => {
  for (const texto of [dockerfile, dockerfile.replaceAll('\n', '\r\n')]) {
    assert.equal(actualizarPin(texto, sha), texto.replace(viejo, sha))
  }
  assert.throws(() => actualizarPin(dockerfile, 'master'))
  assert.throws(() => actualizarPin('FROM python', sha))
  assert.throws(() => actualizarPin(dockerfile + dockerfile, sha))
})

test('crea un commit con un único archivo, rama nueva y PR con revisión, sin tocar master', async () => {
  const e = entorno()
  const r = await sincronizar({ ...e, sha, origen: FRONTEND })
  assert.equal(r.estado, 'creado')
  const tree = e.llamadas.find((c) => c.ruta.endsWith('/git/trees')).datos
  assert.deepEqual(tree.tree, [{ path: 'Dockerfile', mode: '100644', type: 'blob', sha: 'blob' }])
  const blob = e.llamadas.find((c) => c.ruta.endsWith('/git/blobs')).datos
  assert.equal(blob.content, dockerfile.replace(viejo, sha))
  const ref = e.llamadas.find((c) => c.ruta.endsWith('/git/refs')).datos.ref
  assert.equal(ref, `refs/heads/chore/frontend-${sha}`)
  assert(e.llamadas.some((c) => c.ruta.endsWith('/requested_reviewers')))
  assert(!e.llamadas.some((c) => c.metodo === 'PATCH' || c.ruta.endsWith('/merge')))
})

test('un reintento devuelve el PR existente sin duplicar escrituras', async () => {
  const e = entorno({ pulls: [{ state: 'open', html_url: 'existing' }] })
  assert.equal((await sincronizar({ ...e, sha, origen: FRONTEND })).estado, 'existente')
  assert(e.llamadas.every((c) => c.metodo === 'GET'))
})

test('un PR rechazado requiere intervención, no se recrea', async () => {
  const e = entorno({ pulls: [{ state: 'closed', merged_at: null, html_url: 'closed' }] })
  await assert.rejects(sincronizar({ ...e, sha, origen: FRONTEND }), /cerrado/)
})

test('un pin ya actualizado y un evento obsoleto no escriben al backend', async () => {
  const e = entorno({ texto: dockerfile.replace(viejo, sha) })
  assert.equal((await sincronizar({ ...e, sha, origen: FRONTEND })).estado, 'actualizado')
  assert(e.llamadas.every((c) => c.metodo === 'GET'))
  const antiguo = entorno({ head: viejo })
  assert.equal((await sincronizar({ ...antiguo, sha, origen: FRONTEND })).estado, 'omitido')
  assert.equal(antiguo.llamadas.length, 0)
})

test('rechaza un repositorio distinto y una rama de reintento con cambios ajenos', async () => {
  const e = entorno({ ramas: [{ ref: `refs/heads/chore/frontend-${sha}`, object: { sha: 'otro' } }] })
  await assert.rejects(sincronizar({ ...e, sha, origen: 'otro/repo' }), /oficial/)
  const backend = async (m, r, d) => r.includes('/compare/')
    ? { files: [{ filename: 'otro.txt' }] } : e.backend(m, r, d)
  await assert.rejects(sincronizar({ ...e, backend, sha, origen: FRONTEND }), /otros cambios/)
})

test('si el token pertenece a Lexim1 no intenta solicitar autorrevisión', async () => {
  const e = entorno({ autor: 'Lexim1' })
  await sincronizar({ ...e, sha, origen: FRONTEND })
  assert(!e.llamadas.some((c) => c.ruta.endsWith('/requested_reviewers')))
})
