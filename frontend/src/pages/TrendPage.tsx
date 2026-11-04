import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import type { ChatMessage } from '../store/sessionStore'
import { fetchTrend, ApiError } from '../api/client'
import type { TrendPoint, AttackFamily } from '../types/api'
import { FAMILY_META } from '../components/trend/familyMeta'
import './TrendPage.css'

const ORDERED_FAMILIES: AttackFamily[] = [
  'instruction_override',
  'role_play_jailbreak',
  'delimiter_escape',
  'encoding_obfuscation',
  'context_exfiltration',
  'indirect_injection',
]

type Filter = 'all' | 'blocked' | AttackFamily

function buildLocalPoints(messages: ChatMessage[]): TrendPoint[] {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

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
    const blocked = points.filter(
      (p) => p.verdict === 'BLOCKED' || p.verdict === 'BLOCK',
    ).length
    const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0
    const familyCounts: Partial<Record<AttackFamily, number>> = {}
    for (const p of points) {
      if (p.verdict === 'BLOCKED' || p.verdict === 'BLOCK') {
        familyCounts[p.attack_family] = (familyCounts[p.attack_family] ?? 0) + 1
      }
    }
    const topFamily =
      (Object.entries(familyCounts) as [AttackFamily, number][])
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { total, blocked, blockRate, topFamily, familyCounts }
  }, [points])

  const filteredPoints = useMemo(() => {
    if (filter === 'all') return points
    if (filter === 'blocked') return points.filter((p) => p.verdict === 'BLOCKED' || p.verdict === 'BLOCK')
    return points.filter((p) => p.attack_family === filter)
  }, [points, filter])

  const rankedFamilies = useMemo(() => {
    return ORDERED_FAMILIES.map((fam) => {
      const count = summary.familyCounts[fam] ?? 0
      const rate = summary.blocked > 0 ? Math.round((count / summary.blocked) * 100) : 0
      return { fam, count, rate }
    }).sort((a, b) => b.count - a.count)
  }, [summary])

  function handlePointClick(point: TrendPoint) {
    navigate('/', { state: { scrollToId: point.id } })
  }
  void handlePointClick // used conditionally below

  const filterOptions: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'blocked', label: 'Blocked only' },
    ...ORDERED_FAMILIES.map((f) => ({ key: f as Filter, label: f })),
  ]

  return (
    <div className="trend-main">
      <div className="trend-wrap">
        {/* Header */}
        <div className="trend-head">
          <h1 className="trend-head__title">This session's results over time</h1>
          <div className="trend-head__summary">
            <b>{summary.total}</b> submitted · <b>{summary.blocked}</b> blocked ·{' '}
            <b>{summary.blockRate}%</b> block rate
            {summary.topFamily && (
              <> · top family <b>{summary.topFamily}</b></>
            )}
          </div>
        </div>

        {error && (
          <div className="trend-error" role="alert">{error}</div>
        )}

        {/* Filter chips */}
        <div className="trend-filter-chips">
          <span className="trend-filter-chips__label">Filter:</span>
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              className="trend-chip"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rank table */}
        {loading ? (
          <div className="trend-loading" aria-busy="true">Loading…</div>
        ) : points.length === 0 ? (
          <div className="trend-empty">No data yet — submit some prompts to see trends.</div>
        ) : (
          <div className="trend-rank-table">
            <div className="trend-rank-table__head">
              <span>#</span>
              <span>Family</span>
              <span>Blocked</span>
              <span>% of blocks</span>
            </div>
            {rankedFamilies.map(({ fam, count, rate }, idx) => {
              const dimmed = filter !== 'all' && filter !== 'blocked' && filter !== fam
              return (
                <div
                  key={fam}
                  className="trend-rank-row"
                  style={dimmed ? { opacity: 0.35 } : undefined}
                >
                  <span className="trend-rank-row__rank">{idx + 1}</span>
                  <span className="trend-rank-row__name">
                    <span className="trend-rank-row__family">{fam}</span>
                    <span className="trend-rank-row__sub">
                      {count} block{count !== 1 ? 's' : ''} this session
                    </span>
                  </span>
                  <span className="trend-rank-row__count"
                    style={count === 0 ? { color: 'var(--color-text-subtle)' } : undefined}>
                    {count}
                  </span>
                  <span className={`trend-rank-row__rate${count > 0 ? ' trend-rank-row__rate--active' : ''}`}>
                    {count > 0 ? `${rate}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary of filtered view */}
        {!loading && filteredPoints.length > 0 && filter !== 'all' && (
          <p className="trend-hint">
            Showing {filteredPoints.length} of {points.length} predictions
          </p>
        )}
      </div>
    </div>
  )
}
