import type { ReactNode } from 'react'
import type { RolSunass } from '../sesion/roles'
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

type EnlaceSunass = EnlaceMenu & { roles: RolSunass[] }

const TODOS: RolSunass[] = ['analista_srt', 'coordinacion_dre', 'jefatura_dre']
const DRE: RolSunass[] = ['coordinacion_dre', 'jefatura_dre']

/** Menú SUNASS del Figma. Cada enlace indica qué perfiles lo ven («Archivo · fuera del perfil» en el Figma). */
const GRUPOS_SUNASS: { titulo: string; enlaces: EnlaceSunass[] }[] = [
  {
    titulo: 'General',
    enlaces: [
      { ruta: '/sunass/dashboard', texto: 'Dashboard', icono: <IconoGrafico />, roles: DRE },
      { ruta: '/sunass/alertas', texto: 'Alertas', icono: <IconoCampana />, contadorVivo: 'alertas', roles: TODOS },
    ],
  },
  {
    titulo: 'Trámites',
    enlaces: [
      {
        ruta: '/sunass/te-toca',
        texto: 'Te toca actuar',
        icono: <IconoBandeja />,
        contadorVivo: 'te_toca',
        roles: TODOS,
      },
      { ruta: '/sunass/expedientes', texto: 'Expedientes', icono: <IconoLista />, roles: TODOS },
      {
        ruta: '/sunass/recepcion',
        texto: 'Recepción de documentos',
        icono: <IconoBandeja />,
        contadorVivo: 'recepcion',
        roles: DRE,
      },
      { ruta: '/sunass/actos', texto: 'Actos externos', icono: <IconoMazo />, roles: DRE },
    ],
  },
  {
    titulo: 'Seguimiento',
    enlaces: [
      { ruta: '/sunass/ficha-eps', texto: 'Ficha 360 de EPS', icono: <IconoEdificio />, roles: TODOS },
      { ruta: '/sunass/encargos', texto: 'Encargos posteriores', icono: <IconoTarea />, roles: TODOS },
      { ruta: '/sunass/reportes', texto: 'Reportes', icono: <IconoArchivo />, roles: DRE },
    ],
  },
  {
    titulo: 'Sistema',
    enlaces: [
      { ruta: '/sunass/configuracion', texto: 'Configuración', icono: <IconoEngranaje />, roles: ['jefatura_dre'] },
    ],
  },
]

/** Menú del perfil SUNASS: solo los enlaces de su ámbito, sin grupos vacíos. */
export function menuSunass(rol: RolSunass): GrupoMenu[] {
  return GRUPOS_SUNASS.map((g) => ({
    titulo: g.titulo,
    enlaces: g.enlaces.filter((e) => e.roles.includes(rol)).map(({ roles: _roles, ...enlace }) => enlace),
  })).filter((g) => g.enlaces.length > 0)
}

/** true si la ruta SUNASS (por ejemplo «dashboard») está en el menú del perfil. */
export function rutaPermitida(rol: RolSunass, ruta: string): boolean {
  return GRUPOS_SUNASS.some((g) => g.enlaces.some((e) => e.ruta === `/sunass/${ruta}` && e.roles.includes(rol)))
}

export const MENU_EPS: GrupoMenu[] = [
  {
    titulo: 'Mi EPS',
    enlaces: [{ ruta: '/eps/tramites', texto: 'Mis trámites', icono: <IconoLista /> }],
  },
]
