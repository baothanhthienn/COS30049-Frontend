import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { classify, ApiError } from '../../api/client'
import { extractText, ACCEPT } from '../../utils/fileExtract'
import './Sidebar.css'

interface Props {
  onClose?: () => void
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Sidebar({ onClose }: Props) {
  const { sessions, activeSessionId, sessionId, newSession, switchToSession, removeSession, addUserMessage, addAssistantResult, addAssistantError } =
    useSessionStore()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

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

  function handleClear() {
    if (window.confirm('Remove this session from the sidebar? This cannot be undone.')) {
      removeSession(activeSessionId)
      navigate('/')
      onClose?.()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    navigate('/')
    onClose?.()
    let text: string
    try {
      text = await extractText(file)
    } catch (err) {
      addAssistantError('', err instanceof Error ? err.message : 'Failed to read file')
      setUploading(false)
      return
    }
    if (!text.trim()) {
      addAssistantError('', 'File appears to be empty.')
      setUploading(false)
      return
    }
    const label = `[File: ${file.name}]\n${text.slice(0, 10_000)}`
    const userMsgId = addUserMessage(label)
    try {
      const result = await classify(label, sessionId)
      addAssistantResult(userMsgId, result)
    } catch (err) {
      let msg = 'An unexpected error occurred.'
      if (err instanceof ApiError) {
        msg = err.status === 0 || err.status >= 502
          ? 'Could not reach the API. Check that the backend is running.'
          : err.message
      } else if (err instanceof Error) {
        msg = err.message
      }
      addAssistantError(userMsgId, msg)
    } finally {
      setUploading(false)
    }
  }

  const isTrend = location.pathname === '/trend'

  return (
    <aside className="sidebar">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* New analysis button */}
      <div className="sidebar__top">
        <button
          className="sidebar__new-btn"
          onClick={handleNewAnalysis}
          aria-label="New analysis (⌘⇧O)"
        >
          + New analysis
          <span className="sidebar__new-kbd" aria-hidden="true">⌘⇧O</span>
        </button>
        <button
          className={`sidebar__upload-btn${uploading ? ' sidebar__upload-btn--loading' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload file for analysis"
          disabled={uploading}
          title="Upload PDF, MD, DOCX, CSV or XLSX for injection scan"
        >
          {uploading ? '…' : '+'}
        </button>
        {onClose && (
          <button className="sidebar__close-btn" onClick={onClose} aria-label="Close navigation">
            ✕
          </button>
        )}
      </div>

      {/* Recent label */}
      <div className="sidebar__section-label">Recent</div>

      {/* Session list */}
      <div className="sidebar__list">
        {sessions.length === 0 && (
          <p className="sidebar__empty">No analyses yet.</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`sidebar__item${session.id === activeSessionId ? ' sidebar__item--active' : ''}`}
            onClick={() => handleSwitchSession(session.id)}
            title={session.preview}
          >
            <span
              className={`sidebar__dot sidebar__dot--${
                session.verdict === 'BLOCKED' ? 'blocked' :
                session.verdict === 'ALLOW'   ? 'benign'  : 'none'
              }`}
              aria-hidden="true"
            />
            <span className="sidebar__item-text">{session.preview || 'New session'}</span>
            <span className="sidebar__item-time">{timeAgo(session.createdAt)}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="sidebar__divider" />

      {/* Nav links */}
      <Link
        to="/trend"
        className={`sidebar__link${isTrend ? ' sidebar__link--active' : ''}`}
        onClick={onClose}
      >
        <span>Session trend</span>
        <span className="sidebar__link-arrow">→</span>
      </Link>
      <Link
        to="/about"
        className="sidebar__link"
        onClick={onClose}
      >
        <span>About</span>
        <span className="sidebar__link-arrow">→</span>
      </Link>

      {/* Footer */}
      <div className="sidebar__footer">
        <span className="sidebar__footer-id">
          session · {(sessionId ?? activeSessionId).slice(0, 8)}
        </span>
        <button className="sidebar__footer-clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </aside>
  )
}
