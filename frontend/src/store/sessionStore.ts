import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { ClassifyResponse } from '../types/api'

const SESSION_KEY = 'pid_session_id'

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  result?: ClassifyResponse
  error?: string
  createdAt: Date
}

interface SessionState {
  sessionId: string
  messages: ChatMessage[]
  theme: 'dark' | 'light'
  addUserMessage: (text: string) => string
  addAssistantResult: (userMsgId: string, result: ClassifyResponse) => void
  addAssistantError: (userMsgId: string, error: string) => void
  clearMessages: () => void
  resetSession: () => void
  toggleTheme: () => void
}

const DEFAULT_THEME = 'light'
document.documentElement.dataset.theme = DEFAULT_THEME

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: getOrCreateSessionId(),
  messages: [],
  theme: DEFAULT_THEME,

  addUserMessage: (text) => {
    const id = uuidv4()
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', text, createdAt: new Date() }],
    }))
    return id
  },

  addAssistantResult: (_userMsgId, result) => {
    const id = uuidv4()
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'assistant', text: '', result, createdAt: new Date() },
      ],
    }))
  },

  addAssistantError: (_userMsgId, error) => {
    const id = uuidv4()
    set((s) => ({
      messages: [...s.messages, { id, role: 'assistant', text: '', error, createdAt: new Date() }],
    }))
  },

  clearMessages: () => set({ messages: [] }),

  resetSession: () => {
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    set({ sessionId: id, messages: [] })
  },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      return { theme: next }
    }),
}))
