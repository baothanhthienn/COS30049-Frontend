import type { AttackFamily } from '../types/api'

const KNOWN_FAMILIES: AttackFamily[] = [
  'instruction_override',
  'role_play_jailbreak',
  'delimiter_escape',
  'encoding_obfuscation',
  'context_exfiltration',
  'indirect_injection',
]

export interface AttackExample {
  family: AttackFamily
  example: string
}

/**
 * Scans markdown text for a table whose first column is a known attack-family name
 * and whose last column contains an example prompt. Returns the extracted pairs,
 * or null when no such table is found.
 *
 * Compatible with the test.md format:
 *   | family | ... | ... | example text |
 */
export function parseAttackExamples(text: string): AttackExample[] | null {
  const examples: AttackExample[] = []

  for (const line of text.split('\n')) {
    const cols = line.split('|').map((c) => c.trim())
    // Need at least: '' | family | col | col | example | ''
    if (cols.length < 5) continue

    const family = cols[1] as AttackFamily
    if (!KNOWN_FAMILIES.includes(family)) continue

    // Last non-empty column is the example; strip backtick formatting
    const rawExample = cols[cols.length - 2].replace(/`/g, '').trim()
    if (!rawExample) continue

    examples.push({ family, example: rawExample })
  }

  return examples.length > 0 ? examples : null
}
