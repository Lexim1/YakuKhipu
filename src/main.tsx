import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/componentes.css'
import './styles/sunass.css'
import './styles/ciudadania.css'
import './styles/eps.css'
import './styles/ficha.css'
import './styles/seguimiento.css'
import './styles/graficos.css'
import './styles/estilo-amable.css'
import { App } from './app/App'
import { activarRevelado } from './app/revelar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

activarRevelado()
