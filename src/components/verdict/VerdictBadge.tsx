import type { Verdict } from '../../types/api'
import './VerdictBadge.css'

interface Props {
  verdict: Verdict
  confidence: number
}

const CELLS = 10

export default function VerdictBadge({ verdict, confidence }: Props) {
  const filled = Math.round(confidence * CELLS)
  const isBlocked = verdict === 'BLOCKED' || verdict === 'BLOCK'
  const color = isBlocked ? '#e5534b' : 'var(--color-benign)'
  const label = isBlocked ? 'BLOCKED' : 'ALLOW'

  return (
    <div className="verdict-badge-row">
      <span
        className={`verdict-badge verdict-badge--${isBlocked ? 'blocked' : 'allow'}`}
        aria-label={`Verdict: ${label}`}
      >
        {label}
      </span>
      <span className="verdict-conf">
        <span className="verdict-conf__num">{(confidence * 100).toFixed(0)}%</span>
        <span
          className="conf-meter"
          aria-label={`Confidence ${Math.round(confidence * 100)}%`}
          role="meter"
          aria-valuenow={Math.round(confidence * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: CELLS }, (_, i) => (
            <span
              key={i}
              className="conf-meter__cell"
              style={i < filled ? { background: color } : undefined}
            />
          ))}
        </span>
      </span>
    </div>
  )
}
