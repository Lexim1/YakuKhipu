import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const FRONTEND = 'Lexim1/YakuKhipu'
export const BACKEND = 'Lexim1/YakuKhipu-Backend'

export function actualizarPin(texto, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('El SHA del frontend debe tener 40 caracteres hexadecimales.')
  const patron = /^ARG FRONTEND_COMMIT=[a-f0-9]{40}\r?$/gm
  if ([...texto.matchAll(patron)].length !== 1) throw new Error('Se esperaba un único FRONTEND_COMMIT en Dockerfile.')
  return texto.replace(patron, (linea) => `ARG FRONTEND_COMMIT=${sha}${linea.endsWith('\r') ? '\r' : ''}`)
}

export function clienteGitHub(token) {
  return async (metodo, ruta, datos) => {
    const respuesta = await fetch(`https://api.github.com${ruta}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: datos === undefined ? undefined : JSON.stringify(datos),
      signal: AbortSignal.timeout(30_000),
    })
    // No imprime headers, token ni respuestas que puedan contener datos privados.
    if (!respuesta.ok) throw new Error(`GitHub ${metodo} ${ruta}: HTTP ${respuesta.status}. Revisa permisos y reglas del repositorio.`)
    return respuesta.status === 204 ? null : respuesta.json()
  }
}

export async function sincronizar({ sha, origen, fuente, backend }) {
  if (origen !== FRONTEND) throw new Error('La automatización solo puede ejecutarse desde el frontend oficial.')
  actualizarPin(`ARG FRONTEND_COMMIT=${'0'.repeat(40)}`, sha)
  const ruta = `/repos/${BACKEND}`
  const actual = await fuente('GET', `/repos/${FRONTEND}/git/ref/heads/master`)
  if (actual.object.sha !== sha) return { estado: 'omitido', motivo: 'Existe una versión más reciente en frontend/master.' }

  const base = await backend('GET', `${ruta}/git/ref/heads/master`)
  const archivo = await backend('GET', `${ruta}/contents/Dockerfile?ref=${base.object.sha}`)
  const texto = Buffer.from(archivo.content, 'base64').toString('utf8')
  const nuevo = actualizarPin(texto, sha)
  if (nuevo === texto) return { estado: 'actualizado', motivo: 'El backend ya utiliza esta versión.' }
  const rama = `chore/frontend-${sha}`
  const pulls = await backend('GET', `${ruta}/pulls?state=all&head=Lexim1:${rama}&base=master`)
  if (pulls.length) {
    const pr = pulls[0]
    if (pr.state === 'closed' && !pr.merged_at) throw new Error(`El PR ${pr.html_url} fue cerrado. Reábrelo o revisa el rechazo; no se recrea automáticamente.`)
    return { estado: 'existente', url: pr.html_url }
  }

  // Reutiliza una rama de un intento interrumpido; nunca fuerza ni sobrescribe commits.
  const ramas = await backend('GET', `${ruta}/git/matching-refs/heads/${rama}`)
  const existente = ramas.find((r) => r.ref === `refs/heads/${rama}`)
  if (existente) {
    const diff = await backend('GET', `${ruta}/compare/${base.object.sha}...${existente.object.sha}`)
    const guardado = await backend('GET', `${ruta}/contents/Dockerfile?ref=${existente.object.sha}`)
    if (diff.files?.length !== 1 || diff.files[0].filename !== 'Dockerfile' ||
        Buffer.from(guardado.content, 'base64').toString('utf8') !== nuevo) {
      throw new Error('La rama existente contiene otros cambios. Requiere revisión manual.')
    }
  } else {
    const commitBase = await backend('GET', `${ruta}/git/commits/${base.object.sha}`)
    const blob = await backend('POST', `${ruta}/git/blobs`, { content: nuevo, encoding: 'utf-8' })
    const tree = await backend('POST', `${ruta}/git/trees`, {
      base_tree: commitBase.tree.sha,
      tree: [{ path: 'Dockerfile', mode: '100644', type: 'blob', sha: blob.sha }],
    })
    const commit = await backend('POST', `${ruta}/git/commits`, {
      message: `Actualizar frontend del portal a ${sha.slice(0, 7)}`,
      tree: tree.sha, parents: [base.object.sha],
    })
    await backend('POST', `${ruta}/git/refs`, { ref: `refs/heads/${rama}`, sha: commit.sha })
  }
  // Una ejecución antigua no debe proponer una versión que ya fue reemplazada.
  const vigente = await fuente('GET', `/repos/${FRONTEND}/git/ref/heads/master`)
  if (vigente.object.sha !== sha) return { estado: 'omitido', motivo: 'Frontend/master cambió durante la ejecución; se procesará su nuevo commit.' }
  const pr = await backend('POST', `${ruta}/pulls`, {
    title: `Actualizar frontend del portal a ${sha.slice(0, 7)}`,
    head: rama, base: 'master',
    body: `Actualiza únicamente FRONTEND_COMMIT del Dockerfile a ${sha}.\n\n` +
      `Frontend: https://github.com/${FRONTEND}/commit/${sha}\n\n` +
      'Validación previa: pruebas de sincronización, lint, contratos API y compilación React.\n\n' +
      'Revisión requerida: Lexim1. Verificar que este siga siendo el commit más reciente del frontend y cerrar los PR de sincronización anteriores que queden obsoletos.\n\n' +
      'Al fusionar, Railway debe desplegar portal desde backend/master. Comprobar el despliegue SUCCESS y abrir el portal. No se fusiona automáticamente.',
  })
  // GitHub impide solicitar a una persona revisar su propio PR.
  if (pr.user?.login !== 'Lexim1') {
    await backend('POST', `${ruta}/pulls/${pr.number}/requested_reviewers`, { reviewers: ['Lexim1'] })
  }
  return { estado: 'creado', url: pr.html_url }
}

async function main() {
  if (!process.env.BACKEND_PR_TOKEN) throw new Error('Falta el secreto BACKEND_PR_TOKEN en Actions del frontend. Consulta docs/sincronizacion_railway.md.')
  if (!process.env.FRONTEND_READ_TOKEN) throw new Error('Falta FRONTEND_READ_TOKEN para comprobar frontend/master.')
  const resultado = await sincronizar({ sha: process.env.FRONTEND_SHA, origen: process.env.GITHUB_REPOSITORY,
    fuente: clienteGitHub(process.env.FRONTEND_READ_TOKEN), backend: clienteGitHub(process.env.BACKEND_PR_TOKEN) })
  console.log(JSON.stringify(resultado))
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## Sincronización del portal\n\n${resultado.estado}: ${resultado.url ?? resultado.motivo}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
