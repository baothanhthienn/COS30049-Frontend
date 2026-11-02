import type { AttackFamily } from '../../types/api'
import { FAMILY_META } from './familyMeta'
import './FamilyFilterChips.css'

interface Props {
  active: Set<AttackFamily>
  onChange: (next: Set<AttackFamily>) => void
}

export default function FamilyFilterChips({ active, onChange }: Props) {
  const families = Object.keys(FAMILY_META) as AttackFamily[]

  function toggle(f: AttackFamily) {
    const next = new Set(active)
    if (next.has(f)) {
      if (next.size === 1) return // keep at least one active
      next.delete(f)
    } else {
      next.add(f)
    }
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(families))
  }

  const allActive = active.size === families.length

  return (
    <div className="fam-chips" role="group" aria-label="Filter by attack family">
      {families.map((f) => {
        const meta = FAMILY_META[f]
        const on = active.has(f)
        return (
          <button
            key={f}
            className={`fam-chip${on ? ' fam-chip--active' : ''}`}
            style={{ '--chip-color': meta.color } as React.CSSProperties}
            onClick={() => toggle(f)}
            aria-pressed={on}
            title={meta.label}
          >
            <span className="fam-chip__dot" aria-hidden="true" />
            <span className="fam-chip__label">{meta.label}</span>
          </button>
        )
      })}
      {!allActive && (
        <button className="fam-chip fam-chip--all" onClick={selectAll}>
          Show all
        </button>
      )}
    </div>
  )
}
