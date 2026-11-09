import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FamilyScores } from '../../types/api'

const FAM_LABEL: Record<string, string> = {
  instruction_override: 'Instruction Override',
  role_play_jailbreak: 'Role Play / Jailbreak',
  delimiter_escape: 'Delimiter Escape',
  encoding_obfuscation: 'Encoding / Obfuscation',
  context_exfiltration: 'Context Exfiltration',
  indirect_injection: 'Indirect Injection',
}

const SHORT_LABEL: Record<string, string> = {
  instruction_override: 'Override',
  role_play_jailbreak: 'Role Play',
  delimiter_escape: 'Delimiter',
  encoding_obfuscation: 'Encoding',
  context_exfiltration: 'Exfiltration',
  indirect_injection: 'Indirect',
}

interface Props {
  scores: FamilyScores
}

export default function FamilyScoresChart({ scores }: Props) {
  const entries = Object.entries(scores) as [string, number][]
  if (entries.length === 0) return null

  const topScore = Math.max(...entries.map(([, v]) => v))

  const data = entries
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      key,
      name: SHORT_LABEL[key] ?? key,
      fullName: FAM_LABEL[key] ?? key,
      value: Math.round(value * 100),
      isTop: value === topScore && value > 0,
    }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--color-text-subtle)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: 'var(--color-text-subtle)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value, _name, props) => [
            `${value ?? 0}%`,
            (props.payload as { fullName?: string } | undefined)?.fullName ?? '',
          ]}
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.isTop ? 'var(--color-blocked, #ef4444)' : 'var(--color-accent, #6366f1)'}
              opacity={entry.isTop ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
