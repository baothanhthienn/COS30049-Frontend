export interface ClassifyRequest {
  text: string
  session_id: string
}

export type AttackFamily =
  | 'instruction_override'
  | 'role_play_jailbreak'
  | 'delimiter_escape'
  | 'encoding_obfuscation'
  | 'context_exfiltration'
  | 'indirect_injection'
  | 'benign'

export type Verdict = 'BLOCKED' | 'ALLOW'

export interface TriggerSpan {
  start: number
  end: number
  weight: number
  family: AttackFamily
}

export interface FamilyScores {
  instruction_override: number
  role_play_jailbreak: number
  delimiter_escape: number
  encoding_obfuscation: number
  context_exfiltration: number
  indirect_injection: number
}

export interface ClassifyResponse {
  id: string
  verdict: Verdict
  attack_family: AttackFamily
  confidence: number
  trigger_spans: TriggerSpan[]
  family_scores: FamilyScores
  model_version: string
  created_at: string
}

export interface TrendPoint {
  id: string
  created_at: string
  verdict: Verdict
  confidence: number
  attack_family: AttackFamily
}

export interface FamilyCount {
  family: AttackFamily
  count: number
}

export interface TrendSummary {
  total: number
  blocked: number
  benign: number
  top_family: AttackFamily | null
  block_rate_rolling: number
  family_breakdown: FamilyCount[]
}

export interface TrendResponse {
  session_id: string
  points: TrendPoint[]
  summary: TrendSummary
}

export interface HistoryItem {
  id: string
  text: string
  verdict: Verdict
  attack_family: AttackFamily
  confidence: number
  created_at: string
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  code: string
  message: string
  reference_id: string
}
