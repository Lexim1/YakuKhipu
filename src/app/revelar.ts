// Animación de entrada al hacer scroll: las tarjetas aparecen suavemente cuando llegan a la pantalla
// y sus gráficos se animan recién entonces. Si la persona pidió reducir el movimiento, no se hace nada.

const SELECTOR = '.principal .tarjeta, .publico__pagina .tarjeta, .saludo, .boleto, .semaforo__columna'

export function activarRevelado() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observador.unobserve(e.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )

  const preparar = () => {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.dataset.revela) return
      el.dataset.revela = '1'
      const hermanos = el.parentElement ? Array.from(el.parentElement.children) : []
      el.style.setProperty('--retraso', `${Math.min(hermanos.indexOf(el), 6) * 70}ms`)
      el.classList.add('revela')
      observador.observe(el)
    })
  }

  preparar()
  new MutationObserver(preparar).observe(document.body, { childList: true, subtree: true })
}
