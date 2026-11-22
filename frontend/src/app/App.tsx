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
      <AgenteProveedor>
        <Routes>
          <Route index element={<Inicio />} />

          <Route
            path="sunass"
            element={
              <LayoutInterno
                vista="SUNASS · Vista completa"
                perfil="Jefatura DRE"
                menu={MENU_SUNASS}
                rutaBusqueda="/sunass/expedientes"
                rutaAlertas="/sunass/alertas"
              />
            }
          >
            <Route index element={<Navigate to="expedientes" replace />} />
            <Route path="expedientes" element={<Expedientes />} />
            <Route path="expedientes/:id" element={<Expediente />} />
            <Route path="recepcion" element={<Recepcion />} />
            <Route path="alertas" element={<Alertas />} />
            {SUNASS_SIN_ASIGNAR.map((p) => (
              <Route
                key={p.ruta}
                path={p.ruta}
                element={<PaginaPendiente titulo={p.titulo} responsable="por asignar" />}
              />
            ))}
          </Route>

          <Route path="eps" element={<LayoutInterno vista="EPS" perfil="EPS (simulada)" menu={MENU_EPS} />}>
            <Route index element={<Navigate to="tramites" replace />} />
            <Route path="tramites" element={<MisTramites />} />
            <Route path="tramites/:id" element={<DetalleTramite />} />
            <Route path="tramites/:id/respuesta" element={<Respuesta />} />
          </Route>

          <Route path="ciudadania" element={<LayoutPublico />}>
            <Route index element={<Navigate to="decisiones" replace />} />
            <Route path="decisiones" element={<Decisiones />} />
            <Route path="decisiones/:id" element={<Decision />} />
          </Route>

          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </AgenteProveedor>
    </BrowserRouter>
  )
}
