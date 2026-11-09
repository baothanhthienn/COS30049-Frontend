import type { AttackFamily, FamilyScores } from '../../types/api'
import './FamilyBreakdown.css'

const FAM_LABEL: Record<string, string> = {
  instruction_override: 'Instruction Override',
  role_play_jailbreak: 'Role Play / Jailbreak',
  delimiter_escape: 'Delimiter Escape',
  encoding_obfuscation: 'Encoding Obfuscation',
  context_exfiltration: 'Context Exfiltration',
  indirect_injection: 'Indirect Injection',
}

const FAM_ICON: Record<string, string> = {
  instruction_override: '⊘',
  role_play_jailbreak: '⬡',
  delimiter_escape: '◈',
  encoding_obfuscation: '◎',
  context_exfiltration: '◇',
  indirect_injection: '⊡',
}

interface Props {
  scores: FamilyScores
  activeFamily: AttackFamily | null
  onFamilyClick: (family: AttackFamily) => void
}

export default function FamilyBreakdown({ scores, activeFamily, onFamilyClick }: Props) {
  const entries = Object.entries(scores) as [AttackFamily, number][]
  const sorted = entries.sort((a, b) => b[1] - a[1])
  const topScore = sorted[0]?.[1] ?? 1

  return (
    <div className="family-breakdown" aria-label="Attack family scores">
      {sorted.map(([fam, score]) => {
        const isActive = activeFamily === null || activeFamily === fam
        const isTop = score === topScore && score > 0
        return (
          <button
            key={fam}
            className={`fam-row ${isTop ? 'fam-row--top' : ''}`}
            style={{ opacity: isActive ? 1 : 0.35 }}
            onClick={() => onFamilyClick(fam)}
            aria-pressed={activeFamily === fam}
            aria-label={`${FAM_LABEL[fam]}: ${(score * 100).toFixed(0)}%`}
          >
            <span className="fam-row__icon" aria-hidden="true">{FAM_ICON[fam]}</span>
            <span className="fam-row__label">{FAM_LABEL[fam]}</span>
            <div className="fam-row__bar-track">
              <div
                className="fam-row__bar"
                style={{ width: `${score * 100}%` }}
              />
            </div>
            <span className="fam-row__score">{(score * 100).toFixed(0)}%</span>
          </button>
        )
      })}
    </div>
  )
}
