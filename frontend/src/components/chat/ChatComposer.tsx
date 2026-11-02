import { useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import './ChatComposer.css'

const MAX_LEN = 10_000
const WARN_LEN = 9_500

interface Props {
  onSubmit: (text: string) => void
  disabled?: boolean
  composerRef?: RefObject<HTMLTextAreaElement | null>
}

export default function ChatComposer({ onSubmit, disabled = false, composerRef }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = composerRef ?? internalRef

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 8 * 24) + 'px'
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    if (val.length > MAX_LEN) return
    setText(val)
    setError(null)
    resize()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      setText('')
      setError(null)
      resize()
    }
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Enter a prompt to analyse.')
      return
    }
    onSubmit(trimmed)
    setText('')
    setError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  const overLimit = text.length >= MAX_LEN
  const nearLimit = text.length >= WARN_LEN

  return (
    <form className="composer" onSubmit={handleSubmit} aria-label="Prompt analyser">
      {error && (
        <p className="composer__error" role="alert" id="composer-error">
          {error}
        </p>
      )}
      <div className="composer__box">
        <textarea
          ref={textareaRef}
          className={`composer__textarea${error ? ' composer__textarea--invalid' : ''}`}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || overLimit}
          aria-label="Prompt text"
          aria-describedby={error ? 'composer-error' : undefined}
          aria-invalid={!!error}
          placeholder="Enter a prompt to check for injection…"
          rows={1}
        />
        <div className="composer__footer">
          <span
            className={`composer__counter ${nearLimit ? 'composer__counter--warn' : ''}`}
            aria-live="polite"
            aria-label={`${text.length} of ${MAX_LEN} characters`}
          >
            {text.length}/{MAX_LEN}
          </span>
          <button
            type="submit"
            className="composer__submit"
            disabled={disabled || !text.trim() || overLimit}
            aria-label="Analyse prompt"
          >
            ↑
          </button>
        </div>
      </div>
    </form>
  )
}
