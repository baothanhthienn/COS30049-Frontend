import axios from 'axios'
import type { ClassifyResponse, TrendResponse, HistoryResponse } from '../types/api'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30_000,
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message ?? err.message
    return Promise.reject(new Error(message))
  },
)

export async function classify(text: string, sessionId: string): Promise<ClassifyResponse> {
  const { data } = await http.post<ClassifyResponse>('/api/classify', {
    text,
    session_id: sessionId,
  })
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
