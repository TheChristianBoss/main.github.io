import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Fixed: this entry point (built for /tools/ats/) was incorrectly rendering
// ResumeBuilder instead of the ATS Checker's own App component.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
