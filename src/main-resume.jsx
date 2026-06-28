import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ResumeBuilder from './ResumeBuilder.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ResumeBuilder />
    </ErrorBoundary>
  </StrictMode>,
)
