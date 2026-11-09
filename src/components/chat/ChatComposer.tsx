import React, { useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { extractText, ACCEPT } from '../../utils/fileExtract'
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
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setExtracting(true)
    setError(null)
    try {
      const content = await extractText(file)
      if (!content.trim()) {
        setError('File appears to be empty or could not be read.')
        return
      }
      setAttachedFile({ name: file.name, content })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file.')
    } finally {
      setExtracting(false)
    }
  }

  function removeAttachment() {
    setAttachedFile(null)
    setError(null)
  }

  function submit() {
    const combined = [attachedFile?.content, text.trim()].filter(Boolean).join('\n\n')
    if (!combined) {
      setError('Enter a prompt or attach a file to analyse.')
      return
    }
    onSubmit(combined)
    setText('')
    setAttachedFile(null)
    setError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    submit()
  }

  const overLimit = text.length >= MAX_LEN
  const nearLimit = text.length >= WARN_LEN
  const hasContent = !!text.trim() || !!attachedFile

  return (
    <form className="composer" onSubmit={handleSubmit} aria-label="Prompt analyser">
      {error && (
        <p className="composer__error" role="alert" id="composer-error">
          {error}
        </p>
      )}
      <div className="composer__box">
        {attachedFile && (
          <div className="composer__attachment">
            <span className="composer__attachment-icon" aria-hidden="true">📄</span>
            <span className="composer__attachment-name">{attachedFile.name}</span>
            <button
              type="button"
              className="composer__attachment-remove"
              onClick={removeAttachment}
              aria-label={`Remove ${attachedFile.name}`}
            >
              ×
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className={`composer__textarea${error ? ' composer__textarea--invalid' : ''}`}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || overLimit || extracting}
          id="composer-prompt"
          name="prompt"
          autoComplete="off"
          aria-label="Prompt text"
          aria-describedby={error ? 'composer-error' : undefined}
          aria-invalid={!!error}
          placeholder={attachedFile ? 'Add an optional note…' : 'Enter a prompt to check for injection…'}
          rows={1}
        />
        <div className="composer__footer">
          <div className="composer__footer-left">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="composer__file-input"
              aria-label="Attach file"
              onChange={handleFileChange}
              disabled={disabled || extracting}
            />
            <button
              type="button"
              className="composer__attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || extracting}
              aria-label="Attach file (PDF, Markdown, CSV, XLSX, DOCX)"
              title="Attach file"
            >
              {extracting ? (
                <span className="composer__attach-spinner" aria-hidden="true" />
              ) : (
                '+'
              )}
            </button>
            <span
              className={`composer__counter ${nearLimit ? 'composer__counter--warn' : ''}`}
              aria-live="polite"
              aria-label={`${text.length} of ${MAX_LEN} characters`}
            >
              {text.length}/{MAX_LEN}
            </span>
          </div>
          <button
            type="submit"
            className="composer__submit"
            disabled={disabled || !hasContent || overLimit || extracting}
            aria-label="Analyse prompt"
          >
            ↑
          </button>
        </div>
      </div>
    </form>
  )
}
