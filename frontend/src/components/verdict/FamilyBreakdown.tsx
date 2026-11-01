import type { AttackFamily, FamilyScores } from '../../types/api'
import './FamilyBreakdown.css'

const FAM_VAR: Record<string, string> = {
  instruction_override: 'var(--fam-instruction_override)',
  role_play_jailbreak: 'var(--fam-role_play_jailbreak)',
  delimiter_escape: 'var(--fam-delimiter_escape)',
  encoding_obfuscation: 'var(--fam-encoding_obfuscation)',
  context_exfiltration: 'var(--fam-context_exfiltration)',
  indirect_injection: 'var(--fam-indirect_injection)',
}

const FAM_LABEL: Record<string, string> = {
  instruction_override: 'Instruction Override',
  role_play_jailbreak: 'Role Play / Jailbreak',
  delimiter_escape: 'Delimiter Escape',
  encoding_obfuscation: 'Encoding Obfuscation',
  context_exfiltration: 'Context Exfiltration',
  indirect_injection: 'Indirect Injection',
}

interface Props {
  scores: FamilyScores
  activeFamily: AttackFamily | null
  onFamilyClick: (family: AttackFamily) => void
}

export default function FamilyBreakdown({ scores, activeFamily, onFamilyClick }: Props) {
  const entries = Object.entries(scores) as [AttackFamily, number][]
  const sorted = entries.sort((a, b) => b[1] - a[1])

  return (
    <div className="family-breakdown" aria-label="Attack family scores">
      {sorted.map(([fam, score]) => {
        const isActive = activeFamily === null || activeFamily === fam
        const color = FAM_VAR[fam]
        return (
          <button
            key={fam}
            className="fam-row"
            style={{ opacity: isActive ? 1 : 0.35 }}
            onClick={() => onFamilyClick(fam)}
            aria-pressed={activeFamily === fam}
            aria-label={`${FAM_LABEL[fam]}: ${(score * 100).toFixed(0)}%`}
          >
            <span className="fam-row__label">{FAM_LABEL[fam]}</span>
            <div className="fam-row__bar-track">
              <div
                className="fam-row__bar"
                style={{ width: `${score * 100}%`, background: color }}
              />
            </div>
            <span className="fam-row__score">{(score * 100).toFixed(0)}%</span>
          </button>
        )
      })}
    </div>
  )
}
