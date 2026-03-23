import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { injectGlobalStyles } from './styles/global.ts'
import App from './App.tsx'

// Apply theme before React renders to avoid a flash of wrong theme
const _stored = localStorage.getItem('theme')
const _systemLight = window.matchMedia('(prefers-color-scheme: light)').matches
document.documentElement.dataset.theme =
  _stored === 'light' || (_stored === null && _systemLight) ? 'light' : 'dark'

injectGlobalStyles()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
