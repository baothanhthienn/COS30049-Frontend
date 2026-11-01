import { useState } from 'react'
import type { ClassifyResponse, AttackFamily } from '../../types/api'
import VerdictBadge from '../verdict/VerdictBadge'
import SpanHighlighter from '../verdict/SpanHighlighter'
import FamilyBreakdown from '../verdict/FamilyBreakdown'
import './AssistantResponse.css'

interface Props {
  result: ClassifyResponse
  userText: string
}

export default function AssistantResponse({ result, userText }: Props) {
  const [activeFamily, setActiveFamily] = useState<AttackFamily | null>(null)

  function handleFamilyClick(fam: AttackFamily) {
    setActiveFamily((prev) => (prev === fam ? null : fam))
  }

  const isBlocked = result.verdict === 'BLOCKED'

  return (
    <div className={`asst-response asst-response--${result.verdict.toLowerCase()}`}>
      <VerdictBadge verdict={result.verdict} confidence={result.confidence} />

      {isBlocked && result.trigger_spans.length > 0 && (
        <>
          <p className="asst-response__section-head">Why this was flagged</p>
          <SpanHighlighter
            text={userText}
            spans={result.trigger_spans}
            activeFamily={activeFamily}
            onSpanClick={handleFamilyClick}
          />
          <FamilyBreakdown
            scores={result.family_scores}
            activeFamily={activeFamily}
            onFamilyClick={handleFamilyClick}
          />
        </>
      )}

      {!isBlocked && (
        <p className="asst-response__benign-note">
          No injection signal detected. Stage A gate scored below the threshold.
        </p>
      )}

      <p className="asst-response__meta">
        {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' · '}model {result.model_version}
      </p>
    </div>
  )
}
