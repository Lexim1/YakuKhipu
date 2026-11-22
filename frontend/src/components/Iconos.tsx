import type { ReactNode } from 'react'

// Íconos de línea al estilo del Figma. Son decorativos: el texto que los acompaña da el significado.

interface Props {
  tamano?: number
}

function Base({ tamano = 18, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function IconoBuscar(p: Props) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  )
}

export function IconoCampana(p: Props) {
  return (
    <Base {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </Base>
  )
}

export function IconoPersonas(p: Props) {
  return (
    <Base {...p}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9" />
    </Base>
  )
}

export function IconoAbajo(p: Props) {
  return (
    <Base {...p}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  )
}

export function IconoAccesibilidad(p: Props) {
  return (
    <Base {...p}>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M5 8l7 1.5L19 8M12 9.5V14l-3 7M12 14l3 7" />
    </Base>
  )
}

export function IconoGrafico(p: Props) {
  return (
    <Base {...p}>
      <path d="M3 3v18h18M7 16v-4M11 16V8M15 16v-6M19 16V5" />
    </Base>
  )
}

export function IconoBandeja(p: Props) {
  return (
    <Base {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" />
    </Base>
  )
}

export function IconoLista(p: Props) {
  return (
    <Base {...p}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Base>
  )
}

export function IconoMazo(p: Props) {
  return (
    <Base {...p}>
      <path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8" />
    </Base>
  )
}

export function IconoEdificio(p: Props) {
  return (
    <Base {...p}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" />
    </Base>
  )
}

export function IconoTarea(p: Props) {
  return (
    <Base {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  )
}

export function IconoArchivo(p: Props) {
  return (
    <Base {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3" />
    </Base>
  )
}

export function IconoEngranaje(p: Props) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Base>
  )
}

export function IconoAtras(p: Props) {
  return (
    <Base {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Base>
  )
}

export function IconoFlecha(p: Props) {
  return (
    <Base {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  )
}

export function IconoChispa(p: Props) {
  return (
    <Base {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
    </Base>
  )
}

export function IconoDocumento(p: Props) {
  return (
    <Base {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6" />
    </Base>
  )
}

export function IconoAlerta(p: Props) {
  return (
    <Base {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />
    </Base>
  )
}

export function IconoOjo(p: Props) {
  return (
    <Base {...p}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}

export function IconoCheck(p: Props) {
  return (
    <Base {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  )
}

export function IconoCerrar(p: Props) {
  return (
    <Base {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  )
}

export function IconoEnviar(p: Props) {
  return (
    <Base {...p}>
      <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />
    </Base>
  )
}

export function IconoEnlace(p: Props) {
  return (
    <Base {...p}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Base>
  )
}
