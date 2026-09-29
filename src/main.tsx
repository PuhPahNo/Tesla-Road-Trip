import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { ThemeProvider } from './theme/theme.tsx'
import { ChargeQuestRouter } from './site/Router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ChargeQuestRouter />
    </ThemeProvider>
  </StrictMode>,
)
