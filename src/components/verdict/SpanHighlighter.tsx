import type { TriggerSpan, AttackFamily } from '../../types/api'
import './SpanHighlighter.css'


const WEIGHT_CLASS: Record<number, string> = {
  1: 'span-token--w1',
  2: 'span-token--w2',
  3: 'span-token--w3',
}

interface Props {
  text: string
  spans: TriggerSpan[]
  activeFamily: AttackFamily | null
  onSpanClick: (family: AttackFamily) => void
}

export default function SpanHighlighter({ text, spans, activeFamily, onSpanClick }: Props) {
  const sorted = [...spans].sort((a, b) => a.start - b.start)

  const segments: Array<{ text: string; span?: TriggerSpan }> = []
  let cursor = 0
  for (const span of sorted) {
    if (span.start > cursor) {
      segments.push({ text: text.slice(cursor, span.start) })
    }
    segments.push({ text: text.slice(span.start, span.end), span })
    cursor = span.end
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }

  return (
    <p className="span-highlighter">
      {segments.map((seg, i) => {
        if (!seg.span) return <span key={i}>{seg.text}</span>
        const isActive = activeFamily === null || seg.span.family === activeFamily
        const weight = Math.min(Math.max(Math.round(seg.span.weight * 3), 1), 3)
        const wClass = WEIGHT_CLASS[weight] ?? 'span-token--w1'
        return (
          <button
            key={i}
            className={`span-token ${wClass} ${isActive ? '' : 'span-token--dim'}`}
            aria-label={`Trigger: ${seg.text} (${seg.span.family.replace(/_/g, ' ')})`}
            aria-pressed={activeFamily === seg.span.family}
            onClick={() => onSpanClick(seg.span!.family)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSpanClick(seg.span!.family)
              }
            }}
          >
            {seg.text}
          </button>
        )
      })}
    </p>
  )
}
