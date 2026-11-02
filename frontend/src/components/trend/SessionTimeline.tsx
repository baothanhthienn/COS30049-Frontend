import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import type { TrendPoint, AttackFamily } from '../../types/api'
import { FAMILY_META } from './familyMeta'
import './SessionTimeline.css'

interface Props {
  points: TrendPoint[]
  activeFilters: Set<AttackFamily>
  onPointClick?: (point: TrendPoint) => void
}

interface PlotPoint {
  x: number
  y: number
  verdict: string
  family: AttackFamily
  label: string
  raw: TrendPoint
}

const SHAPE_MAP: Record<string, string> = {
  instruction_override: 'circle',
  role_play_jailbreak:  'triangle',
  delimiter_escape:     'diamond',
  encoding_obfuscation: 'cross',
  context_exfiltration: 'star',
  indirect_injection:   'wye',
  benign:               'circle',
}

function CustomShape(props: {
  cx?: number; cy?: number; payload?: PlotPoint; onClick?: (p: PlotPoint) => void
}) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  const color = payload.verdict === 'BLOCKED'
    ? FAMILY_META[payload.family]?.color ?? '#e05c5c'
    : 'var(--color-benign)'
  const shape = SHAPE_MAP[payload.family] ?? 'circle'
  const size = 6

  const handleClick = () => props.onClick?.(payload)

  if (shape === 'triangle') {
    const pts = `${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`
    return <polygon points={pts} fill={color} opacity={0.85} onClick={handleClick} style={{ cursor: 'pointer' }} aria-label={payload.label} />
  }
  if (shape === 'diamond') {
    const pts = `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`
    return <polygon points={pts} fill={color} opacity={0.85} onClick={handleClick} style={{ cursor: 'pointer' }} aria-label={payload.label} />
  }
  return <circle cx={cx} cy={cy} r={size} fill={color} opacity={0.85} onClick={handleClick} style={{ cursor: 'pointer' }} aria-label={payload.label} />
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PlotPoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const meta = FAMILY_META[p.family]
  const time = new Date(p.raw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="timeline-tooltip">
      <div className="timeline-tooltip__verdict" data-verdict={p.verdict}>
        {p.verdict}
      </div>
      <div className="timeline-tooltip__row">
        <span style={{ color: meta?.color }}>{meta?.label ?? p.family}</span>
      </div>
      <div className="timeline-tooltip__row timeline-tooltip__conf">
        Confidence: {Math.round(p.y * 100)}%
      </div>
      <div className="timeline-tooltip__time">{time}</div>
      <div className="timeline-tooltip__hint">Click to view in chat ↗</div>
    </div>
  )
}

export default function SessionTimeline({ points, activeFilters, onPointClick }: Props) {
  if (points.length === 0) {
    return (
      <div className="timeline timeline--empty">
        <p>No analysis results yet. Submit a prompt to see the trend.</p>
      </div>
    )
  }

  const filtered = points.filter((p) => activeFilters.has(p.attack_family))

  const plotData: PlotPoint[] = filtered.map((p, i) => ({
    x: i,
    y: p.confidence,
    verdict: p.verdict,
    family: p.attack_family,
    label: `${p.verdict} · ${FAMILY_META[p.attack_family]?.label ?? p.attack_family} · ${Math.round(p.confidence * 100)}%`,
    raw: p,
  }))

  const blocked = plotData.filter((p) => p.verdict === 'BLOCKED')
  const allowed = plotData.filter((p) => p.verdict === 'ALLOW')

  const families = [...new Set(filtered.map((p) => p.attack_family))]

  return (
    <div className="timeline">
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-divider)"
            opacity={0.5}
          />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 11, fill: 'var(--color-text-subtle)' }}
            label={{ value: 'Message #', position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 11, fill: 'var(--color-text-subtle)' }}
            label={{ value: 'Confidence', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{value}</span>
            )}
            payload={families.map((f) => ({
              value: FAMILY_META[f]?.label ?? f,
              type: 'circle' as const,
              color: FAMILY_META[f]?.color ?? '#888',
            }))}
          />
          <Brush
            dataKey="x"
            height={20}
            stroke="var(--color-border)"
            fill="var(--color-raised)"
            travellerWidth={6}
            startIndex={Math.max(0, plotData.length - 20)}
          />

          {/* BLOCKED points */}
          <Scatter
            name="BLOCKED"
            data={blocked}
            shape={(props: Record<string, unknown>) => (
              <CustomShape
                {...(props as { cx?: number; cy?: number; payload?: PlotPoint })}
                onClick={(p) => onPointClick?.(p.raw)}
              />
            )}
          >
            {blocked.map((entry, i) => (
              <Cell key={i} fill={FAMILY_META[entry.family]?.color ?? '#e05c5c'} />
            ))}
          </Scatter>

          {/* ALLOW points */}
          <Scatter
            name="ALLOW"
            data={allowed}
            shape={(props: Record<string, unknown>) => (
              <CustomShape
                {...(props as { cx?: number; cy?: number; payload?: PlotPoint })}
                onClick={(p) => onPointClick?.(p.raw)}
              />
            )}
          >
            {allowed.map((_, i) => (
              <Cell key={i} fill="var(--color-benign)" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
