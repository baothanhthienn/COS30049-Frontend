import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { fetchTrend, ApiError } from '../api/client'
import type { TrendPoint, AttackFamily } from '../types/api'
import { FAMILY_META } from '../components/trend/familyMeta'
import SessionTimeline from '../components/trend/SessionTimeline'
import BlockRateSparkline from '../components/trend/BlockRateSparkline'
import FamilyFilterChips from '../components/trend/FamilyFilterChips'
import './TrendPage.css'

const ALL_FAMILIES = Object.keys(FAMILY_META) as AttackFamily[]

function buildLocalPoints(messages: ReturnType<typeof useSessionStore>['messages']): TrendPoint[] {
  return messages
    .filter((m) => m.role === 'assistant' && m.result)
    .map((m) => ({
      id: m.id,
      created_at: m.createdAt.toISOString(),
      verdict: m.result!.verdict,
      confidence: m.result!.confidence,
      attack_family: m.result!.attack_family,
    }))
}

export default function TrendPage() {
  const { sessionId, messages } = useSessionStore()
  const navigate = useNavigate()

  const [remotePoints, setRemotePoints] = useState<TrendPoint[] | null>(null)
  const [loading, setLoading] = useState(true) // starts true; set false when fetch settles
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<AttackFamily>>(new Set(ALL_FAMILIES))

  useEffect(() => {
    let cancelled = false
    fetchTrend(sessionId).then(
      (r) => {
        if (cancelled) return
        setRemotePoints(r.points)
        setError(null)
        setLoading(false)
      },
      (e) => {
        if (cancelled) return
        const msg =
          e instanceof ApiError && (e.status === 0 || e.status >= 500)
            ? null
            : e instanceof Error ? e.message : 'Failed to load trend data'
        setRemotePoints(null)
        setError(msg)
        setLoading(false)
      },
    )
    return () => { cancelled = true }
  }, [sessionId])

  const localPoints = useMemo(() => buildLocalPoints(messages), [messages])
  const points: TrendPoint[] = remotePoints ?? localPoints

  const summary = useMemo(() => {
    const total = points.length
    const blocked = points.filter((p) => p.verdict === 'BLOCKED').length
    const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0
    const familyCounts: Partial<Record<AttackFamily, number>> = {}
    for (const p of points) {
      familyCounts[p.attack_family] = (familyCounts[p.attack_family] ?? 0) + 1
    }
    const topFamily = (Object.entries(familyCounts) as [AttackFamily, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { total, blocked, blockRate, topFamily }
  }, [points])

  function handlePointClick(point: TrendPoint) {
    // Navigate to chat and let the browser scroll to the matching message pair
    navigate('/', { state: { scrollToId: point.id } })
  }

  return (
    <div className="trend-page">
      <div className="trend-page__header">
        <h1 className="trend-page__title">Session trend</h1>
        {!loading && remotePoints && (
          <span className="trend-page__source">Live data</span>
        )}
      </div>

      {error && (
        <div className="trend-page__error" role="alert">{error}</div>
      )}

      {/* Summary stats */}
      <div className="trend-stats" aria-label="Session summary">
        <div className="trend-stat">
          <span className="trend-stat__value">{summary.total}</span>
          <span className="trend-stat__label">Total</span>
        </div>
        <div className="trend-stat trend-stat--blocked">
          <span className="trend-stat__value">{summary.blocked}</span>
          <span className="trend-stat__label">Blocked</span>
        </div>
        <div className="trend-stat trend-stat--benign">
          <span className="trend-stat__value">{summary.total - summary.blocked}</span>
          <span className="trend-stat__label">Benign</span>
        </div>
        <div className="trend-stat">
          <span className="trend-stat__value">{summary.blockRate}%</span>
          <span className="trend-stat__label">Block rate</span>
        </div>
        {summary.topFamily && (
          <div className="trend-stat">
            <span
              className="trend-stat__value trend-stat__value--family"
              style={{ color: FAMILY_META[summary.topFamily]?.color }}
            >
              {FAMILY_META[summary.topFamily]?.label ?? summary.topFamily}
            </span>
            <span className="trend-stat__label">Top family</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <BlockRateSparkline points={points} />

      {/* Filters */}
      {points.length > 0 && (
        <FamilyFilterChips active={activeFilters} onChange={setActiveFilters} />
      )}

      {/* Main scatter chart */}
      <div className="trend-page__chart-wrap">
        {loading ? (
          <div className="trend-page__loading" aria-busy="true">Loading…</div>
        ) : (
          <SessionTimeline
            points={points}
            activeFilters={activeFilters}
            onPointClick={handlePointClick}
          />
        )}
      </div>

      {points.length > 0 && (
        <p className="trend-page__hint">
          Click any point to jump to that message in the chat.
        </p>
      )}
    </div>
  )
}
