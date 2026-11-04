import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { ClassifyResponse, HistoryResponse } from '../types/api'

const SESSION_KEY   = 'pid_session_id'
const SESSIONS_KEY  = 'pid_sessions'
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  result?: ClassifyResponse
  error?: string
  referenceId?: string
  createdAt: Date
}

export interface SessionMeta {
  id: string
  preview: string   // first user message text, truncated
  verdict?: 'BLOCKED' | 'ALLOW'
  createdAt: Date
}

interface SessionState {
  activeSessionId: string
  sessions: SessionMeta[]       
  messages: ChatMessage[]      
  historyLoaded: boolean
  theme: 'dark' | 'light'

  
  sessionId: string

  addUserMessage:     (text: string) => string
  addAssistantResult: (userMsgId: string, result: ClassifyResponse) => void
  addAssistantError:  (userMsgId: string, error: string, referenceId?: string) => void
  loadHistory:        (history: HistoryResponse) => void
  newSession:         () => void
  switchToSession:    (id: string) => void
  clearMessages:      () => void
  resetSession:       () => void
  removeSession:      (id: string) => void
  toggleTheme:        () => void
}

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id || !UUID_V4_RE.test(id)) {
    id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function loadSessions(): SessionMeta[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<{ id: string; preview: string; verdict?: string; createdAt: string }>
    return parsed.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })) as SessionMeta[]
  } catch {
    return []
  }
}

function saveSessions(sessions: SessionMeta[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

const DEFAULT_THEME = 'light'
document.documentElement.dataset.theme = DEFAULT_THEME

const initialSessionId = getOrCreateSessionId()
const initialSessions  = loadSessions()

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSessionId: initialSessionId,
  sessionId:       initialSessionId,
  sessions:        initialSessions,
  messages:        [],
  historyLoaded:   false,
  theme:           DEFAULT_THEME,

  addUserMessage: (text) => {
    const id = uuidv4()
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', text, createdAt: new Date() }],
    }))
    
    const { activeSessionId, sessions } = get()
    const existing = sessions.find((s) => s.id === activeSessionId)
    if (!existing) {
      const meta: SessionMeta = {
        id:        activeSessionId,
        preview:   text.slice(0, 40),
        createdAt: new Date(),
      }
      const next = [meta, ...sessions]
      saveSessions(next)
      set({ sessions: next })
    }
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
    
    const { activeSessionId, sessions } = get()
    const normalised: 'BLOCKED' | 'ALLOW' = (result.verdict === 'BLOCK' || result.verdict === 'BLOCKED') ? 'BLOCKED' : 'ALLOW'
    const next: SessionMeta[] = sessions.map((s) =>
      s.id === activeSessionId ? { ...s, verdict: normalised } : s,
    )
    saveSessions(next)
    set({ sessions: next })
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
        id:        `${item.id}-user`,
        role:      'user',
        text:      item.text,
        createdAt: new Date(item.created_at),
      })
      msgs.push({
        id:   item.id,
        role: 'assistant',
        text: '',
        result: {
          id:             item.id,
          verdict:        item.verdict,
          confidence:     item.confidence,
          attack_family:  item.attack_family,
          family_scores:  {} as ClassifyResponse['family_scores'],
          trigger_spans:  [],
          model_version:  '',
          created_at:     item.created_at,
        } as ClassifyResponse,
        createdAt: new Date(item.created_at),
      })
    }
    set({ messages: msgs, historyLoaded: true })
  },

  newSession: () => {
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  switchToSession: (id) => {
    localStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  clearMessages: () => set({ messages: [] }),

  resetSession: () => {
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  removeSession: (id) => {
    const { sessions, activeSessionId } = get()
    const next = sessions.filter((s) => s.id !== id)
    saveSessions(next)
    if (id === activeSessionId) {
      const newId = uuidv4()
      localStorage.setItem(SESSION_KEY, newId)
      set({ sessions: next, activeSessionId: newId, sessionId: newId, messages: [], historyLoaded: false })
    } else {
      set({ sessions: next })
    }
  },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      return { theme: next }
    }),
}))
