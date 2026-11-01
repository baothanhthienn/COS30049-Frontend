import { useState } from 'react'
import type { TriggerSpan, AttackFamily } from '../../types/api'
import './SpanHighlighter.css'

const FAM_VAR: Record<AttackFamily, string> = {
  instruction_override: 'var(--fam-instruction_override)',
  role_play_jailbreak: 'var(--fam-role_play_jailbreak)',
  delimiter_escape: 'var(--fam-delimiter_escape)',
  encoding_obfuscation: 'var(--fam-encoding_obfuscation)',
  context_exfiltration: 'var(--fam-context_exfiltration)',
  indirect_injection: 'var(--fam-indirect_injection)',
  benign: 'var(--color-benign)',
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
        const color = FAM_VAR[seg.span.family]
        return (
          <button
            key={i}
            className="span-token"
            style={{
              background: isActive ? color + '33' : 'transparent',
              borderBottom: `2px solid ${isActive ? color : 'transparent'}`,
              color: isActive ? color : 'var(--color-text-subtle)',
              transition: 'all 0.15s',
            }}
            aria-label={`Trigger: ${seg.text} (${seg.span.family.replace(/_/g, ' ')})`}
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
