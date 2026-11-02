import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './AppShell.css'

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* desktop sidebar — no onClose so ✕ button stays hidden */}
      <Sidebar />

      {drawerOpen && (
        <div
          className="app-shell__drawer-overlay"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* mobile drawer — only mounted when open to avoid duplicate aside landmark */}
      {drawerOpen && (
        <div className="app-shell__sidebar-drawer app-shell__sidebar-drawer--open">
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </div>
      )}

      <div className="app-shell__main">
        <div className="app-shell__mobile-bar">
          <button
            className="app-shell__hamburger"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
        </div>
        <Topbar />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
