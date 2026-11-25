import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AgenteProveedor } from '../agente/AgenteContexto'
import { Inicio } from './Inicio'
import { LayoutInterno } from './LayoutInterno'
import { LayoutPublico } from './LayoutPublico'
import { MENU_EPS, MENU_SUNASS } from './menus'
import { NoEncontrada } from './NoEncontrada'
import { PaginaPendiente } from './PaginaPendiente'
import { Expedientes } from '../pages/sunass/Expedientes'
import { Expediente } from '../pages/sunass/Expediente'
import { Recepcion } from '../pages/sunass/Recepcion'
import { Alertas } from '../pages/sunass/Alertas'
import { MisTramites } from '../pages/eps/MisTramites'
import { DetalleTramite } from '../pages/eps/DetalleTramite'
import { Respuesta } from '../pages/eps/Respuesta'
import { Decisiones } from '../pages/ciudadania/Decisiones'
import { Decision } from '../pages/ciudadania/Decision'
import { ProveedorSesion } from './Sesion'
import { nombresRol, urlIngreso, useSesion } from './sesionEstado'
import type { ReactNode } from 'react'

const permisosVista: Record<string, string> = {
  dashboard: 'dashboard.consultar', alertas: 'alerta.consultar', 'te-toca': 'bandeja.consultar',
  expedientes: 'expediente.consultar', recepcion: 'recepcion.gestionar', 'por-resolver': 'acto_externo.registrar',
  'ficha-eps': 'ficha360.consultar', encargos: 'encargo.consultar', reportes: 'reporte.consultar',
  configuracion: 'configuracion.consultar', tramites: 'expediente.consultar',
}

function Autorizar({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { sesion } = useSesion()
  return sesion?.permisos.includes(permiso) ? children : <p role="alert">No tienes permiso para ver esta sección.</p>
}

function Area({ perfil }: { perfil: 'sunass' | 'eps' }) {
  const { sesion, error } = useSesion()
  if (sesion === undefined) return <p role="status">Comprobando sesión…</p>
  if (!sesion) return <main><p>{error || 'Inicia sesión para continuar.'}</p><a href={urlIngreso}>Iniciar sesión</a></main>
  if (sesion.perfil !== perfil) return <Navigate to={sesion.perfil === 'sunass' ? '/sunass' : '/eps'} replace />
  const menu = (perfil === 'sunass' ? MENU_SUNASS : MENU_EPS).map((grupo) => ({
    ...grupo, enlaces: grupo.enlaces.filter(({ ruta }) =>
      sesion.permisos.includes(permisosVista[ruta.split('/').at(-1) || ''])),
  })).filter(({ enlaces }) => enlaces.length > 0)
  return <LayoutInterno vista={perfil === 'sunass' ? 'SUNASS' : 'EPS'} perfil={nombresRol[sesion.rol_id]} menu={menu}
    rutaBusqueda={perfil === 'sunass' && sesion.permisos.includes('expediente.consultar') ? '/sunass/expedientes' : undefined}
    rutaAlertas={perfil === 'sunass' && sesion.permisos.includes('alerta.consultar') ? '/sunass/alertas' : undefined} />
}

/** Pantallas SUNASS del Figma que la guía todavía no asigna a una tarea. */
const SUNASS_SIN_ASIGNAR = [
  { ruta: 'dashboard', titulo: 'Dashboard' },
  { ruta: 'te-toca', titulo: 'Te toca actuar' },
  { ruta: 'por-resolver', titulo: 'Por resolver' },
  { ruta: 'ficha-eps', titulo: 'Ficha 360 de EPS' },
  { ruta: 'encargos', titulo: 'Encargos posteriores' },
  { ruta: 'reportes', titulo: 'Reportes' },
  { ruta: 'configuracion', titulo: 'Configuración' },
]

export function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
      <AgenteProveedor>
        <Routes>
          <Route index element={<Inicio />} />

          <Route
            path="sunass"
            element={<Area perfil="sunass" />}
          >
            <Route index element={<Navigate to="expedientes" replace />} />
            <Route path="expedientes" element={<Autorizar permiso="expediente.consultar"><Expedientes /></Autorizar>} />
            <Route path="expedientes/:id" element={<Autorizar permiso="expediente.consultar"><Expediente /></Autorizar>} />
            <Route path="recepcion" element={<Autorizar permiso="recepcion.gestionar"><Recepcion /></Autorizar>} />
            <Route path="alertas" element={<Autorizar permiso="alerta.consultar"><Alertas /></Autorizar>} />
            {SUNASS_SIN_ASIGNAR.map((p) => (
              <Route
                key={p.ruta}
                path={p.ruta}
                element={<Autorizar permiso={permisosVista[p.ruta]}><PaginaPendiente titulo={p.titulo} responsable="por asignar" /></Autorizar>}
              />
            ))}
          </Route>

          <Route path="eps" element={<Area perfil="eps" />}>
            <Route index element={<Navigate to="tramites" replace />} />
            <Route path="tramites" element={<Autorizar permiso="expediente.consultar"><MisTramites /></Autorizar>} />
            <Route path="tramites/:id" element={<Autorizar permiso="expediente.consultar"><DetalleTramite /></Autorizar>} />
            <Route path="tramites/:id/respuesta" element={<Autorizar permiso="eps.respuesta_informar"><Respuesta /></Autorizar>} />
          </Route>

          <Route path="ciudadania" element={<LayoutPublico />}>
            <Route index element={<Navigate to="decisiones" replace />} />
            <Route path="decisiones" element={<Decisiones />} />
            <Route path="decisiones/:id" element={<Decision />} />
          </Route>

          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </AgenteProveedor>
      </ProveedorSesion>
    </BrowserRouter>
  )
}
