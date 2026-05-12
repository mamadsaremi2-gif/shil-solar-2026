import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

/* =========================
   SHIL FINAL MOBILE ENGINE
========================= */

import './styles/shil-mobile-standard-v29.css'

/* =========================
   ROOT RENDER
========================= */

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)