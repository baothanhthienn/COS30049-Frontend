import type { AttackFamily } from '../types/api'

const ORDERED_FAMILIES: AttackFamily[] = [
  'instruction_override',
  'role_play_jailbreak',
  'delimiter_escape',
  'encoding_obfuscation',
  'context_exfiltration',
  'indirect_injection',
]

const FAMILY_ALIASES: Record<string, AttackFamily> = {
  encoding_evasion:   'encoding_obfuscation',
  role_hijack:        'role_play_jailbreak',
  social_engineering: 'indirect_injection',
  data_exfiltration:  'context_exfiltration',
  filter_bypass:      'delimiter_escape',
  prompt_injection:   'instruction_override',
}

export function normaliseFamily(raw: string): AttackFamily {
  if (FAMILY_ALIASES[raw]) return FAMILY_ALIASES[raw]
  if ((ORDERED_FAMILIES as string[]).includes(raw)) return raw as AttackFamily
  return 'instruction_override'
}
