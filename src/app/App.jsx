import React from 'react'

import '../styles/shil-mobile-standard-v28.css'

export default function App() {
  return (
    <div className="app shil-app">

      {/* =========================
          HEADER
      ========================= */}

      <header className="mobile-header">

        <button
          type="button"
          className="header-action"
          onClick={() => window.history.back()}
        >
          ←
        </button>

        <div className="header-center">

          <img
            src="/logo.png"
            alt="SHIL"
            className="logo"
          />

        </div>

        <button
          type="button"
          className="header-action"
        >
          ☰
        </button>

      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="main-content">

        {/* Capsule */}

        <section className="card">

          <h2>
            سناریو های آماده
          </h2>

        </section>

        {/* 3x3 GRID */}

        <section className="steps-grid">

          <div className="step-card">
            <img src="/icons/solar.svg" alt="" />
            <span>آفگرید</span>
          </div>

          <div className="step-card">
            <img src="/icons/hybrid.svg" alt="" />
            <span>هیبرید</span>
          </div>

          <div className="step-card">
            <img src="/icons/ongrid.svg" alt="" />
            <span>آنگرید</span>
          </div>

          <div className="step-card">
            <img src="/icons/battery.svg" alt="" />
            <span>برق اضطراری</span>
          </div>

          <div className="step-card">
            <img src="/icons/factory.svg" alt="" />
            <span>صنعتی</span>
          </div>

          <div className="step-card">
            <img src="/icons/home.svg" alt="" />
            <span>خانگی</span>
          </div>

          <div className="step-card">
            <img src="/icons/pump.svg" alt="" />
            <span>پمپ خورشیدی</span>
          </div>

          <div className="step-card">
            <img src="/icons/light.svg" alt="" />
            <span>روشنایی</span>
          </div>

          <div className="step-card">
            <img src="/icons/future.svg" alt="" />
            <span>توسعه آینده</span>
          </div>

        </section>

      </main>

      {/* =========================
          FIXED FOOTER
      ========================= */}

      <footer className="mobile-footer">

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('shil:confirm-step')
            )
          }}
        >
          تایید مرحله
        </button>

        <button
          type="button"
          onClick={() => {
            localStorage.setItem(
              'shil_last_draft_save',
              new Date().toISOString()
            )

            window.dispatchEvent(
              new CustomEvent('shil:save-draft')
            )
          }}
        >
          ذخیره پیش‌نویس
        </button>

        <button
          type="button"
          onClick={() => {
            window.history.back()
          }}
        >
          مرحله قبل
        </button>

      </footer>

    </div>
  )
}