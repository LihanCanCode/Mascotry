import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyStoredTheme } from './hooks/useTheme'
import './styles/tokens.css'
import './styles/app.css'

// Before the first paint, so a reader who chose dark does not get a flash of light.
applyStoredTheme()

const host = document.getElementById('root')
if (host === null) throw new Error('index.html has no #root to mount into')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
