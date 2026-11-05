import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { listSessions, fetchHistory, ApiError } from '../api/client'
import type { AttackFamily, HistoryItem } from '../types/api'
import './Ranking.css'

const ORDERED_FAMILIES: AttackFamily[] = [
  'instruction_override',
  'role_play_jailbreak',
  'delimiter_escape',
  'encoding_obfuscation',
  'context_exfiltration',
  'indirect_injection',
]

const FAM_LABEL: Record<string, string> = {
  instruction_override: 'Instruction Override',
  role_play_jailbreak: 'Role Play / Jailbreak',
  delimiter_escape: 'Delimiter Escape',
  encoding_obfuscation: 'Encoding / Obfuscation',
  context_exfiltration: 'Context Exfiltration',
  indirect_injection: 'Indirect Injection',
  benign: 'Benign',
}

type Filter = 'all' | 'blocked' | AttackFamily

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface RankedItem extends HistoryItem {
  sessionId: string
}

export default function TrendPage() {
  const { sessionId, messages } = useSessionStore()
  const assistantCount = messages.filter(m => m.role === 'assistant' && m.result).length
  const navigate = useNavigate()

  const [allItems, setAllItems] = useState<RankedItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        const sessions = await listSessions()
        if (cancelled) return

        const results = await Promise.all(
          sessions.map((s) =>
            fetchHistory(s.id, 100, 0)
              .then((r) => r.items.map((item) => ({ ...item, sessionId: s.id })))
              .catch(() => [] as RankedItem[]),
          ),
        )
        if (cancelled) return

        const merged = results.flat().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setAllItems(merged)
        setError(null)
      } catch (e) {
        if (cancelled) return
        const msg =
          e instanceof ApiError && (e.status === 0 || e.status >= 500)
            ? null
            : e instanceof Error ? e.message : 'Failed to load ranking data'
        setAllItems(null)
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAll()
    return () => { cancelled = true }
  }, [sessionId, assistantCount])

  const items = allItems ?? []

  const summary = useMemo(() => {
    const total = items.length
    const blocked = items.filter(
      (p) => p.verdict === 'BLOCKED' || p.verdict === 'BLOCK',
    ).length
    const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0
    const familyCounts: Partial<Record<AttackFamily, number>> = {}

    for (const p of items) {
      if (!(p.verdict === 'BLOCKED' || p.verdict === 'BLOCK')) continue
      if (p.attack_family && p.attack_family !== 'benign') {
        familyCounts[p.attack_family] = (familyCounts[p.attack_family] ?? 0) + 1
      }
    }

    const topFamily =
      (Object.entries(familyCounts) as [AttackFamily, number][])
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { total, blocked, blockRate, topFamily, familyCounts }
  }, [items])

  const rankedResults = useMemo(() => {
    return [...items].sort((a, b) => {
      const aBlocked = a.verdict === 'BLOCKED' || a.verdict === 'BLOCK'
      const bBlocked = b.verdict === 'BLOCKED' || b.verdict === 'BLOCK'
      if (aBlocked !== bBlocked) return aBlocked ? -1 : 1
      return b.confidence - a.confidence
    })
  }, [items])

  const filteredPoints = useMemo(() => {
    if (filter === 'all') return rankedResults
    if (filter === 'blocked')
      return rankedResults.filter((p) => p.verdict === 'BLOCKED' || p.verdict === 'BLOCK')
    return rankedResults.filter((p) => p.attack_family === filter)
  }, [rankedResults, filter])

  const rankedFamilies = useMemo(() => {
    return ORDERED_FAMILIES.map((fam) => {
      const count = summary.familyCounts[fam] ?? 0
      const rate = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0
      return { fam, count, rate }
    }).sort((a, b) => b.count - a.count)
  }, [summary])

  const filterOptions: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'blocked', label: 'Blocked only' },
    ...ORDERED_FAMILIES.map((f) => ({ key: f as Filter, label: FAM_LABEL[f] ?? f })),
  ]

  function handleResultClick(item: RankedItem) {
    navigate('/', { state: { scrollToId: item.id } })
  }

  return (
    <div className="trend-main">
      <div className="trend-wrap">

        {/* Header */}
        <div className="trend-head">
          <h1 className="trend-head__title">Ranking Table</h1>
          <div className="trend-head__summary">
            <b>{summary.total}</b> submitted · <b>{summary.blocked}</b> blocked ·{' '}
            <b>{summary.blockRate}%</b> block rate
            {summary.topFamily && (
              <> · top family <b>{FAM_LABEL[summary.topFamily] ?? summary.topFamily}</b></>
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

        {/* Detection Leaderboard */}
        <div>
          <p className="trend-section-label">Detection Results</p>
          {loading ? (
            <div className="trend-loading" aria-busy="true">Loading…</div>
          ) : filteredPoints.length === 0 ? (
            <div className="trend-empty">No data yet — submit some prompts to see rankings.</div>
          ) : (
            <div className="trend-leaderboard">
              <div className="trend-lb-head">
                <span>#</span>
                <span>Verdict &amp; Family</span>
                <span>Confidence</span>
                <span>Time</span>
              </div>
              {filteredPoints.map((item, idx) => {
                const isBlocked = item.verdict === 'BLOCKED' || item.verdict === 'BLOCK'
                const pct = Math.round(item.confidence * 100)
                const rawText = item.text ?? ''
                const preview = rawText.startsWith('[File:')
                  ? rawText.split('\n')[0].replace(/^\[File:\s*/, '📄 ').replace(/\]$/, '')
                  : rawText.slice(0, 70) + (rawText.length > 70 ? '…' : '')
                const isCurrentSession = item.sessionId === sessionId
                return (
                  <button
                    key={item.id}
                    className={`trend-lb-row trend-lb-row--${isBlocked ? 'blocked' : 'allow'}`}
                    onClick={() => handleResultClick(item)}
                    title={isCurrentSession ? 'Click to view in chat' : `Session ${item.sessionId.slice(0, 8)}`}
                  >
                    <span className="trend-lb-row__rank">{idx + 1}</span>
                    <span className="trend-lb-row__info">
                      <span className={`trend-lb-row__badge trend-lb-row__badge--${isBlocked ? 'blocked' : 'allow'}`}>
                        {isBlocked ? 'BLOCK' : 'ALLOW'}
                      </span>
                      <span className="trend-lb-row__family">
                        {FAM_LABEL[item.attack_family] ?? item.attack_family}
                        {!isCurrentSession && (
                          <span className="trend-lb-row__session-tag">
                            {item.sessionId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                      {preview && (
                        <span className="trend-lb-row__preview">{preview}</span>
                      )}
                    </span>
                    <span className="trend-lb-row__conf">
                      <span className="trend-lb-row__conf-bar-track">
                        <span
                          className={`trend-lb-row__conf-bar trend-lb-row__conf-bar--${isBlocked ? 'blocked' : 'allow'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="trend-lb-row__conf-pct">{pct}%</span>
                    </span>
                    <span className="trend-lb-row__time">
                      {timeAgo(item.created_at)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Family Attack Rankings */}
        {!loading && items.length > 0 && (
          <div>
            <p className="trend-section-label">Attack Family Rankings</p>
            <div className="trend-rank-table">
              <div className="trend-rank-table__head">
                <span>#</span>
                <span>Family</span>
                <span>Blocked</span>
                <span>% of total</span>
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
                      <span className="trend-rank-row__family">{FAM_LABEL[fam] ?? fam}</span>
                      <span className="trend-rank-row__sub">
                        {count} block{count !== 1 ? 's' : ''} across all sessions
                      </span>
                    </span>
                    <span className="trend-rank-row__count"
                      style={count === 0 ? { color: 'var(--color-text-subtle)' } : undefined}>
                      {count}
                    </span>
                    <span className={`trend-rank-row__rate${count > 0 ? ' trend-rank-row__rate--active' : ''}`}>
                      {`${rate}%`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && filteredPoints.length > 0 && filter !== 'all' && (
          <p className="trend-hint">
            Showing {filteredPoints.length} of {items.length} predictions
          </p>
        )}
      </div>
    </div>
  )
}
