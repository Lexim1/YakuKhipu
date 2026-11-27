import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from './Iconos'

interface Props {
  abierto: boolean
  titulo: string
  alCerrar: () => void
  children: ReactNode
  /** Panel a la derecha (accesibilidad, agente) en lugar de una ventana centrada. */
  lateral?: boolean
  /** Oculta la cabecera estándar cuando el contenido trae la suya. */
  sinCabecera?: boolean
}

/**
 * Ventana modal accesible basada en <dialog>: atrapa el foco, se cierra con Escape
 * y devuelve el foco al botón que la abrió.
 */
export function Dialogo({ abierto, titulo, alCerrar, children, lateral = false, sinCabecera = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const cerrar = () => { ref.current?.close(); alCerrar() }

  useLayoutEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
    return () => { if (dialogo.open) dialogo.close() }
  }, [abierto])

  return createPortal(
    <dialog
      ref={ref}
      className={lateral ? 'panel-lateral' : 'dialogo'}
      aria-label={titulo}
      onClose={() => { if (!ref.current?.open) alCerrar() }}
      onCancel={(e) => { e.preventDefault(); cerrar() }}
      onClick={(e) => {
        // Clic en el fondo oscuro: cerrar.
        if (e.target === ref.current) cerrar()
      }}
    >
      {abierto && (
        <>
          {!sinCabecera && (
            <div className="dialogo__cabecera">
              <h2>{titulo}</h2>
              <button type="button" className="dialogo__cerrar" onClick={cerrar} aria-label="Cerrar">
                <IconoCerrar tamano={16} />
              </button>
            </div>
          )}
          {children}
        </>
      )}
    </dialog>, document.body
  )
}
