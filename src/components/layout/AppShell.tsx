import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Skeleton from '../ui/Skeleton'
import { useSessionStore } from '../../store/sessionStore'
import './AppShell.css'

function AppLoadingSkeleton() {
  return (
    <div className="app-shell">
      {/* Sidebar skeleton */}
      <div className="app-shell__sidebar-skeleton">
        <Skeleton width={120} height={32} radius="sm" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={36} radius="sm" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
      {/* Main area skeleton */}
      <div className="app-shell__main">
        <div className="app-shell__topbar-skeleton">
          <Skeleton width={160} height={18} radius="sm" />
          <Skeleton width={60} height={18} radius="sm" />
        </div>
        <div className="app-shell__feed-skeleton">
          <Skeleton width={260} height={22} radius="sm" style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Skeleton width={380} height={14} radius="sm" style={{ alignSelf: 'center', marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width={120} height={32} radius="full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { loadRemoteSessions, sessionsLoaded } = useSessionStore()

  useEffect(() => {
    if (!sessionsLoaded) loadRemoteSessions()
  }, [sessionsLoaded, loadRemoteSessions])

  if (!sessionsLoaded) return <AppLoadingSkeleton />

  return (
    <div className="app-shell">
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
