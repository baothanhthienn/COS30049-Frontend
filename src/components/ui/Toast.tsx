import { useEffect, useRef, useState } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  onClose?: () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 6000 }: ToastProps) {
  const [closing, setClosing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function dismiss() {
    setClosing(true)
  }

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [duration])

  function onAnimationEnd() {
    if (closing) onClose?.()
  }

  return (
    <div
      className={`toast-root toast${closing ? ' toast--closing' : ''}`}
      role="alert"
      aria-live="assertive"
      onAnimationEnd={onAnimationEnd}
    >
      <svg
        className="toast__icon"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M11 2.5L2 19.5h18L11 2.5Z"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="11" y1="9"
          x2="11" y2="14"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="11" cy="16.5" r="0.875" fill="white" />
      </svg>

      <span className="toast__body">
        <span className="toast__message">{message}</span>
      </span>

      {onClose && (
        <button
          className="toast__close"
          onClick={dismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  )
}
