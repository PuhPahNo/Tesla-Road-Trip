import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { ThemeProvider } from './theme/theme.tsx'
import { ChargeQuestRouter } from './site/Router.tsx'

// The server includes crawlable page copy for browsers without JavaScript.
// Once React is ready, remove that fallback so the live DOM has one article tree.
document.querySelector('.seo-static-fallback')?.remove()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ChargeQuestRouter />
    </ThemeProvider>
  </StrictMode>,
)
