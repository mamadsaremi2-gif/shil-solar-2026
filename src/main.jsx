import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './app/App.jsx'

import './styles/shil-mobile-standard-v28.css'

function GlobalMobileFooter() {
  const goBack = () => {
    window.history.back()
  }

  const saveDraft = () => {
    window.dispatchEvent(new CustomEvent('shil:save-draft'))
    localStorage.setItem('shil_last_draft_save', new Date().toISOString())
  }

  const confirmStep = () => {
    window.dispatchEvent(new CustomEvent('shil:confirm-step'))
  }

  return (
    <footer className="mobile-footer shil-global-footer">
      <button type="button" onClick={confirmStep}>
        تایید مرحله
      </button>

      <button type="button" onClick={saveDraft}>
        ذخیره پیش‌نویس
      </button>

      <button type="button" onClick={goBack}>
        مرحله قبل
      </button>
    </footer>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <GlobalMobileFooter />
  </React.StrictMode>
)