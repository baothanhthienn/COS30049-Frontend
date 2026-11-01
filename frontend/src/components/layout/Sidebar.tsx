import { Link, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import './Sidebar.css'

export default function Sidebar() {
  const { messages, sessionId, resetSession } = useSessionStore()
  const navigate = useNavigate()

  const history = messages
    .filter((m) => m.role === 'user')
    .slice()
    .reverse()
    .slice(0, 20)

  function handleNewAnalysis() {
    navigate('/')
  }

  function handleClearSession() {
    if (window.confirm('Clear session and all history? This cannot be undone.')) {
      resetSession()
      navigate('/')
    }
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
      </div>

      <nav className="sidebar__history" aria-label="Recent analyses">
        {history.length === 0 && (
          <p className="sidebar__empty">No analyses yet</p>
        )}
        {history.map((msg) => {
          const result = messages.find(
            (m) => m.role === 'assistant' && m.createdAt > msg.createdAt,
          )?.result
          return (
            <div key={msg.id} className="sidebar__item">
              {result && (
                <span
                  className={`sidebar__dot sidebar__dot--${result.verdict.toLowerCase()}`}
                  aria-hidden="true"
                />
              )}
              <span className="sidebar__preview">{msg.text.slice(0, 30)}</span>
            </div>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <Link to="/trend" className="sidebar__trend-link">
          Session trend →
        </Link>
        <div className="sidebar__session-chip">
          <span className="sidebar__session-id" title={sessionId}>
            {sessionId.slice(0, 8)}…
          </span>
          <button className="sidebar__clear-btn" onClick={handleClearSession}>
            Clear session
          </button>
        </div>
      </div>
    </aside>
  )
}
