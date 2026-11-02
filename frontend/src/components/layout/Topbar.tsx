import { useEffect, useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import './Topbar.css'

const MODEL_VERSION = import.meta.env.VITE_MODEL_VERSION || 'v1.0'
const RETRY_INTERVAL = 10

export default function Topbar() {
  const { theme, toggleTheme } = useSessionStore()
  const [offline, setOffline] = useState(!navigator.onLine)
  const [countdown, setCountdown] = useState(RETRY_INTERVAL)

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

  return (
    <>
      {offline && (
        <div className="topbar-offline" role="status" aria-live="polite">
          API offline. Retrying in {countdown}s.
        </div>
      )}
      <header className="topbar">
        <span className="topbar__title">Prompt Injection Detector</span>
        <div className="topbar__right">
          <span className="topbar__model" aria-label={`Model version ${MODEL_VERSION}`}>
            {MODEL_VERSION}
          </span>
          <button
            className="topbar__theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☽'}
          </button>
        </div>
      </header>
    </>
  )
}
