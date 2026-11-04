import axios from 'axios'
import type { ClassifyRequest, ClassifyResponse, TrendResponse, HistoryResponse, SessionMeta } from '../types/api'

export class ApiError extends Error {
  code: string
  referenceId: string
  status: number

  constructor(message: string, code: string, referenceId: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.referenceId = referenceId
    this.status = status
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10_000,
  headers: {
    ...(import.meta.env.VITE_API_KEY ? { 'X-API-Key': import.meta.env.VITE_API_KEY } : {}),
  },
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const errBody = err.response?.data?.error
    const message = errBody?.message ?? err.message
    const code = errBody?.code ?? 'UNKNOWN'
    const referenceId = errBody?.reference_id ?? ''
    const status = err.response?.status ?? 0
    return Promise.reject(new ApiError(message, code, referenceId, status))
  },
)

export async function classify(text: string, sessionId: string): Promise<ClassifyResponse> {
  const body: ClassifyRequest = { text, session_id: sessionId }
  const { data } = await http.post<ClassifyResponse>('/api/classify', body)
  return data
}

export async function fetchTrend(sessionId: string): Promise<TrendResponse> {
  const { data } = await http.get<TrendResponse>(`/api/sessions/${sessionId}/trend`)
  return data
}

export async function fetchHistory(
  sessionId: string,
  limit = 20,
  offset = 0,
): Promise<HistoryResponse> {
  const { data } = await http.get<HistoryResponse>(`/api/sessions/${sessionId}/history`, {
    params: { limit, offset },
  })
  return data
}

export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`/api/sessions/${sessionId}`)
}

export async function getHealth(): Promise<{ status: string }> {
  const { data } = await http.get<{ status: string }>('/api/health')
  return data
}

export async function listSessions(): Promise<SessionMeta[]> {
  const { data } = await http.get<SessionMeta[]>('/api/sessions')
  return data
}

export async function upsertSession(id: string, preview: string): Promise<SessionMeta> {
  const { data } = await http.post<SessionMeta>('/api/sessions', { id, preview })
  return data
}

export async function patchSession(
  id: string,
  patch: { preview?: string; last_verdict?: string },
): Promise<SessionMeta> {
  const { data } = await http.patch<SessionMeta>(`/api/sessions/${id}`, patch)
  return data
}
