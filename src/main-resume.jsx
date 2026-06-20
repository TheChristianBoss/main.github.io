import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ResumeBuilder from './ResumeBuilder.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ResumeBuilder />
  </StrictMode>,
)
