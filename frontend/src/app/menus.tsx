import type { ReactNode } from 'react'
import type { Contadores } from '../types/tramite'
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
  /** Contador fijo de demostración, para pantallas que todavía no tienen datos. */
  contador?: number
  /** Contador calculado con los servicios; se actualiza después de cada acción. */
  contadorVivo?: keyof Contadores
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
      { ruta: '/sunass/alertas', texto: 'Alertas', icono: <IconoCampana />, contadorVivo: 'alertas' },
    ],
  },
  {
    titulo: 'Trámites',
    enlaces: [
      { ruta: '/sunass/te-toca', texto: 'Te toca actuar', icono: <IconoBandeja />, contadorVivo: 'te_toca' },
      { ruta: '/sunass/expedientes', texto: 'Expedientes', icono: <IconoLista /> },
      { ruta: '/sunass/recepcion', texto: 'Recepción de documentos', icono: <IconoBandeja />, contadorVivo: 'recepcion' },
      { ruta: '/sunass/por-resolver', texto: 'Por resolver', icono: <IconoMazo />, contador: 2 },
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
