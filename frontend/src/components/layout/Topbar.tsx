import { useSessionStore } from '../../store/sessionStore'
import './Topbar.css'

export default function Topbar() {
  const { theme, toggleTheme } = useSessionStore()

  return (
    <header className="topbar">
      <span className="topbar__title">Prompt Injection Detector</span>
      <button
        className="topbar__theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? '☀' : '☽'}
      </button>
    </header>
  )
}
