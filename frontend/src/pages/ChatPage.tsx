import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { classify, fetchHistory, ApiError } from '../api/client'
import { useShortcuts } from '../hooks/useShortcuts'
import ChatFeed from '../components/chat/ChatFeed'
import ChatComposer from '../components/chat/ChatComposer'
import './ChatPage.css'

export default function ChatPage() {
  const { messages, sessionId, historyLoaded, addUserMessage, addAssistantResult, addAssistantError, loadHistory, resetSession } =
    useSessionStore()
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const location = useLocation()
  const [_focusedIdx, setFocusedIdx] = useState<number | null>(null)

  // Load chat history from the backend on first mount
  useEffect(() => {
    if (historyLoaded) return
    fetchHistory(sessionId, 50, 0)
      .then((data) => { if (data.items.length > 0) loadHistory(data) })
      .catch(() => { /* silently ignore — new session or backend unavailable */ })
  }, [sessionId, historyLoaded, loadHistory])

  // Scroll to a specific message when navigated from TrendPage
  useEffect(() => {
    const scrollToId = (location.state as { scrollToId?: string } | null)?.scrollToId
    if (!scrollToId) return
    const el = document.getElementById(`msg-${scrollToId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('chat-message--highlight')
      const t = setTimeout(() => el.classList.remove('chat-message--highlight'), 2000)
      return () => clearTimeout(t)
    }
  }, [location.state])

  const isLoading =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user'

  const runClassify = useCallback(
    async (text: string) => {
      const userMsgId = addUserMessage(text)
      try {
        const result = await classify(text, sessionId)
        addAssistantResult(userMsgId, result)
      } catch (err) {
        let msg = 'An unexpected error occurred. Please try again.'
        let refId: string | undefined
        if (err instanceof ApiError) {
          refId = err.referenceId || undefined
          if (err.status === 0 || err.status === 502 || err.status === 503) {
            msg = 'Could not reach the API. Check that the backend is running.'
          } else if (err.status >= 400) {
            msg = err.message
          }
        } else if (err instanceof Error) {
          msg = err.message
        }
        addAssistantError(userMsgId, msg, refId)
      } finally {
        composerRef.current?.focus()
      }
    },
    [sessionId, addUserMessage, addAssistantResult, addAssistantError],
  )

  const handleExampleClick = useCallback(
    (text: string) => {
      if (!isLoading) runClassify(text)
    },
    [isLoading, runClassify],
  )

  // J/K navigation: collect all pair elements in DOM order
  function scrollToPair(delta: number) {
    const pairEls = Array.from(document.querySelectorAll<HTMLElement>('[id^="msg-"]'))
    if (pairEls.length === 0) return
    setFocusedIdx((prev) => {
      const base = prev === null ? (delta > 0 ? -1 : pairEls.length) : prev
      const next = Math.max(0, Math.min(pairEls.length - 1, base + delta))
      pairEls[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return next
    })
  }

  useShortcuts({
    focusComposer: () => composerRef.current?.focus(),
    newAnalysis: () => { resetSession(); composerRef.current?.focus() },
    prevMessage: () => scrollToPair(-1),
    nextMessage: () => scrollToPair(1),
  })

  return (
    <div className="chat-page">
      <ChatFeed messages={messages} onExampleClick={handleExampleClick} />
      <ChatComposer onSubmit={runClassify} disabled={isLoading} composerRef={composerRef} />
    </div>
  )
}
