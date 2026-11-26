import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AgenteProveedor } from '../agente/AgenteContexto'
import { RequiereSesion } from '../sesion/RequiereSesion'
import { SesionProveedor } from '../sesion/SesionProveedor'
import { Ingreso } from './Ingreso'
import { LayoutInterno } from './LayoutInterno'
import { LayoutSunass, SoloPerfil } from './LayoutSunass'
import { LayoutPublico } from './LayoutPublico'
import { MENU_EPS } from './menus'
import { NoEncontrada } from './NoEncontrada'
import { Expedientes } from '../pages/sunass/Expedientes'
import { Expediente } from '../pages/sunass/Expediente'
import { Recepcion } from '../pages/sunass/Recepcion'
import { Alertas } from '../pages/sunass/Alertas'
import { TeToca } from '../pages/sunass/TeToca'
import { Dashboard } from '../pages/sunass/Dashboard'
import { FichaEps } from '../pages/sunass/FichaEps'
import { ActosExternos, ResumenActo } from '../pages/sunass/ActosExternos'
import { Encargos } from '../pages/sunass/Encargos'
import { Reportes } from '../pages/sunass/Reportes'
import { Configuracion } from '../pages/sunass/Configuracion'
import { MisTramites } from '../pages/eps/MisTramites'
import { DetalleTramite } from '../pages/eps/DetalleTramite'
import { Respuesta } from '../pages/eps/Respuesta'
import { Decisiones } from '../pages/ciudadania/Decisiones'
import { Decision } from '../pages/ciudadania/Decision'

export function App() {
  return (
    <BrowserRouter>
      <SesionProveedor>
        <AgenteProveedor>
          <Routes>
            <Route index element={<Ingreso />} />

            <Route
              path="sunass"
              element={
                <RequiereSesion perfil="sunass">
                  <LayoutSunass />
                </RequiereSesion>
              }
            >
              <Route index element={<Navigate to="expedientes" replace />} />
              <Route path="expedientes" element={<Expedientes />} />
              <Route path="expedientes/:id" element={<Expediente />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="te-toca" element={<TeToca />} />
              <Route path="dashboard" element={<SoloPerfil ruta="dashboard"><Dashboard /></SoloPerfil>} />
              <Route path="ficha-eps" element={<FichaEps />} />
              <Route path="actos" element={<SoloPerfil ruta="actos"><ActosExternos /></SoloPerfil>} />
              <Route path="actos/:id" element={<SoloPerfil ruta="actos"><ResumenActo /></SoloPerfil>} />
              <Route path="encargos" element={<Encargos />} />
              <Route path="reportes" element={<SoloPerfil ruta="reportes"><Reportes /></SoloPerfil>} />
              <Route path="configuracion" element={<SoloPerfil ruta="configuracion"><Configuracion /></SoloPerfil>} />
              <Route path="recepcion" element={<SoloPerfil ruta="recepcion"><Recepcion /></SoloPerfil>} />
            </Route>

            <Route
              path="eps"
              element={
                <RequiereSesion perfil="eps">
                  <LayoutInterno vista="EPS" menu={MENU_EPS} />
                </RequiereSesion>
              }
            >
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
      </SesionProveedor>
    </BrowserRouter>
  )
}
