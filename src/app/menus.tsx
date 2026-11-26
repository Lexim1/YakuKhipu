import type { ReactNode } from 'react'
import { rolSunass, type RolSunass } from '../sesion/roles'
import type { Sesion } from '../types/sesion'
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

/** Cada enlace indica el permiso del backend que lo habilita y, para el modo de ejemplos, los perfiles que lo ven. */
type EnlaceSunass = EnlaceMenu & { permiso: string; roles: RolSunass[] }

const TODOS: RolSunass[] = ['analista_srt', 'coordinacion_dre', 'jefatura_dre']
const DRE: RolSunass[] = ['coordinacion_dre', 'jefatura_dre']

/** Menú SUNASS del Figma. Cada enlace indica qué perfiles lo ven («Archivo · fuera del perfil» en el Figma). */
const GRUPOS_SUNASS: { titulo: string; enlaces: EnlaceSunass[] }[] = [
  {
    titulo: 'General',
    enlaces: [
      { ruta: '/sunass/dashboard', texto: 'Dashboard', icono: <IconoGrafico />, permiso: 'dashboard.consultar', roles: DRE },
      { ruta: '/sunass/alertas', texto: 'Alertas', icono: <IconoCampana />, contadorVivo: 'alertas', permiso: 'alerta.consultar', roles: TODOS },
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
        permiso: 'bandeja.consultar',
        roles: TODOS,
      },
      { ruta: '/sunass/expedientes', texto: 'Expedientes', icono: <IconoLista />, permiso: 'expediente.consultar', roles: TODOS },
      {
        ruta: '/sunass/recepcion',
        texto: 'Recepción de documentos',
        icono: <IconoBandeja />,
        contadorVivo: 'recepcion',
        permiso: 'recepcion.gestionar',
        roles: DRE,
      },
      { ruta: '/sunass/actos', texto: 'Actos externos', icono: <IconoMazo />, permiso: 'acto_externo.registrar', roles: DRE },
    ],
  },
  {
    titulo: 'Seguimiento',
    enlaces: [
      { ruta: '/sunass/ficha-eps', texto: 'Ficha 360 de EPS', icono: <IconoEdificio />, permiso: 'ficha360.consultar', roles: TODOS },
      { ruta: '/sunass/encargos', texto: 'Encargos posteriores', icono: <IconoTarea />, permiso: 'encargo.consultar', roles: TODOS },
      { ruta: '/sunass/reportes', texto: 'Reportes', icono: <IconoArchivo />, permiso: 'reporte.consultar', roles: DRE },
    ],
  },
  {
    titulo: 'Sistema',
    enlaces: [
      { ruta: '/sunass/configuracion', texto: 'Configuración', icono: <IconoEngranaje />, permiso: 'configuracion.consultar', roles: ['jefatura_dre'] },
    ],
  },
]

/**
 * true si la sesión puede ver el enlace: con la API real manda la lista de permisos que entrega el backend
 * (la misma que exige en cada petición); en el modo de ejemplos, el rol.
 */
function puedeVer(enlace: EnlaceSunass, sesion: Sesion | null): boolean {
  if (sesion?.permisos) return sesion.permisos.includes(enlace.permiso)
  return enlace.roles.includes(rolSunass(sesion))
}

/** Menú SUNASS de la sesión: solo los enlaces permitidos, sin grupos vacíos. */
export function menuSunass(sesion: Sesion | null): GrupoMenu[] {
  return GRUPOS_SUNASS.map((g) => ({
    titulo: g.titulo,
    enlaces: g.enlaces.filter((e) => puedeVer(e, sesion)).map(({ roles: _roles, permiso: _permiso, ...enlace }) => enlace),
  })).filter((g) => g.enlaces.length > 0)
}

/** true si la ruta SUNASS (por ejemplo «dashboard») está permitida para la sesión. */
export function rutaPermitida(sesion: Sesion | null, ruta: string): boolean {
  return GRUPOS_SUNASS.some((g) => g.enlaces.some((e) => e.ruta === `/sunass/${ruta}` && puedeVer(e, sesion)))
}

export const MENU_EPS: GrupoMenu[] = [
  {
    titulo: 'Mi EPS',
    enlaces: [{ ruta: '/eps/tramites', texto: 'Mis trámites', icono: <IconoLista /> }],
  },
]
