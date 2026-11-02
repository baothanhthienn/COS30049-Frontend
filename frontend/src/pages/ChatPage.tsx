import { useCallback, useRef } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { classify, ApiError } from '../api/client'
import ChatFeed from '../components/chat/ChatFeed'
import ChatComposer from '../components/chat/ChatComposer'
import './ChatPage.css'

export default function ChatPage() {
  const { messages, sessionId, addUserMessage, addAssistantResult, addAssistantError } =
    useSessionStore()
  const composerRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className="chat-page">
      <ChatFeed messages={messages} onExampleClick={handleExampleClick} onRetry={runClassify} />
      <ChatComposer onSubmit={runClassify} disabled={isLoading} composerRef={composerRef} />
    </div>
  )
}
