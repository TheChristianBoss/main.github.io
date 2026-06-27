import React from 'react';
import { createRoot } from 'react-dom/client';
import ConverterApp from './ConverterApp.jsx';
import './converterStyles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConverterApp />
  </React.StrictMode>,
);
