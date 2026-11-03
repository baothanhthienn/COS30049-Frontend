import { Link, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import './Sidebar.css'

interface Props {
  onClose?: () => void
}

export default function Sidebar({ onClose }: Props) {
  const { sessions, activeSessionId, newSession, switchToSession } = useSessionStore()
  const navigate = useNavigate()

  function handleNewAnalysis() {
    newSession()
    navigate('/')
    onClose?.()
  }

  function handleSwitchSession(id: string) {
    switchToSession(id)
    navigate('/')
    onClose?.()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <button
          className="sidebar__new-btn"
          onClick={handleNewAnalysis}
          aria-label="New analysis (⌘⇧O)"
        >
          <span aria-hidden="true">+</span> New analysis
        </button>
        {onClose && (
          <button className="sidebar__close-btn" onClick={onClose} aria-label="Close navigation">
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar__history" aria-label="Recent analyses">
        {sessions.length === 0 && (
          <p className="sidebar__empty">No analyses yet</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`sidebar__item${session.id === activeSessionId ? ' sidebar__item--active' : ''}`}
            onClick={() => handleSwitchSession(session.id)}
            title={session.preview}
          >
            <span
              className={`sidebar__dot sidebar__dot--${(session.verdict ?? 'none').toLowerCase()}`}
              aria-hidden="true"
            />
            <span className="sidebar__preview">{session.preview || 'New session'}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <Link to="/trend" className="sidebar__trend-link" onClick={onClose}>
          Session trend →
        </Link>
        <div className="sidebar__session-chip">
          <span className="sidebar__session-id" title={activeSessionId}>
            {activeSessionId.slice(0, 8)}…
          </span>
        </div>
      </div>
    </aside>
  )
}
