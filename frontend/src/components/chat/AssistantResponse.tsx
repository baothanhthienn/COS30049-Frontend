import { useState } from 'react'
import type { ClassifyResponse, AttackFamily } from '../../types/api'
import VerdictBadge from '../verdict/VerdictBadge'
import SpanHighlighter from '../verdict/SpanHighlighter'
import FamilyBreakdown from '../verdict/FamilyBreakdown'
import FamilyScoresChart from '../verdict/FamilyScoresChart'
import './AssistantResponse.css'

interface Props {
  result: ClassifyResponse
  userText: string
  groqReply?: string
  blockedReason?: string
}

export default function AssistantResponse({ result, userText, groqReply, blockedReason }: Props) {
  const [activeFamily, setActiveFamily] = useState<AttackFamily | null>(null)

  function handleFamilyClick(fam: AttackFamily) {
    setActiveFamily((prev) => (prev === fam ? null : fam))
  }

  const isBlocked = result.verdict === 'BLOCKED' || result.verdict === 'BLOCK'
  const hasScores = result.family_scores && Object.keys(result.family_scores).length > 0

  return (
    <div className={`asst-response asst-response--${isBlocked ? 'blocked' : 'allow'}`}>
      <VerdictBadge verdict={result.verdict} confidence={result.confidence} />

      {isBlocked && (
        <>
          {blockedReason && (
            <div className="asst-response__block-banner" role="alert">
              <span className="asst-response__block-banner-icon" aria-hidden="true">⚠</span>
              {blockedReason}
            </div>
          )}

          {(result.trigger_spans ?? []).length > 0 && (
            <>
              <p className="asst-response__section-head">Why this was flagged</p>
              <SpanHighlighter
                text={userText}
                spans={result.trigger_spans ?? []}
                activeFamily={activeFamily}
                onSpanClick={handleFamilyClick}
              />
            </>
          )}

          {hasScores && (
            <>
              <p className="asst-response__section-head">Predicted Attack Families</p>
              <FamilyScoresChart scores={result.family_scores} />
              <FamilyBreakdown
                scores={result.family_scores}
                activeFamily={activeFamily}
                onFamilyClick={handleFamilyClick}
              />
            </>
          )}

          {groqReply && (
            <>
              <p className="asst-response__section-head">Suggested response</p>
              <p className="asst-response__groq-reply asst-response__groq-reply--blocked">
                {groqReply}
              </p>
            </>
          )}
        </>
      )}

      {!isBlocked && (
        <>
          {groqReply ? (
            <p className="asst-response__groq-reply">{groqReply}</p>
          ) : (
            <p className="asst-response__benign-note">
              No injection signal detected. Stage A gate scored below the threshold.
            </p>
          )}
        </>
      )}

      <p className="asst-response__meta">
        {(() => { const d = new Date(result.created_at); return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' })()}
        model {result.model_version}
      </p>
    </div>
  )
}
