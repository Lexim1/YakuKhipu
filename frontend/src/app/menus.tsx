import type { ReactNode } from 'react'
import {
  IconoArchivo,
  IconoBandeja,
  IconoCampana,
  IconoEdificio,
  IconoEngranaje,
  IconoGrafico,
  IconoLista,
  IconoMazo,
  IconoTarea,
} from '../components/Iconos'

export interface EnlaceMenu {
  ruta: string
  texto: string
  icono: ReactNode
  /** Contador de pendientes. Valores de demostración hasta que el backend los entregue. */
  contador?: number
}

export interface GrupoMenu {
  titulo: string
  enlaces: EnlaceMenu[]
}

export const MENU_SUNASS: GrupoMenu[] = [
  {
    titulo: 'General',
    enlaces: [
      { ruta: '/sunass/dashboard', texto: 'Dashboard', icono: <IconoGrafico /> },
      { ruta: '/sunass/alertas', texto: 'Alertas', icono: <IconoCampana /> },
    ],
  },
  {
    titulo: 'Trámites',
    enlaces: [
      { ruta: '/sunass/te-toca', texto: 'Te toca actuar', icono: <IconoBandeja /> },
      { ruta: '/sunass/expedientes', texto: 'Expedientes', icono: <IconoLista /> },
      { ruta: '/sunass/recepcion', texto: 'Recepción de documentos', icono: <IconoBandeja /> },
      { ruta: '/sunass/por-resolver', texto: 'Por resolver', icono: <IconoMazo /> },
    ],
  },
  {
    titulo: 'Seguimiento',
    enlaces: [
      { ruta: '/sunass/ficha-eps', texto: 'Ficha 360 de EPS', icono: <IconoEdificio /> },
      { ruta: '/sunass/encargos', texto: 'Encargos posteriores', icono: <IconoTarea /> },
      { ruta: '/sunass/reportes', texto: 'Reportes', icono: <IconoArchivo /> },
    ],
  },
  {
    titulo: 'Sistema',
    enlaces: [{ ruta: '/sunass/configuracion', texto: 'Configuración', icono: <IconoEngranaje /> }],
  },
]

export const MENU_EPS: GrupoMenu[] = [
  {
    titulo: 'Mi EPS',
    enlaces: [{ ruta: '/eps/tramites', texto: 'Mis trámites', icono: <IconoLista /> }],
  },
]
