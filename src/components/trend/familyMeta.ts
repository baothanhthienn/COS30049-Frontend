import type { AttackFamily } from '../../types/api'

export const FAMILY_META: Record<AttackFamily, { label: string; color: string }> = {
  instruction_override:   { label: 'Instruction Override',   color: '#e05c5c' },
  role_play_jailbreak:    { label: 'Role-Play Jailbreak',    color: '#e08c3c' },
  delimiter_escape:       { label: 'Delimiter Escape',       color: '#d4c24a' },
  encoding_obfuscation:   { label: 'Encoding Obfuscation',   color: '#4aad8c' },
  context_exfiltration:   { label: 'Context Exfiltration',   color: '#5b8de0' },
  indirect_injection:     { label: 'Indirect Injection',     color: '#a06cd4' },
  benign:                 { label: 'Benign',                  color: '#10a37f' },
}
