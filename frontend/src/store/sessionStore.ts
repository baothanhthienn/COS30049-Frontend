import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { ClassifyResponse, HistoryResponse } from '../types/api'

const SESSION_KEY = 'pid_session_id'
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id || !UUID_V4_RE.test(id)) {
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
  referenceId?: string
  createdAt: Date
}

interface SessionState {
  sessionId: string
  messages: ChatMessage[]
  theme: 'dark' | 'light'
  historyLoaded: boolean
  addUserMessage: (text: string) => string
  addAssistantResult: (userMsgId: string, result: ClassifyResponse) => void
  addAssistantError: (userMsgId: string, error: string, referenceId?: string) => void
  loadHistory: (history: HistoryResponse) => void
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
  historyLoaded: false,

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

  addAssistantError: (_userMsgId, error, referenceId) => {
    const id = uuidv4()
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'assistant', text: '', error, referenceId, createdAt: new Date() },
      ],
    }))
  },

  loadHistory: (history) => {
    const msgs: ChatMessage[] = []
    for (const item of [...history.items].reverse()) {
      msgs.push({
        id: `${item.id}-user`,
        role: 'user',
        text: item.text,
        createdAt: new Date(item.created_at),
      })
      msgs.push({
        id: item.id,
        role: 'assistant',
        text: '',
        result: {
          id: item.id,
          verdict: item.verdict,
          confidence: item.confidence,
          attack_family: item.attack_family,
          family_scores: {} as ClassifyResponse['family_scores'],
          trigger_spans: [],
          model_version: '',
          created_at: item.created_at,
        } as ClassifyResponse,
        createdAt: new Date(item.created_at),
      })
    }
    set({ messages: msgs, historyLoaded: true })
  },

  clearMessages: () => set({ messages: [] }),

  resetSession: () => {
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    set({ sessionId: id, messages: [], historyLoaded: false })
  },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      return { theme: next }
    }),
}))
