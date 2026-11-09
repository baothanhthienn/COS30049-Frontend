import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { ClassifyResponse, HistoryResponse } from '../types/api'
import { listSessions, upsertSession, patchSession, deleteSession } from '../api/client'
import { normaliseFamily } from '../utils/normaliseFamily'

const SESSION_KEY = 'pid_session_id'
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id || !UUID_V4_RE.test(id)) {
    id = uuidv4()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  result?: ClassifyResponse
  groqReply?: string
  blockedReason?: string
  error?: string
  referenceId?: string
  createdAt: Date
}

export interface SessionMeta {
  id: string
  preview: string
  verdict?: 'BLOCKED' | 'ALLOW'
  createdAt: Date
}

interface SessionState {
  activeSessionId: string
  sessions: SessionMeta[]
  messages: ChatMessage[]
  historyLoaded: boolean
  sessionsLoaded: boolean
  theme: 'dark' | 'light'

  // alias kept for compatibility
  sessionId: string

  addUserMessage:     (text: string) => string
  addAssistantResult: (userMsgId: string, result: ClassifyResponse, groqReply?: string, blockedReason?: string) => void
  addAssistantError:  (userMsgId: string, error: string, referenceId?: string) => void
  loadHistory:        (history: HistoryResponse) => void
  loadRemoteSessions: () => Promise<void>
  newSession:         () => void
  switchToSession:    (id: string) => void
  clearMessages:      () => void
  resetSession:       () => void
  removeSession:      (id: string) => void
  toggleTheme:        () => void
}

const DEFAULT_THEME = 'light'
document.documentElement.dataset.theme = DEFAULT_THEME

const initialSessionId = getOrCreateSessionId()

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSessionId: initialSessionId,
  sessionId:       initialSessionId,
  sessions:        [],
  messages:        [],
  historyLoaded:   false,
  sessionsLoaded:  false,
  theme:           DEFAULT_THEME,

  loadRemoteSessions: async () => {
    try {
      const remote = await listSessions()
      const metas: SessionMeta[] = remote.map((s) => ({
        id:        s.id,
        preview:   s.preview,
        verdict:   s.last_verdict === 'BLOCK' ? 'BLOCKED' : s.last_verdict === 'ALLOW' ? 'ALLOW' : undefined,
        createdAt: new Date(s.created_at),
      }))
      set({ sessions: metas, sessionsLoaded: true })
    } catch {
      set({ sessionsLoaded: true })
    }
  },

  addUserMessage: (text) => {
    const id = uuidv4()
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', text, createdAt: new Date() }],
    }))

    const { activeSessionId, sessions } = get()
    const preview = text.startsWith('[File:')
      ? text.split('\n')[0].replace(/^\[File:\s*/, '').replace(/\]$/, '').slice(0, 40)
      : text.slice(0, 40)

    const existing = sessions.find((s) => s.id === activeSessionId)
    if (!existing) {
      const meta: SessionMeta = { id: activeSessionId, preview, createdAt: new Date() }
      set((s) => ({ sessions: [meta, ...s.sessions] }))
      upsertSession(activeSessionId, preview).catch(() => {})
    }
    return id
  },

  addAssistantResult: (_userMsgId, result, groqReply, blockedReason) => {
    const id = uuidv4()
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'assistant', text: '', result, groqReply, blockedReason, createdAt: new Date() },
      ],
    }))

    const { activeSessionId } = get()
    const normalised: 'BLOCKED' | 'ALLOW' =
      result.verdict === 'BLOCK' || result.verdict === 'BLOCKED' ? 'BLOCKED' : 'ALLOW'

    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === activeSessionId ? { ...sess, verdict: normalised } : sess,
      ),
    }))

    patchSession(activeSessionId, {
      last_verdict: normalised === 'BLOCKED' ? 'BLOCK' : 'ALLOW',
    }).catch(() => {})
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
    const msgs: ChatMessage[] = [...history.items].reverse().flatMap((item) => [
      {
        id:        `${item.id}-user`,
        role:      'user' as const,
        text:      item.text,
        createdAt: new Date(item.created_at),
      },
      {
        id:           item.id,
        role:         'assistant' as const,
        text:         '',
        result: {
          id:            item.id,
          verdict:       item.verdict,
          confidence:    item.confidence,
          attack_family: normaliseFamily(item.attack_family),
          family_scores: (item.family_scores ?? {}) as unknown as ClassifyResponse['family_scores'],
          trigger_spans: [],
          model_version: '',
          created_at:    item.created_at,
        } as ClassifyResponse,
        groqReply:    item.reply ?? undefined,
        blockedReason: item.blocked_reason ?? undefined,
        createdAt:    new Date(item.created_at),
      },
    ])
    set({ messages: msgs, historyLoaded: true })
  },

  newSession: () => {
    const id = uuidv4()
    sessionStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  switchToSession: (id) => {
    sessionStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  clearMessages: () => set({ messages: [] }),

  resetSession: () => {
    const id = uuidv4()
    sessionStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, sessionId: id, messages: [], historyLoaded: false })
  },

  removeSession: (id) => {
    const { sessions, activeSessionId } = get()
    const next = sessions.filter((s) => s.id !== id)
    set({ sessions: next })
    deleteSession(id).catch(() => {})

    if (id === activeSessionId) {
      const newId = uuidv4()
      sessionStorage.setItem(SESSION_KEY, newId)
      set({ activeSessionId: newId, sessionId: newId, messages: [], historyLoaded: false })
    }
  },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      return { theme: next }
    }),
}))
