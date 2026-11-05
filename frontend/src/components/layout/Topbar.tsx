import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import './Topbar.css'

const MODEL_VERSION = import.meta.env.VITE_MODEL_VERSION || 'v1.0'
const RETRY_INTERVAL = 10

export default function Topbar() {
  const { theme, toggleTheme, activeSessionId, removeSession } = useSessionStore()
  const navigate = useNavigate()
  const [offline, setOffline] = useState(!navigator.onLine)
  const [countdown, setCountdown] = useState(RETRY_INTERVAL)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const on = () => { setOffline(false); setCountdown(RETRY_INTERVAL) }
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (!offline) return
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? RETRY_INTERVAL : c - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [offline])

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpen])

  function handleThemeToggle() {
    toggleTheme()
    setMenuOpen(false)
  }

  function handleDeleteSession() {
    setMenuOpen(false)
    if (window.confirm('Delete this session and all its history? This cannot be undone.')) {
      removeSession(activeSessionId)
      navigate('/trend')
    }
  }

  return (
    <>
      {offline && (
        <div className="topbar-offline" role="status" aria-live="polite">
          API offline. Retrying in {countdown}s.
        </div>
      )}
      <header className="topbar">
        <span className="topbar__logo">Prompt Injection Detector</span>
        <div className="topbar__right">
          <span className="topbar__model" aria-label={`Model version ${MODEL_VERSION}`}>
            {MODEL_VERSION}
          </span>

          <div className="topbar__more-wrap" ref={menuRef}>
            <button
              ref={triggerRef}
              className="topbar__more-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More options"
            >
              ···
            </button>

            {menuOpen && (
              <div className="topbar__menu" role="menu" aria-label="More options">
                <button
                  className="topbar__menu-item"
                  role="menuitem"
                  onClick={handleThemeToggle}
                >
                  <span className="topbar__menu-icon" aria-hidden="true">
                    {theme === 'dark' ? '☀' : '☽'}
                  </span>
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>

                <div className="topbar__menu-divider" role="separator" />

                <button
                  className="topbar__menu-item topbar__menu-item--danger"
                  role="menuitem"
                  onClick={handleDeleteSession}
                >
                  <span className="topbar__menu-icon" aria-hidden="true">⊗</span>
                  Delete session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
